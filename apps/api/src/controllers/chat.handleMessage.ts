import { Request, Response } from "express";
export const handlechat=(req:Request,res:Response)=>{
    res.status(200).json({
        message:"i  need to handle chat"
    })
}
