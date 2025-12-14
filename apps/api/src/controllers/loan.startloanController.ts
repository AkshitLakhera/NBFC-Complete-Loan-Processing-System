import { Request,Response } from "express";
export const startLoan=(req:Request,res:Response)=>{
    res.status(200).json({
        message:"starting loan processs"
    })
}
