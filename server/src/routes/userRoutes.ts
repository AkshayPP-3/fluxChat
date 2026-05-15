import express from "express";
import { getAllUsers,
         getUserById,
         searchUsers   
 } from "../controllers/userController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/",protect,getAllUsers);

router.get("/:id",protect,getUserById);

router.get("/search",protect,searchUsers);

export default router;