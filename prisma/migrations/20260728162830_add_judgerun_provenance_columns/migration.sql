-- AlterTable
ALTER TABLE "JudgeRun" ADD COLUMN     "criteriaVersion" INTEGER,
ADD COLUMN     "gitCommitSha" TEXT,
ADD COLUMN     "promptVersion" INTEGER;

