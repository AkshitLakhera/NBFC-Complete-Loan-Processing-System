import { Router } from "express"; //named import
import { startLoan } from "../controllers/loan.startloanController";
import { getLoanStatus } from "../controllers/loan.getLoanStatus.controller";
const router = Router();
router.post("/start",startLoan); // startLoan
router.get("/status/:loanId",getLoanStatus); // getLoanStatus
export default router;
