import dotenv from "dotenv";
import { app } from "./app";

dotenv.config();

const PORT = Number(process.env.PORT) || 3001;

console.log("Starting server...");

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
