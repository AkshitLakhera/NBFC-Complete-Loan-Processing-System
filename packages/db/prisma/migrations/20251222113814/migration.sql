/*
  Warnings:

  - You are about to drop the column `monthlyincome` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Loan` table. All the data in the column will be lost.
  - Changed the type of `status` on the `Document` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `loan_type` to the `Loan` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `Loan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `VerificationResult` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('INITIATED', 'DETAILS_IN_PROGRESS', 'DETAILS_COLLECTED', 'KYC_IN_PROGRESS', 'KYC_VERIFICATION', 'VERIFIED', 'UNDERWRITING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "KycStep" AS ENUM ('PAN_PENDING', 'AADHAAR_PENDING', 'SALARY_SLIP_PENDING', 'REUPLOAD_REQUIRED', 'KYC_COMPLETE');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED');

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "status",
ADD COLUMN     "status" "DocumentStatus" NOT NULL;

-- AlterTable
ALTER TABLE "Loan" DROP COLUMN "monthlyincome",
DROP COLUMN "type",
ADD COLUMN     "kyc_step" "KycStep",
ADD COLUMN     "loan_type" TEXT NOT NULL,
ADD COLUMN     "monthly_income" INTEGER,
DROP COLUMN "status",
ADD COLUMN     "status" "LoanStatus" NOT NULL;

-- AlterTable
ALTER TABLE "VerificationResult" DROP COLUMN "status",
ADD COLUMN     "status" "VerificationStatus" NOT NULL;
