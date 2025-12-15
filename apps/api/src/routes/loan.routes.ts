import { Router } from "express"; //named import
import { startLoan } from "../controllers/loan.startloanController";
import { getLoanStatus } from "../controllers/loan.getLoanStatus.controller";
const router = Router();
// router.post("/start",startLoan); // startLoan for now it is for start long in hybrid approach.
// router.get("/status/:loanId",getLoanStatus); // getLoanStatus //Don't need right now as it is for
//admin to facilitate
export default router;
