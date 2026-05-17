import {Server} from "socket.io";
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

        socket.on("send_message",(data)=>{
            console.log("Socket - Received send_message:", data);
            io.to(data.conversationId).emit("receive_message",{
                conversationId: data.conversationId,
                message:data.message,
                senderId: data.senderId,
                createdAt: new Date(),
            })
        })

        socket.on("disconnect", ()=>{
            console.log("User disconnected: ",socket.id);
        })
    })
    return io;
}