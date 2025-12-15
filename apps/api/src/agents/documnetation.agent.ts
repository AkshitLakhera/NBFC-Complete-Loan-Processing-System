import { ChatGoogle } from "@langchain/google-gauth";

const model = new ChatGoogle({
  model: "gemma-3-27b-it",
  temperature: 0.2,
});

export async function documentationAgent(message: string): Promise<string> {
  const prompt = `
You are the DOCUMENTATION AGENT.

Your responsibilities:
- Ask user to upload required documents:
  1. PAN image (optional)
  2. Aadhaar image (optional)
  3. Salary slip (mandatory)
- Explain how to upload if needed.
- Confirm when upload is completed.
- Once ALL required documents are uploaded, reply EXACTLY:
  "READY_FOR_UNDERWRITING"

User message: ${message}
`;

  const res = await model.invoke(prompt);
  return res.content as string;
}
