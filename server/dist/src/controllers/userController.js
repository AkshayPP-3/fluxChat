import { prisma } from "../lib/prisma.js";
export const getAllUsers = async (_, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                firstname: true,
                lastname: true,
                username: true,
                avatarUrl: true,
                createdAt: true
            }
        });
        return res.status(200).json(users);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "internal server error" });
    }
};
export const getUserById = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await prisma.user.findUnique({
            where: {
                id
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
        return res.status(500).json({ message: "internal server error" });
    }
};
export const searchUsers = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ message: " search query is required" });
        }
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    {
                        firstname: {
                            contains: query,
                            mode: "insensitive"
                        }
                    },
                    {
                        lastname: {
                            contains: query,
                            mode: "insensitive"
                        }
                    },
                    {
                        username: {
                            contains: query,
                            mode: "insensitive"
                        }
                    }
                ]
            },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                username: true,
                avatarUrl: true
            }
        });
        return res.status(200).json(users);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "internal server error" });
    }
};
export const updateAvatar = async (req, res) => {
    try {
        const userId = req.userId;
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const avatarUrl = `/uploads/${req.file.filename}`;
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { avatarUrl },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                username: true,
                avatarUrl: true
            }
        });
        return res.status(200).json(updatedUser);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "internal server error" });
    }
};
export const updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { firstName, lastName, username } = req.body;
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                firstname: firstName,
                lastname: lastName,
                username
            },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                username: true,
                avatarUrl: true
            }
        });
        return res.status(200).json(updatedUser);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "internal server error" });
    }
};
