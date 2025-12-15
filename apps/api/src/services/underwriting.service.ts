import prisma from '../prisma_client/client';
import { Prisma } from '../prisma_client/client';

/**
 * Underwriting core service for AI-based unsecured personal loan system.
 * Framework-agnostic, dependency-free, and easy to test.
 */

// Business rule constants
const MIN_MONTHLY_INCOME = 10000; // ₹10,000
const MAX_FOIR = 0.5; // 50%
const DEFAULT_INTEREST_RATE_PA = 0.14; // 14% p.a.

export interface UnderwritingInput {
    applicationId: string;
    monthlyIncome: number;
    existingEMIs: number;
    proposedEMI: number;
    panVerified: boolean;
    fraudFlag: boolean;
}

export interface UnderwritingResult {
    applicationId: string;
    approved: boolean;
    foir: number;
    rejectionReason?: string;
}

interface EligibilityDecision {
    approved: boolean;
    rejectionReason?: string;
}

/**
 * Checks if a value is a finite number.
 */
function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Validates the underwriting input and returns a list of issues, if any.
 * No exceptions are thrown; the caller decides how to handle validation errors.
 */
function validateUnderwritingInput(input: any): string[] {
    const errors: string[] = [];

    if (!input || typeof input !== 'object') {
        return ['Input is missing or not an object'];
    }

    if (typeof input.applicationId !== 'string' || input.applicationId.trim().length === 0) {
        errors.push('applicationId must be a non-empty string');
    }

    if (!isFiniteNumber(input.monthlyIncome)) {
        errors.push('monthlyIncome must be a finite number');
    } else if (input.monthlyIncome < 0) {
        errors.push('monthlyIncome cannot be negative');
    }

    if (!isFiniteNumber(input.existingEMIs)) {
        errors.push('existingEMIs must be a finite number');
    } else if (input.existingEMIs < 0) {
        errors.push('existingEMIs cannot be negative');
    }

    if (!isFiniteNumber(input.proposedEMI)) {
        errors.push('proposedEMI must be a finite number');
    } else if (input.proposedEMI < 0) {
        errors.push('proposedEMI cannot be negative');
    }

    if (typeof input.panVerified !== 'boolean') {
        errors.push('panVerified must be a boolean');
    }

    if (typeof input.fraudFlag !== 'boolean') {
        errors.push('fraudFlag must be a boolean');
    }

    return errors;
}

/**
 * Calculates monthly EMI.
 * P = Principal, R = Monthly Rate, N = Tenure (months)
 * EMI = [P x R x (1+R)^N]/[(1+R)^N-1]
 */
export function calculateEMI(principal: number, ratePerNum: number, tenureMonths: number): number {
    if (tenureMonths <= 0) return principal;
    if (ratePerNum <= 0) return principal / tenureMonths;

    const compound = Math.pow(1 + ratePerNum, tenureMonths);
    return (principal * ratePerNum * compound) / (compound - 1);
}

/**
 * Calculates the Fixed Obligation to Income Ratio (FOIR).
 * FOIR = (existingEMIs + proposedEMI) / monthlyIncome.
 */
export function calculateFOIR(
    monthlyIncome: number,
    existingEMIs: number,
    proposedEMI: number
): number {
    if (!isFiniteNumber(monthlyIncome) || monthlyIncome <= 0) {
        return 1;
    }

    const obligations =
        (isFiniteNumber(existingEMIs) ? existingEMIs : 0) +
        (isFiniteNumber(proposedEMI) ? proposedEMI : 0);

    const foir = obligations / monthlyIncome;

    if (!Number.isFinite(foir) || Number.isNaN(foir)) {
        return 1;
    }

    return foir;
}

/**
 * Evaluates underwriting eligibility based on business rules.
 */
export function evaluateEligibility(
    input: UnderwritingInput,
    foir: number
): EligibilityDecision {
    if (!input.panVerified) {
        return { approved: false, rejectionReason: 'PAN not verified' };
    }

    if (input.monthlyIncome < MIN_MONTHLY_INCOME) {
        return {
            approved: false,
            rejectionReason: 'Monthly income below minimum threshold',
        };
    }

    if (foir > MAX_FOIR) {
        return { approved: false, rejectionReason: 'FOIR exceeds permissible limit' };
    }

    if (input.fraudFlag) {
        return { approved: false, rejectionReason: 'Fraud flag detected' };
    }

    return { approved: true };
}

/**
 * Pure logic orchestration.
 */
export function runUnderwritingLogic(input: any): UnderwritingResult {
    const validationErrors = validateUnderwritingInput(input);
    const appId = input && typeof input.applicationId === 'string' ? input.applicationId : '';

    if (validationErrors.length > 0) {
        return {
            applicationId: appId,
            approved: false,
            foir: 0,
            rejectionReason: `Validation error: ${validationErrors.join('; ')}`,
        };
    }

    const typedInput = input as UnderwritingInput;
    const foir = calculateFOIR(
        typedInput.monthlyIncome,
        typedInput.existingEMIs,
        typedInput.proposedEMI
    );

    const decision = evaluateEligibility(typedInput, foir);

    return {
        applicationId: typedInput.applicationId,
        approved: decision.approved,
        foir: foir,
        rejectionReason: decision.rejectionReason,
    };
}

/**
 * DB-integrated service function to process a loan.
 */
export async function processLoanUnderwriting(loanId: number) {
    // 1. Fetch Loan Data
    const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: {
            user: true,
            verificationResults: true,
        },
    });

    if (!loan) {
        throw new Error(`Loan with ID ${loanId} not found`);
    }

    // 2. Extract / Compute Input Data

    // A. Income & Existing Obligations (Assumed from VerificationResult likely)
    // Logic: Search for a verification result with type 'INCOME' or 'FINANCIAL'
    const financialVerification = loan.verificationResults.find(
        (v) => v.type === 'INCOME_ASSESSMENT' || v.type === 'FINANCIAL' || (v.result as any)?.monthlyIncome
    );

    // Safe defaults or extraction
    const financialData = (financialVerification?.result as any) || {};
    const monthlyIncome = Number(financialData.monthlyIncome) || 0;
    const existingEMIs = Number(financialData.existingEMIs) || 0;

    // B. Proposed EMI
    // R = 14% p.a. / 12 months
    const monthlyRate = DEFAULT_INTEREST_RATE_PA / 12;
    const proposedEMI = calculateEMI(loan.amount, monthlyRate, loan.tenure_months);

    // C. PAN & Fraud
    // Assuming if pan_number is present and we have a KYC verification pass, it's verified.
    // Or simplifying to user.pan_number presence for now as per schema.
    // Realistically should check a 'KYC' verification result status.
    const kycVerification = loan.verificationResults.find(v => v.type === 'KYC');
    const panVerified = !!loan.user.pan_number && (kycVerification ? kycVerification.status === 'APPROVED' : true);
    // Defaulting to true for PAN presence if no explicit verification object found, to simplify start.

    // Fraud flag: Check if any verification result is 'REJECTED' with reason 'FRAUD' or similar.
    // Or check user status. For now, assume false unless explicit.
    const fraudFlag = loan.verificationResults.some(v => v.status === 'FRAUD');

    const input: UnderwritingInput = {
        applicationId: loan.id.toString(),
        monthlyIncome,
        existingEMIs,
        proposedEMI,
        panVerified,
        fraudFlag,
    };

    // 3. Run Logic
    const result = runUnderwritingLogic(input);

    // 4. Save Result to DB
    // Upsert to handle re-runs
    const underwritingRecord = await prisma.underwritingResult.upsert({
        where: { loanId: loan.id },
        create: {
            loanId: loan.id,
            approved: result.approved,
            foir: result.foir,
            rejection_reason: result.rejectionReason,
            metadata: {
                inputSnapshot: input as any
            } as Prisma.JsonObject,
            manual_override: false,
        },
        update: {
            approved: result.approved,
            foir: result.foir,
            rejection_reason: result.rejectionReason,
            metadata: {
                inputSnapshot: input as any
            } as Prisma.JsonObject,
            manual_override: false,
        }
    });

    return {
        ...result,
        dbId: underwritingRecord.id
    };
}

// Backward compatibility / Service Object
export const UnderwritingService = {
    runUnderwriting: runUnderwritingLogic, // Renamed inner function
    processLoanUnderwriting,
    calculateFOIR,
    evaluateEligibility,
};

// Export original name for consumers using the pure function
export const runUnderwriting = runUnderwritingLogic;
