import { Router } from "express";
import { uploadDocument } from "../controllers/document.uploadDocumentController";
import { getDocuments } from "../controllers/document.getDocumentsController";
import { upload } from "../middleware/upload.multer.middleware";

const router = Router();
router.post("/upload", upload.single("file"),uploadDocument);//, uploadDocument
router.get("/:loanId",getDocuments);// getDocuments
export default router;
