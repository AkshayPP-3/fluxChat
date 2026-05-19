import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import jwt from "jsonwebtoken";
export const registerUser = async (req, res) => {
    try {
        const { firstname, lastname, username, password, confirmPassword } = req.body;
        if (!firstname || !lastname || !username || !password || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "password do not match" });
        }
        const existingUser = await prisma.user.findUnique({
            where: { username }
        });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        //create user
        const user = await prisma.user.create({
            data: {
                firstname,
                lastname,
                username,
                password: hashedPassword
            }
        });
        // Generate token so frontend can login immediately
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        return res.status(201).json({ message: "user register successfully",
            token,
            user: {
                id: user.id,
                firstname: user.firstname,
                lastname: user.lastname,
                username: user.username,
                avatarUrl: user.avatarUrl
            }
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const user = await prisma.user.findUnique({
            where: { username }
        });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        //compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        //generate jwt
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                firstname: user.firstname,
                lastname: user.lastname,
                username: user.username,
                avatarUrl: user.avatarUrl
            },
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                username: true,
                avatarUrl: true,
                createdAt: true
            }
        });
        if (!user) {
            return res.status(404).json({ message: "user not found" });
        }
        return res.status(200).json(user);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
