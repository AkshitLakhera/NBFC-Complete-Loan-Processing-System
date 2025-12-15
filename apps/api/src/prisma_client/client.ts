import { client as prisma } from "@repo/db";

// Now you can use prisma anywhere in your app
export default prisma;
export * from "@repo/db";
