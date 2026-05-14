import type { Request,Response } from "express";
import {prisma} from "../lib/prisma.js";
import { use } from "react";

export const getAllUsers = async (_:Request,res: Response)=>{
    try{
        const users = await prisma.user.findMany({
            select: {
                id: true,
                firstname: true,
                lastname: true,
                username: true,
                createdAt: true
            }
        })
        return res.status(200).json(users);
    }catch(error){
        console.log(error);
        return res.status(500).json({message: "internal server error"});
    }
}

export const getUserById = async(req:Request,res:Response)=>{
    try{
        const id = req.params.id as string;
        const user = await prisma.user.findUnique({
            where: {
                id
            },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                username: true,
                createdAt: true
            }
        })
        if(!user){
            return res.status(404).json({message: "user not found"})
        }
        return res.status(200).json(user);
    }catch(error){
        console.log(error);
        return res.status(500).json({message: "internal server error"})
    }
}