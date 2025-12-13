import { Router } from "express";
//creating a lightweight handler
const router =Router();
router.post("/start");
router.post("/message");
export default router;
