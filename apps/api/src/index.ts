import "dotenv/config";  
import { app } from "./app";

const PORT = Number(process.env.PORT) || 3001;

console.log("Starting server...");
console.log("DB URL at Prisma init:", process.env.DATABASE_URL);

app.listen(PORT, () => {
  console.log(`API Server listening on port ${PORT}`);
});
