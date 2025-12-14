import { Request,Response } from "express";
import { uploadImage } from "../services/document.uploadDocumentService";
export const uploadDocument=async (req:Request,res:Response)=>{
   try{
    const filepath=req.file?.path;
    if(!filepath){
        return res
        .status(400)
        .json({ error: "File not found" });
    }
    const cloudinaryUrl=await uploadImage(filepath);
    return res.status(200).json({
        message: "Document uploaded successfully",
        url: cloudinaryUrl,
      });
   }catch (error) {
    return res.status(500).json({
      error: "Upload failed",
    });
  }
}
