/*
  Warnings:

  - You are about to drop the column `reason` on the `UnderwritingResult` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `UnderwritingResult` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `UnderwritingResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UnderwritingResult" DROP COLUMN "reason",
DROP COLUMN "score",
ADD COLUMN     "credit_score" INTEGER,
ADD COLUMN     "foir" DOUBLE PRECISION,
ADD COLUMN     "internal_score" DOUBLE PRECISION,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
