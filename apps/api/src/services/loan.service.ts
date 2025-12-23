import {prisma} from "../prisma_client/client";
import { LoanStatus } from "@prisma/client";

//We generally import  enum types from the prisma as it is a good practice
  //to update loan status
export async function updateLoanStatus(
  loanId: number,
  status: LoanStatus
) {
  return prisma.loan.update({
    where: { id: loanId },
    data: { status },
  });
}


// export async function getLoanStatus(userId: number) {
//   const loan = await prisma.loan.findFirst({
//     where: {
//       userId,
//       status: { not: LoanStatus.CLOSED },
//     },
//     orderBy: { created_at: "desc" },
//   });

//   if (!loan) {
//     return { hasLoan: false };
//   }

//   return {
//     hasLoan: true,
//     loanId: loan.id,
//     status: loan.status,
//     type: loan.type,
//     amount: loan.amount,
//     tenure_months: loan.tenure_months,
//   };
// }


// export async function hasActiveLoan(userId: number): Promise<boolean> {
//   const count = await prisma.loan.count({
//     where: {
//       userId,
//       status: {
//         notIn: [LoanStatus.REJECTED, LoanStatus.CLOSED],
//       },
//     },
//   });
//   return count > 0;
// }


// export const markKycPending = (loanId: number) =>
//   updateLoanStatus(loanId, LoanStatus.KYC_PENDING);

// export const markVerificationCompleted = (loanId: number) =>
//   updateLoanStatus(loanId, LoanStatus.VERIFIED);

// export const markUnderwritingStarted = (loanId: number) =>
//   updateLoanStatus(loanId, LoanStatus.UNDERWRITING);

// export const approveLoan = (loanId: number) =>
//   updateLoanStatus(loanId, LoanStatus.APPROVED);

// export const rejectLoan = (loanId: number) =>
//   updateLoanStatus(loanId, LoanStatus.REJECTED);

// export const disburseLoan = (loanId: number) =>
//   updateLoanStatus(loanId, LoanStatus.DISBURSED);

// export const closeLoan = (loanId: number) =>
//   updateLoanStatus(loanId, LoanStatus.CLOSED);

export async function getLoanWithDetails(loanId: number) {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: {
      user: true,
      documents: true,
      verificationResults: true,
      underwriting: true,
      chat: true,
    },
  });
//it should return error
  if (!loan) {
    throw new Error(`Loan not found: ${loanId}`);
  }

  return loan;
}


export async function getUserLoans(userId: number) {
  return prisma.loan.findMany({
    where: { userId },
    orderBy: { created_at: "desc" },
  });
}
//to update loan fields
export async function updateLoanFields(
  loanId: number,
  data: Partial<{
    monthlyincome: number;
    amount: number;
    tenure_months: number;
  }>
) {
  return prisma.loan.update({
    where: { id: loanId },
    data,
  });
}
