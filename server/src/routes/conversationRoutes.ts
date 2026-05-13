import express from "express";
import { getOrCreateConversation,
        getUserConversations,
        getGlobalChat 
} from "../controllers/conversationController";

import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/",protect,getOrCreateConversation);

router.get("/",protect,getUserConversations);

router.get("/global",protect,getGlobalChat);

export default router;