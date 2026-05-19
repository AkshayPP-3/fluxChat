import { prisma } from "../lib/prisma.js";
export const getOrCreateConversation = async (req, res) => {
    try {
        const userId = req.userId;
        const { otherUserId } = req.body;
        if (!otherUserId) {
            return res.status(400).json({ message: "invalid user id" });
        }
        //check if convo already exists
        const existing = await prisma.conversation.findFirst({
            where: {
                isGlobal: false,
                AND: [
                    {
                        participants: {
                            some: { userId }
                        }
                    },
                    {
                        participants: {
                            some: { userId: otherUserId }
                        }
                    }
                ]
            },
            include: {
                participants: true
            }
        });
        if (existing) {
            return res.status(200).json(existing);
        }
        //create new convo
        const conversation = await prisma.conversation.create({
            data: {
                participants: {
                    create: [
                        { userId },
                        { userId: otherUserId }
                    ]
                }
            },
            include: {
                participants: true
            }
        });
        return res.status(201).json(conversation);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const getUserConversations = async (req, res) => {
    try {
        const userId = req.userId;
        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: {
                        userId
                    }
                }
            },
            include: {
                messages: true,
                participants: true
            }
        });
        return res.json(conversations);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "internal server error" });
    }
};
export const getGlobalChat = async (_, res) => {
    try {
        const globalChat = await prisma.conversation.findFirst({
            where: {
                isGlobal: true
            },
            include: {
                messages: {
                    include: {
                        sender: true
                    }
                }
            }
        });
        return res.json(globalChat);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
