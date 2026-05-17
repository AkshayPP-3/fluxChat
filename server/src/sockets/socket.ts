import {Server} from "socket.io";
import { prisma } from "../lib/prisma";

export const initSocket = (server: any)=>{
    const io = new Server(server,{
        cors:{
            origin: "*",
            methods: ["GET","POST"]
        }
    })
    io.on("connection",(socket)=>{
        console.log("user connected:",socket.id);

        socket.on("join_conversation",(conversationId)=>{
            socket.join(conversationId);
            console.log(`Joined room: ${conversationId}`);
        })

        socket.on("send_message", async (data) => {
            console.log("Socket - Received send_message:", data);
            
            try {
                // 1. Ensure the global_room exists in DB
                let conversation = await prisma.conversation.findFirst({
                    where: { isGlobal: true }
                });

                if (!conversation) {
                    conversation = await prisma.conversation.create({
                        data: {
                            id: "general_global", // Constant ID for global chat
                            isGlobal: true
                        }
                    });
                    console.log("Created global conversation in DB");
                }

                // 2. Save message to DB
                const savedMsg = await prisma.message.create({
                    data: {
                        content: data.message,
                        senderId: data.senderId,
                        conversationId: conversation.id
                    }
                });

                // 3. Broadcast to all users
                io.emit("receive_message", {
                    id: savedMsg.id,
                    conversationId: "global_room", // Frontend uses this key
                    message: savedMsg.content,
                    senderId: savedMsg.senderId,
                    createdAt: savedMsg.createdAt,
                });

                console.log("Message saved and broadcasted:", savedMsg.id);
            } catch (err) {
                console.error("Socket Error - Failed to save/broadcast message:", err);
            }
        })

        socket.on("disconnect", ()=>{
            console.log("User disconnected: ",socket.id);
        })
    })
    return io;
}