import { Router } from "express"; //named import
const router = Router();
router.post("/start"); // startLoan
router.get("/status/:loanId"); // getLoanStatus
export default router;
