import { Router } from "express";
import { uploadDocument } from "../controllers/document.uploadDocumentController";
import { getDocuments } from "../controllers/document.getDocumentsController";
const router = Router();
router.post("/upload",uploadDocument);//, uploadDocument
router.get("/:loanId",getDocuments);// getDocuments
export default router;
