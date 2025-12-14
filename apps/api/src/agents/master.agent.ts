import { ChatGoogle } from "@langchain/google-gauth";
import { MasterAgentInput , AgentIntent } from "./types";
import { Messages } from "openai/resources/chat/completions";
const model = new ChatGoogle({
  model: "gemma-3-27b-it",
});

//work:
//classifies intent and and  routes to correct agent
export async function processMessage({
  sessionId,
  message
}: MasterAgentInput): Promise<string>{
  const intent=await checkIntent(message);
  switch (intent) {
    case "SALES":
      return await salesAgent(message);

    case "DOCUMENTATION":
      return await documentationAgent(message);

    case "UNDERWRITING":
      return await underwritingAgent(message);

    default:
      return "Sorry, I couldn't understand your request. Can you rephrase?";
  }

}

async function  checkIntent(message:string):Promise<AgentIntent>{
const res = await model.invoke(`
Classify the user message into exactly ONE category:

- SALES (loan info, EMI, interest, eligibility)
- DOCUMENTATION (KYC, PAN, Aadhaar, uploads)
- UNDERWRITING (risk, approval, income, credit)
- UNKNOWN

Respond ONLY with the category name.

Message:
${message}
`);
const intent = (res.content as string).trim().toUpperCase();

if (
  intent === "SALES" ||
  intent === "DOCUMENTATION" ||
  intent === "UNDERWRITING"
) {
  return intent;
}

return "UNKNOWN";
}