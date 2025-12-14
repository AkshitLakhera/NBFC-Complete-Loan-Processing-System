import { ChatGoogle } from "@langchain/google-gauth";

const model = new ChatGoogle({
  model: "gemma-3-27b-it",
});
export async function processMessage({ message }: { message: string }){
const res = await model.invoke([
  {
    role: "user",
    content:
      "What would be a good company name for a company that makes colorful socks?",
  },
]);
}