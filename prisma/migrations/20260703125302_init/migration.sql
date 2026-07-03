-- CreateEnum
CREATE TYPE "CriterionKind" AS ENUM ('gate', 'comparative');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('A', 'B', 'tie');

-- CreateEnum
CREATE TYPE "DecidedBy" AS ENUM ('gate', 'comparison');

-- CreateTable
CREATE TABLE "Fixture" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "direction" TEXT NOT NULL,
    "conventions" TEXT NOT NULL,
    "fileList" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fixture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Criterion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "kind" "CriterionKind" NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Criterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "configName" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "planJson" JSONB NOT NULL,
    "allGatesPassed" BOOLEAN NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "costUsd" DECIMAL(10,6) NOT NULL,
    "steps" INTEGER NOT NULL,
    "toolCalls" INTEGER NOT NULL,
    "readFileCalls" INTEGER NOT NULL,
    "filesRead" JSONB NOT NULL,

    CONSTRAINT "PlanRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GateResult" (
    "id" TEXT NOT NULL,
    "planRunId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "reasoning" TEXT NOT NULL,

    CONSTRAINT "GateResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comparison" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fixtureName" TEXT NOT NULL,
    "planAId" TEXT NOT NULL,
    "planBId" TEXT NOT NULL,
    "winner" "Verdict" NOT NULL,
    "decidedBy" "DecidedBy" NOT NULL,
    "positionBiased" BOOLEAN NOT NULL,
    "reasoningJson" JSONB NOT NULL,

    CONSTRAINT "Comparison_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Fixture_name_idx" ON "Fixture"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Fixture_name_version_key" ON "Fixture"("name", "version");

-- CreateIndex
CREATE INDEX "Criterion_name_idx" ON "Criterion"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Criterion_name_version_key" ON "Criterion"("name", "version");

-- CreateIndex
CREATE INDEX "PlanRun_configName_idx" ON "PlanRun"("configName");

-- CreateIndex
CREATE INDEX "PlanRun_fixtureId_idx" ON "PlanRun"("fixtureId");

-- CreateIndex
CREATE INDEX "GateResult_planRunId_idx" ON "GateResult"("planRunId");

-- CreateIndex
CREATE INDEX "GateResult_criterionId_idx" ON "GateResult"("criterionId");

-- CreateIndex
CREATE INDEX "GateResult_passed_idx" ON "GateResult"("passed");

-- CreateIndex
CREATE INDEX "Comparison_planAId_idx" ON "Comparison"("planAId");

-- CreateIndex
CREATE INDEX "Comparison_planBId_idx" ON "Comparison"("planBId");

-- AddForeignKey
ALTER TABLE "PlanRun" ADD CONSTRAINT "PlanRun_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GateResult" ADD CONSTRAINT "GateResult_planRunId_fkey" FOREIGN KEY ("planRunId") REFERENCES "PlanRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GateResult" ADD CONSTRAINT "GateResult_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "Criterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comparison" ADD CONSTRAINT "Comparison_planAId_fkey" FOREIGN KEY ("planAId") REFERENCES "PlanRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comparison" ADD CONSTRAINT "Comparison_planBId_fkey" FOREIGN KEY ("planBId") REFERENCES "PlanRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
