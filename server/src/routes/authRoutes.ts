import express from "express";
import { registerUser,loginUser,getCurrentUser } from "../controllers/authController";
import { protect } from "../middleware/authMiddleware.js";
import { getEnabledCategories } from "node:trace_events";

const router = express.Router();

router.post("/register",registerUser);

router.post("/login",loginUser);

router.get("/me",protect,getCurrentUser);

export default router;