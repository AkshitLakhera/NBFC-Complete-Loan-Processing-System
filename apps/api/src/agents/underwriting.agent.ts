import { UnderwritingService } from "../services/underwriting.service";

export async function underwritingAgent(
  message: string,
  loanId: number
): Promise<string> {

  // 1. Run underwriting logic
  const result = await UnderwritingService.processLoanUnderwriting(loanId);

  if (!result.approved) {
    return `
 Your loan could not be approved.

Reason: ${result.rejectionReason}

You may try a lower amount or provide additional documents.
    `;
  }

  return `
 Your loan has been approved!

FOIR: ${(result.foir * 100).toFixed(2)}%

Reply EXACTLY with:
"READY_FOR_SANCTION_LETTER"
  `;
}
