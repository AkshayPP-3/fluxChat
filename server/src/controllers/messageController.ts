import type { Request,Response } from "express";
import { prisma } from "../lib/prisma.js";

export const sendMessage = async (req:Request,res:Response)=>{
    try{
        const userId = (req as any).userId;
        const { conversationId,content} = req.body;

        if(!conversationId || !content){
            return res.status(400).json({message: "all fields are required"})
        }
        const conversation = await prisma.conversation.findUnique({
            where: {id: conversationId}
        })
        if(!conversation){
            return res.status(404).json({message: "conversation not found"})
        }
        const message = await prisma.message.create({
            data: {
                content,
                senderId: userId,
                conversationId
            },
            include: {
                sender: true
            }
        })
        return res.status(201).json(message);
    }catch(error){
        console.log(error);
        return res.status(500).json({message: "internal server error"})
    }
}

export const getMessages = async(req:Request,res:Response)=>{
    try{
        const conversationId=req.params.conversationId as string;
        if(!conversationId){
            return res.status(400).json({message: "all fields are required"})
        }

        const messages = await prisma.message.findMany({
            where: {
                conversationId
            },
            orderBy: {
                createdAt: "asc",
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        username: true
                    }
                }
            }
        })
        return res.status(200).json(messages);
    }catch(error){
        console.log(error)
        return res.status(500).json({message: "internal server error"})
    }
}