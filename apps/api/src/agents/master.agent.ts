import { ChatGoogle } from "@langchain/google-gauth";
import { MasterAgentInput, AgentIntent } from "./types";
import { salesAgent } from "./sale.agent";
import { documentationAgent } from "./documnetation.agent";
import { underwritingAgent } from "./underwriting.agent";

import { verifyPAN, verifyAdhaar ,verifySalarySlip,verifyBankStatement} from "../services/verification.service";
import { getDocumentFromDB } from "../services/verification.service";
import { documentService } from "../services/document.documentService";
const model = new ChatGoogle({
  model: "gemma-3-27b-it",
  temperature: 0.2,
});

export async function processMessagebyagent({
  message,
  loanId,
}: MasterAgentInput): Promise<string> {

  const intent = await checkIntent(message);

  //sales
  if (intent === "SALES") {
    if (!loanId) {
      return "Error: Loan ID is required for sales operations.";
    }
    const reply = await salesAgent(message, loanId);
    return reply;
  }
  //documention
  if (intent === "DOCUMENTATION") {

    const reply = await documentationAgent(message);

    // Only check uploads when agent signals it
    if (reply === "CHECK_UPLOAD_STATUS") {
      if (!loanId) {
        return "Error: Loan ID is required for document verification.";
      }
      const panUploaded = await safeDocCheck(loanId, "PAN");
      const aadhaarUploaded = await safeDocCheck(loanId, "AADHAAR");
      const salarySlipUploaded = await safeDocCheck(loanId, "SALARY_SLIP"); // NEW
     const bankStatementUploaded = await safeDocCheck(loanId, "BANK_STATEMENT")

      if (panUploaded && aadhaarUploaded) {
        // Run actual tools (NO LLM!)
        await verifyPAN(loanId);
        await verifyAdhaar(loanId);
        if (salarySlipUploaded) {
          await verifySalarySlip(loanId);
        }
  
        if (bankStatementUploaded) {
          await verifyBankStatement(loanId);
        }
        
        return "Documents verified successfully. Proceeding to underwriting.";
      }
      return "Some documents are still missing. Please upload PAN and Aadhaar.";
    }
    return reply;
  }
  //underwriting 
  if (intent === "UNDERWRITING") {
    if (!loanId) {
      return "Error: Loan ID is required for underwriting operations.";
    }

    const reply = await underwritingAgent(message, loanId);

    if (reply === "READY_FOR_SANCTION_LETTER") {

      // Generate sanction letter PDF
      const filePath = await documentService.generateSanctionLetter(loanId);

      return `Sanction letter generated successfully: ${filePath}`;
    }

    return reply;
  }

  return "Sorry, I couldn't understand your request.";
}

//helper 
async function safeDocCheck(loanId: number, type: string) {
  try {
    const doc = await getDocumentFromDB(loanId, type);
    return !!doc;
  } catch (err) {
    return false;
  }
}

//intent
async function checkIntent(message: string): Promise<AgentIntent> {
  const res = await model.invoke(`
    Classify the user message into exactly ONE:
    SALES, DOCUMENTATION, UNDERWRITING, UNKNOWN

    Respond ONLY with the category.

    Message: ${message}
  `);

  const raw = getTextContent(res.content);
  const intent = raw.trim().toUpperCase();

  if (intent === "SALES" || intent === "DOCUMENTATION" || intent === "UNDERWRITING") {
    return intent as AgentIntent;
  }

  return "UNKNOWN";
}
// to trim: if not string to handle array
function getTextContent(content: any): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map(block => {
        if (typeof block === "string") return block;
        if ("text" in block) return block.text;
        return "";
      })
      .join("");
  }

  return "";
}
