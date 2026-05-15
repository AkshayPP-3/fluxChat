import express from "express";
import { sendMessage,getMessages } from "../controllers/messageController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();
 
/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a message in a conversation
 *     tags:
 *       - Messages
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *               - content
 *             properties:
 *               conversationId:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Missing fields
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Internal server error
 */
router.post("/",protect,sendMessage);



router.get("/:conversationId",protect,getMessages);

export default router;