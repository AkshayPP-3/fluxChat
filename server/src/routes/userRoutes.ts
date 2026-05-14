import express from "express";
import { getAllUsers,
         getUserById,
         searchUsers   
 } from "../controllers/userController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/",protect,getAllUsers);

router.get("/:id",protect,getUserById);

router.get("/search",protect,searchUsers);

export default router;