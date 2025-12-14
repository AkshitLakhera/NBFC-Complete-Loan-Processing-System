import { Request, Response } from "express";
//creating basic  structure
//it will just take message and forward to access service
export const startchat= async (req:Request,res:Response)=>{
    const session=await chatService.createChatSession();
    res.json({
        sessionId: session.session_id,
        message: "Chat session started"
    });
};
