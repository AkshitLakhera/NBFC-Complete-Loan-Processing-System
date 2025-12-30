import { LoanStatus,KycStep } from "@prisma/client";
type ResponseContext = {
    loanStatus: LoanStatus;
    kycStep?: KycStep;
  };
export function getResponse(context: ResponseContext) {
    const { loanStatus , kycStep}=context;
    if (loanStatus === LoanStatus.KYC_IN_PROGRESS) {
      switch (kycStep) {
        case KycStep.PAN_PENDING:
          return "Please upload your PAN card to continue.";
        case KycStep.AADHAAR_PENDING:
          return "Please upload your Aadhaar card.";
        case KycStep.SALARY_SLIP_PENDING:
          return "Please upload your latest salary slip.";
      }
    }
    return  "All docs are uploaded";
  }