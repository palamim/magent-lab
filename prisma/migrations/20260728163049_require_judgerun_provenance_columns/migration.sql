-- AlterTable
ALTER TABLE "JudgeRun" ALTER COLUMN "criteriaVersion" SET NOT NULL,
ALTER COLUMN "gitCommitSha" SET NOT NULL,
ALTER COLUMN "promptVersion" SET NOT NULL;

