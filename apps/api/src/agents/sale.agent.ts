import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { getLoanWithDetails, updateLoanFields } from "../services/loan.service";

const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!, // from AI Studio
  model: "gemini-1.0-pro",
  temperature: 0.2,
  maxRetries: 0, 

});

export async function salesAgent(message: string, loanId: number): Promise<string> {

  const loan = await getLoanWithDetails(loanId);
  const user = loan.user;

  const prompt = `
You are the SALES AGENT.

Current State:
- Name: ${user?.name ?? "MISSING"}
- PAN: ${user?.pan_number ?? "MISSING"}
- Aadhaar Last4: ${user?.aadhaar_last_4 ?? "MISSING"}
- Monthly Income: ${loan.monthlyincome?? "MISSING"}
- Loan Amount: ${loan.amount ?? "MISSING"}
- Tenure: ${loan.tenure_months ?? "MISSING"}

Rules:
- Ask ONLY for missing fields.
- When ALL fields are collected, reply EXACTLY:
  READY_FOR_VERIFICATION

User: ${message}
`;

  const res = await model.invoke(prompt);
  const reply = res.content as string;

  const updates: any = {};

  // loan-specific fields
  if (message.toLowerCase().includes("income")) {
    const income = message.match(/\b\d{4,7}\b/)?.[0];
    if (income) updates.monthly_income = Number(income);
  }

  if (message.toLowerCase().includes("loan")) {
    const amount = message.match(/\b\d{4,8}\b/)?.[0];
    if (amount) updates.amount = Number(amount);
  }
  const tenure = message.match(/(\d+)\s*(months|month)/i)?.[1];
  if (tenure) updates.tenure_months = Number(tenure);

  if (Object.keys(updates).length > 0) {
    await updateLoanFields(loanId, updates);
  }

  const ready =
    user?.name &&
    user?.pan_number &&
    user?.aadhaar_last_4 &&
    loan.monthlyincome &&
    loan.amount &&
    loan.tenure_months;

  if (ready) return "READY_FOR_VERIFICATION";

  return reply;
}
