import { Request, Response } from "express";
import { chatService } from "../services/chat.chatService";
//creating basic  structure
//it will just take message and forward to access service
export const startchat= async (req:Request,res:Response)=>{
    const session=await chatService.createChatSession();
    res.json({
        sessionId: session.session_token,
        message: "Chat session started"
    });
};
