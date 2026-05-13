import type { Request,Response } from "express";
import {prisma} from "../lib/prisma.js";

export const getAllUsers = async (req:Request,res: Response)=>{
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