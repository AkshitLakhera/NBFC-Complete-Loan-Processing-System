import { ChatGoogle } from "@langchain/google-gauth";

const model = new ChatGoogle({
  model: "gemma-3-27b-it",
  temperature: 0.2,
});

export async function salesAgent(message: string): Promise<string> {
  const prompt = `
You are the SALES AGENT for a loan onboarding chatbot.

Your responsibilities:
- Identify what user information is missing.
- Collect ONE detail at a time.
- Required fields:
  1. Full name
  2. PAN number
  3. Aadhaar last 4 digits
  4. Monthly income
  5. Loan amount
  6. Tenure (in months)

Rules:
- Always ask for missing data.
- Never verify PAN or Aadhaar (other agents do that).
- Once ALL fields are collected, reply EXACTLY with:
  "READY_FOR_VERIFICATION"

User message: ${message}
`;

  const res = await model.invoke(prompt);
  return res.content as string;
}
