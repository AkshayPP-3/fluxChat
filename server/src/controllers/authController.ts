import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js"

export const registerUser = async(req:Request,res:Response)=>{
    try{
        const {firstname, lastname, username,password,confirmPassword}=req.body;
        if(!firstname || !lastname || !username || !password ||!confirmPassword){
            return res.status(400).json({message:"All fields are required"});
        }
        if(password !== confirmPassword){
            return res.status(400).json({message:"password do not match"});
        }
        const existingUser = await prisma.user.findUnique({
            where:{username}
        })
        if(existingUser){
            return res.status(400).json({message:"Username already exists"})    
        }
        const hashedPassword = await bcrypt.hash(password,10);

        //create user
        const user = await prisma.user.create({
            data: {
                firstname,
                lastname,
                username,
                password: hashedPassword
            }
        })
        return res.status(201).json({message:"user register successfully",
            user: {
                id: user.id,
                firstname: user.firstname,
                lastname: user.lastname,
                username: user.username
            }
        })
    }catch(error){
        console.log(error);
        return res.status(500).json({message:"Internal server error"})
    }
}