import { client as prisma } from "@repo/db";

/* ----------------------------------
   Loan status constants
---------------------------------- */
export const LoanStatus = {
  INITIATED: "INITIATED",
  KYC_PENDING: "KYC_PENDING",
  VERIFIED: "VERIFIED",
  UNDERWRITING: "UNDERWRITING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  DISBURSED: "DISBURSED",
  CLOSED: "CLOSED",
} as const;

export type LoanStatusType =
  (typeof LoanStatus)[keyof typeof LoanStatus];

/* ----------------------------------
   1. Create Loan
---------------------------------- */
export async function createLoan(input: {
  userId: number;
  chatId?: number;
  type: string;
  amount: number;
  tenureMonths: number;
}) {
  return prisma.loan.create({
    data: {
      userId: input.userId,
      chatId: input.chatId,
      type: input.type,
      amount: input.amount,
      tenure_months: input.tenureMonths,
      status: LoanStatus.INITIATED,
    },
  });
}

/* ----------------------------------
   2. Update Loan Status
---------------------------------- */
export async function updateLoanStatus(
  loanId: number,
  status: LoanStatusType
) {
  return prisma.loan.update({
    where: { id: loanId },
    data: { status },
  });
}

/* ----------------------------------
   3. Get Active Loan Status (Chatbot)
---------------------------------- */
export async function getLoanStatus(userId: number) {
  const loan = await prisma.loan.findFirst({
    where: {
      userId,
      status: { not: LoanStatus.CLOSED },
    },
    orderBy: { created_at: "desc" },
  });

  if (!loan) {
    return { hasLoan: false };
  }

  return {
    hasLoan: true,
    loanId: loan.id,
    status: loan.status,
    type: loan.type,
    amount: loan.amount,
    tenure_months: loan.tenure_months,
  };
}

/* ----------------------------------
   4. Check Active Loan
---------------------------------- */
export async function hasActiveLoan(userId: number): Promise<boolean> {
  const count = await prisma.loan.count({
    where: {
      userId,
      status: {
        notIn: [LoanStatus.REJECTED, LoanStatus.CLOSED],
      },
    },
  });
  return count > 0;
}

/* ----------------------------------
   5. Loan Lifecycle Helpers
---------------------------------- */
export const markKycPending = (loanId: number) =>
  updateLoanStatus(loanId, LoanStatus.KYC_PENDING);

export const markVerificationCompleted = (loanId: number) =>
  updateLoanStatus(loanId, LoanStatus.VERIFIED);

export const markUnderwritingStarted = (loanId: number) =>
  updateLoanStatus(loanId, LoanStatus.UNDERWRITING);

export const approveLoan = (loanId: number) =>
  updateLoanStatus(loanId, LoanStatus.APPROVED);

export const rejectLoan = (loanId: number) =>
  updateLoanStatus(loanId, LoanStatus.REJECTED);

export const disburseLoan = (loanId: number) =>
  updateLoanStatus(loanId, LoanStatus.DISBURSED);

export const closeLoan = (loanId: number) =>
  updateLoanStatus(loanId, LoanStatus.CLOSED);

/* ----------------------------------
   6. Fetch Loan With Full Context
---------------------------------- */
export async function getLoanWithDetails(loanId: number) {
  return prisma.loan.findUnique({
    where: { id: loanId },
    include: {
      user: true,
      documents: true,
      verificationResults: true,
      underwriting: true,
      chat: true,
    },
  });
}

/* ----------------------------------
   7. Get All Loans of a User
---------------------------------- */
export async function getUserLoans(userId: number) {
  return prisma.loan.findMany({
    where: { userId },
    orderBy: { created_at: "desc" },
  });
}
