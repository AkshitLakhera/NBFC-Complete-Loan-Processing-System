import { Router } from "express";
import { startchat } from "../controllers/chat.startChatSessionController";
import { handlechat } from "../controllers/chat.handleMessage";
//creating a lightweight handler
const router =Router();
router.post("/start",startchat);
router.post("/message",handlechat);
export default router;
