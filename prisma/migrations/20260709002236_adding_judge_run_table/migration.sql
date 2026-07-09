-- CreateEnum
CREATE TYPE "CriterionCategory" AS ENUM ('PROJECT_CONVENTIONS', 'FUNCTIONAL_CORRECTNESS', 'CODE_QUALITY', 'SAFETY_SECURITY', 'TESTING_DOCUMENTATION');

-- CreateTable
CREATE TABLE "JudgeRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "experimentId" TEXT NOT NULL,
    "subjectKey" TEXT NOT NULL,
    "diffKey" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "allMatched" BOOLEAN NOT NULL,
    "agreements" JSONB NOT NULL,

    CONSTRAINT "JudgeRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JudgeRun_experimentId_idx" ON "JudgeRun"("experimentId");

-- CreateIndex
CREATE INDEX "JudgeRun_subjectKey_idx" ON "JudgeRun"("subjectKey");

-- CreateIndex
CREATE INDEX "JudgeRun_diffKey_idx" ON "JudgeRun"("diffKey");
