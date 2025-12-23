import { salesAgent } from "./sale.agent";
import { documentationAgent } from "./documnetation.agent";
import {
  getLoanWithDetails,
  updateLoanStatus,
} from "../services/loan.service";
import { processLoanUnderwriting } from "../services/underwriting.service";
import { documentService } from "../services/document.documentService";
import { LoanStatus } from "@prisma/client";
import { handleDetailsInput ,type DetailsResult } from "../services/handledetailsinput";

export async function processMessagebyagent({
  message,
  loanId,
  userId,
}: {
  message: string;
  loanId: number;
  userId: number;
}): Promise<string>  {

  
  let loan = await getLoanWithDetails(loanId);
  if (!loan) return "Loan not found.";
  if(loan.status==LoanStatus.INITIATED){
    //then sent it to detail in progres state 
    await updateLoanStatus(loanId,LoanStatus.DETAILS_IN_PROGRESS);
    //now lets ask user info
  }
  if(loan.status==LoanStatus.DETAILS_IN_PROGRESS){
    const subState =
    !loan.amount
      ? "AMOUNT_PENDING"
      : !loan.tenure_months
      ? "TENURE_PENDING"
      : !loan.monthly_income
      ? "INCOME_PENDING"
      : null;
      if(!subState){
        await updateLoanStatus(loanId,LoanStatus.DETAILS_COLLECTED);
        return "Details completed. Moving to KYC.";
      }
      //otherwise we need to validate and store
      const result = await handleDetailsInput(loanId, subState, message); 
     //if false came then i need to show error and if correct then move to next state 
     //as things go one by one na
     if(!result.success){
      return result.error;
     }  
     loan=await getLoanWithDetails(loanId);
     const nextSubState =
    !loan.amount
      ? "AMOUNT_PENDING"
      : !loan.tenure_months
      ? "TENURE_PENDING"
      : !loan.monthly_income
      ? "INCOME_PENDING"
      : null;
      if(!nextSubState){
        await updateLoanStatus(loanId,LoanStatus.DETAILS_COLLECTED);
      }
      //need to make it ask questions
     return salesAgent(subState);

     //kyc thing is pending
  }
  


  // if (loan.status === "INITIATED") {
  //   console.log("Sales agent started");

  //   const reply = await salesAgent(message, loanId);

  //   if (reply === "READY_FOR_VERIFICATION") {
  //     await updateLoanStatus(loanId, "KYC_PENDING");
  //     return "Please upload PAN, Aadhaar and Salary Slip.";
  //   }

  //   return reply;
  // }
  // if (loan.status === "KYC_PENDING") {
  //   console.log("Documentation stage");

  //   if (PROTOTYPE_MODE) {
  //     console.log("Prototype mode: assuming documents uploaded");

  //     await updateLoanStatus(loanId, "VERIFIED");

  //     return "Documents uploaded successfully. Loan is under review.";
  //   }
  //   const reply = await documentationAgent(loanId);
  //   return reply;
  // }
  // if (loan.status === "VERIFIED") {
  //   console.log("Underwriting started");

  //   const result = await processLoanUnderwriting(loanId);

  //   if (result.approved) {
  //     await updateLoanStatus(loanId, "APPROVED");
  //     return "Congratulations! Your loan has been approved.";
  //   } else {
  //     await updateLoanStatus(loanId, "REJECTED");
  //     return `Loan rejected: ${result.rejectionReason}`;
  //   }
  // }
  // if (loan.status === "APPROVED") {
  //   console.log("Generating sanction letter");

  //   const filePath = await documentService.generateSanctionLetter(loanId);

  //   return `Your loan is approved. Sanction letter generated: ${filePath}`;
  // }
  // return "Your loan is being processed.";
}



// export async function processMessagebyagent({
//   message,
//   loanId,
//   userId
// }: MasterAgentInput): Promise<string> {


  
//   const intent =  await detectIntent(message);
//   if (!userId) {
//     return "User session not initialized.";
//   }
//   //sales
//   if (intent === "SALES") {
//   let activeLoan = await getLoanStatus(userId);
//   if (!activeLoan.hasLoan) {
//     const loan = await createLoan({
//       userId,
//     });

//     return "Sure! How much loan amount do you need?";
//   }
//   //if does not exists
//   if (!activeLoan.loanId) {
//     return "Loan not created yet.";
//   }
//   return salesAgent(message, activeLoan.loanId);
//   //   return reply;
//   }
//   //documention
//   if (intent === "DOCUMENTATION") {

//     const reply = await documentationAgent(message);

//     // Only check uploads when agent signals it
//     if (reply === "CHECK_UPLOAD_STATUS") {
//       if (!loanId) {
//         return "Error: Loan ID is required for document verification.";
//       }
//       const panUploaded = await safeDocCheck(loanId, "PAN");
//       const aadhaarUploaded = await safeDocCheck(loanId, "AADHAAR");
//       const salarySlipUploaded = await safeDocCheck(loanId, "SALARY_SLIP"); // NEW
//      const bankStatementUploaded = await safeDocCheck(loanId, "BANK_STATEMENT")

//       if (panUploaded && aadhaarUploaded) {
//         // Run actual tools (NO LLM!)
//         await verifyPAN(loanId);
//         await verifyAdhaar(loanId);
//         if (salarySlipUploaded) {
//           await verifySalarySlip(loanId);
//         }
  
//         if (bankStatementUploaded) {
//           await verifyBankStatement(loanId);
//         }
        
//         return "Documents verified successfully. Proceeding to underwriting.";
//       }
//       return "Some documents are still missing. Please upload PAN and Aadhaar.";
//     }
//     return reply;
//   }
//   //underwriting 
//   if (intent === "UNDERWRITING") {
//     if (!loanId) {
//       return "Error: Loan ID is required for underwriting operations.";
//     }

//     const reply = await underwritingAgent(message, loanId);

//     if (reply === "READY_FOR_SANCTION_LETTER") {

//       // Generate sanction letter PDF
//       const filePath = await documentService.generateSanctionLetter(loanId);

//       return `Sanction letter generated successfully: ${filePath}`;
//     }

//     return reply;
//   }

//   return "Sorry, I couldn't understand your request.";
// }

//helper 
// async function safeDocCheck(loanId: number, type: string) {
//   try {
//     const doc = await getDocumentFromDB(loanId, type);
//     return !!doc;
//   } catch (err) {
//     return false;
//   }
// }

//intent : Exploding with enormous  requests hitting .
// async function detectIntent(message: string): Promise<AgentIntent> {
//   const res = await model.invoke(`
//     Classify the user message into exactly ONE:
//     SALES, DOCUMENTATION, UNDERWRITING, UNKNOWN

//     Respond ONLY with the category.

//     Message: ${message}
//   `);

//   const raw = getTextContent(res.content);
//   const intent = raw.trim().toUpperCase();

//   if (intent === "SALES" || intent === "DOCUMENTATION" || intent === "UNDERWRITING") {
//     return intent as AgentIntent;
//   }

//   return "UNKNOWN";
// }
// // to trim: if not string to handle array
// function getTextContent(content: any): string {
//   if (typeof content === "string") return content;

//   if (Array.isArray(content)) {
//     return content
//       .map(block => {
//         if (typeof block === "string") return block;
//         if ("text" in block) return block.text;
//         return "";
//       })
//       .join("");
//   }

//   return "";
// }
