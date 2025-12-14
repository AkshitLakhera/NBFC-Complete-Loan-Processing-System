import { Request,Response } from "express";
export const uploadDocument=(req:Request,res:Response)=>{
    res.status(200).json({
        message:"uploading"
    })
}
