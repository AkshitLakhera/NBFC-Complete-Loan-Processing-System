import { Request, Response } from "express";
import { chatService } from "../services/chat.chatService";
export const handlechat=async (req:Request,res:Response)=>{
    const {sessionId,message}=req.body;
    const reply=await chatService.processMessage(sessionId,message);
    res.json({reply});
}
