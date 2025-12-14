import { Request,Response } from "express";
export const getLoanStatus=(req:Request,res:Response)=>{
    res.status(200).json({
        message:"fetching status"
    })
}
