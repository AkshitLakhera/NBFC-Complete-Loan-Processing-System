import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chat.routes";
import loanRoutes from "./routes/loan.routes";
import documentRoutes from "./routes/document.routes";

export const app = express();

app.use(cors());
app.use(express.json());

// Register routes
app.use("/chat", chatRoutes);
app.use("/loan", loanRoutes);
app.use("/documents", documentRoutes);
