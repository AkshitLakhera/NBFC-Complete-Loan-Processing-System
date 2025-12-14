import { Request,Response } from "express";
export const getDocuments=(req:Request,res:Response)=>{
    res.status(200).json({
        message:"getting docs"
    })
}
