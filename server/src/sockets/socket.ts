import {Server} from "socket.io";
import { prisma } from "../lib/prisma.js";
import { createClient, ReconnectStrategyError } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

export const initSocket = async (server: any)=>{
    //creating new socket server
    const io = new Server(server,{
        //for connecting to front end
        cors:{
            origin: process.env.CLIENT_URL || "*",
            methods: ["GET","POST"]
        }
    })

    // Redis Adapter Setup

    //publisher
    const pubClient = createClient({ 
        url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
        //use this if redis connection is lost
        socket: {
            reconnectStrategy: (retries) => Math.min(retries * 50, 2000)
        }
    });
    
    //subscriber
    const subClient = pubClient.duplicate();

    try {
        await Promise.all([pubClient.connect(), subClient.connect()]);
        io.adapter(createAdapter(pubClient, subClient));
        console.log("Redis adapter connected for Socket.io");
    } catch (err) {
        console.error("Redis connection error:", err);
    }

    const connectedUsers = new Map<string, string>(); // socketId -> userId

    io.on("connection",(socket)=>{
        console.log("user connected:",socket.id);

        socket.on("user_online", (userId) => {
            connectedUsers.set(socket.id, userId);
            io.emit("update_online_users", Array.from(new Set(connectedUsers.values())));
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