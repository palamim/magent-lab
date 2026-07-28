-- DropForeignKey
ALTER TABLE "Comparison" DROP CONSTRAINT "Comparison_runAId_fkey";

-- DropForeignKey
ALTER TABLE "Comparison" DROP CONSTRAINT "Comparison_runBId_fkey";

-- DropForeignKey
ALTER TABLE "GateResult" DROP CONSTRAINT "GateResult_criterionId_fkey";

-- DropForeignKey
ALTER TABLE "GateResult" DROP CONSTRAINT "GateResult_runId_fkey";

-- DropForeignKey
ALTER TABLE "Run" DROP CONSTRAINT "Run_experimentId_fkey";

-- DropForeignKey
ALTER TABLE "Run" DROP CONSTRAINT "Run_fixtureId_fkey";

-- DropForeignKey
ALTER TABLE "Run" DROP CONSTRAINT "Run_subjectId_fkey";

-- DropTable
DROP TABLE "Comparison";

-- DropTable
DROP TABLE "Criterion";

-- DropTable
DROP TABLE "Fixture";

-- DropTable
DROP TABLE "GateResult";

-- DropTable
DROP TABLE "Run";

-- DropTable
DROP TABLE "Subject";

-- DropEnum
DROP TYPE "CriterionKind";

-- DropEnum
DROP TYPE "DecidedBy";

-- DropEnum
DROP TYPE "Verdict";

