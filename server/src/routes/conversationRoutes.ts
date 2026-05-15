import express from "express";
import { getOrCreateConversation,
        getUserConversations,
        getGlobalChat 
} from "../controllers/conversationController";

import { protect } from "../middleware/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * /api/conversations:
 *   post:
 *     summary: Get or create a private conversation
 *     tags:
 *       - Conversations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otherUserId
 *             properties:
 *               otherUserId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Existing conversation found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       201:
 *         description: New conversation created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/",protect,getOrCreateConversation);

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Get all conversations for the authenticated user
 *     tags:
 *       - Conversations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conversation'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/",protect,getUserConversations);

router.get("/global",protect,getGlobalChat);

export default router;