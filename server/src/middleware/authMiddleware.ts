import type { Request,Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const protect = (req: Request,res:Response,next:NextFunction)=>{
    try{
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({message: "not authorized"})
        }
        const token = authHeader.split(" ")[1]!;
        const decoded = jwt.verify(
             token,
             process.env.JWT_SECRET!
        ) as jwt.JwtPayload;

        (req as any).userId= decoded.userId;
        next();
    }catch(error){
        return res.status(401).json({
            message: "Invalid token"
        })
    }
}