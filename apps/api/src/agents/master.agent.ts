// import { salesAgent } from "./sale.agent";
import { documentationAgent } from "./documnetation.agent";
import {
  getLoanWithDetails,
  updateLoanStatus,
} from "../services/loan.service";
import { processLoanUnderwriting } from "../services/underwriting.service";
import { documentService } from "../services/document.documentService";
import { LoanStatus,KycStep } from "@prisma/client";
import { getResponse } from "../services/getResponse";
import { handleDetailsInput ,type DetailsResult } from "../services/handledetailsinput";
import { prisma } from "../prisma_client/client";
import {}
export async function processMessagebyagent({
  message,
  loanId,
  userId,
}: {
  message: string;
  loanId: number;
  userId: number;
}): Promise<string> {

  
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
  } 
  //detail collected
  if(loan.status==LoanStatus.DETAILS_COLLECTED){    
    await prisma.loan.update({
      where:{id:loanId},
      data:{
        status:LoanStatus.KYC_IN_PROGRESS,
        kyc_step:KycStep.PAN_PENDING
      }
    });
    return getResponse({
      loanStatus: LoanStatus.KYC_IN_PROGRESS,
      kycStep: KycStep.PAN_PENDING,
    });
  }   
    //lets start kyc process ask docs
    if (loan.status === LoanStatus.KYC_IN_PROGRESS){
      switch(loan.kyc_step){
          case KycStep.AADHAAR_PENDING:
            return getResponse({
              loanStatus:LoanStatus.KYC_IN_PROGRESS,
              kycStep: KycStep.PAN_PENDING
            });
            case KycStep.PAN_PENDING:
              return getResponse({
              loanStatus: LoanStatus.KYC_IN_PROGRESS,
              kycStep: KycStep.PAN_PENDING,
            });

          case KycStep.SALARY_SLIP_PENDING:
            return getResponse({
              loanStatus: LoanStatus.KYC_IN_PROGRESS,
              kycStep: KycStep.SALARY_SLIP_PENDING,
            });
           case KycStep.KYC_COMPLETE:
              await updateLoanStatus(loanId, LoanStatus.KYC_VERIFICATION);
              return "Documents received. Verification in progress."; 
            }
    }
  }

