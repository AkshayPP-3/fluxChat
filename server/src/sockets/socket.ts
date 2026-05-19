import {Server} from "socket.io";
import { prisma } from "../lib/prisma.js";
import { createClient, ReconnectStrategyError } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

export const initSocket = async (server: any)=>{
    const allowedOrigins = [
        process.env.CLIENT_URL,
        "https://flux-chat-wine.vercel.app",
        "http://localhost:5173"
    ].filter(Boolean) as string[];

    //creating new socket server
    const io = new Server(server,{
        //for connecting to front end
        cors:{
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
                    callback(null, true);
                } else {
                    callback(new Error("Not allowed by CORS"));
                }
            },
            methods: ["GET","POST"],
            credentials: true
        },
        transports: ['websocket', 'polling'],
        allowEIO3: true, // Compatibility
        pingTimeout: 60000,
        pingInterval: 25000
    })

    // Redis Adapter Setup
    let ioAdapter;
    if (process.env.REDIS_URL) {
        const pubClient = createClient({ 
            url: process.env.REDIS_URL,
            socket: {
                connectTimeout: 5000, // 5 seconds max wait
                reconnectStrategy: (retries) => {
                    if (retries > 3) return new Error("Redis connection failed");
                    return Math.min(retries * 100, 1000);
                }
            }
        });
        
        const subClient = pubClient.duplicate();

        try {
            await Promise.all([pubClient.connect(), subClient.connect()]);
            ioAdapter = createAdapter(pubClient, subClient);
            console.log("Successfully connected to Redis for Socket.io adapter");
        } catch (error) {
            console.error("Redis connection error, falling back to in-memory adapter:", error);
        }
    } else {
        console.log("REDIS_URL not provided, using default in-memory adapter");
    }

    if (ioAdapter) {
        io.adapter(ioAdapter);
    }

    const connectedUsers = new Map<string, string>(); // socketId -> userId

    io.on("connection",(socket)=>{
        console.log("user connected:",socket.id);

        socket.on("user_online", (userId) => {
            console.log(`User ${userId} is online on socket ${socket.id}`);
            connectedUsers.set(socket.id, userId);
            const onlineIds = Array.from(new Set(connectedUsers.values()));
            console.log("Broadcasting online users:", onlineIds);
            io.emit("update_online_users", onlineIds);
        });

        socket.on("join_conversation",(conversationId)=>{
            socket.join(conversationId);
            console.log(`Joined room: ${conversationId}`);
        })

        socket.on("send_message", async (data) => {
            console.log("Socket - Received send_message:", data);
            
            try {
                let conversationId = data.conversationId;

                // 1. If it's a global message, ensure global convo exists
                if (conversationId === "global_room") {
                    let conversation = await prisma.conversation.findFirst({
                        where: { isGlobal: true }
                    });

                    if (!conversation) {
                        conversation = await prisma.conversation.create({
                            data: {
                                id: "general_global",
                                isGlobal: true
                            }
                        });
                    }
                    conversationId = conversation.id;
                }

                // 2. Save message to DB
                const savedMsg = await prisma.message.create({
                    data: {
                        content: data.message || null,
                        imageUrl: data.imageUrl || null,
                        senderId: data.senderId,
                        conversationId: conversationId
                    }
                });

                // 3. Broadcast
                if (data.conversationId === "global_room") {
                    io.emit("receive_message", {
                        id: savedMsg.id,
                        conversationId: "global_room",
                        message: savedMsg.content,
                        imageUrl: savedMsg.imageUrl,
                        senderId: savedMsg.senderId,
                        createdAt: savedMsg.createdAt,
                    });
                } else {
                    // Private message - only to participants
                    io.to(data.conversationId).emit("receive_message", {
                        id: savedMsg.id,
                        conversationId: data.conversationId,
                        message: savedMsg.content,
                        imageUrl: savedMsg.imageUrl,
                        senderId: savedMsg.senderId,
                        createdAt: savedMsg.createdAt,
                    });
                }

                console.log("Message saved and broadcasted:", savedMsg.id);
            } catch (err) {
                console.error("Socket Error - Failed to save/broadcast message:", err);
            }
        })

        socket.on("delete_message", async (messageId) => {
            console.log("Socket - Received delete_message:", messageId);
            try {
                await prisma.message.delete({
                    where: { id: messageId }
                });
                io.emit("message_deleted", messageId);
            } catch (err) {
                console.error("Socket Error - Failed to delete message:", err);
            }
        });

        socket.on("disconnect", ()=>{
            console.log("User disconnected: ",socket.id);
            connectedUsers.delete(socket.id);
            io.emit("update_online_users", Array.from(new Set(connectedUsers.values())));
        })
    })
    return io;
}