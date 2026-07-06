-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('planner', 'executor', 'director');

-- CreateEnum
CREATE TYPE "CriterionKind" AS ENUM ('gate', 'comparative');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('A', 'B', 'tie');

-- CreateEnum
CREATE TYPE "DecidedBy" AS ENUM ('gate', 'comparison');

-- CreateTable
CREATE TABLE "Fixture" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "key" TEXT NOT NULL,
    "agentType" "AgentType" NOT NULL,
    "description" TEXT,
    "dir" TEXT NOT NULL,
    "input" JSONB NOT NULL,

    CONSTRAINT "Fixture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "key" TEXT NOT NULL,
    "agentType" "AgentType" NOT NULL,
    "model" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Criterion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "agentType" "AgentType" NOT NULL,
    "kind" "CriterionKind" NOT NULL,
    "version" INTEGER NOT NULL,

    CONSTRAINT "Criterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fixtureId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "steps" INTEGER NOT NULL,
    "toolCalls" INTEGER NOT NULL,
    "readFileCalls" INTEGER NOT NULL,
    "filesRead" JSONB NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "costUsd" DECIMAL(10,6) NOT NULL,
    "output" JSONB NOT NULL,
    "allGatesPassed" BOOLEAN NOT NULL,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GateResult" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "runId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "reasoning" TEXT NOT NULL,

    CONSTRAINT "GateResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comparison" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "runAId" TEXT NOT NULL,
    "runBId" TEXT NOT NULL,
    "winner" "Verdict" NOT NULL,
    "decidedBy" "DecidedBy" NOT NULL,
    "positionBiased" BOOLEAN NOT NULL,
    "reasoning" JSONB NOT NULL,

    CONSTRAINT "Comparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,

    CONSTRAINT "Experiment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Fixture_agentType_idx" ON "Fixture"("agentType");

-- CreateIndex
CREATE UNIQUE INDEX "Fixture_key_agentType_key" ON "Fixture"("key", "agentType");

-- CreateIndex
CREATE INDEX "Subject_agentType_idx" ON "Subject"("agentType");

-- CreateIndex
CREATE INDEX "Subject_model_idx" ON "Subject"("model");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_key_agentType_key" ON "Subject"("key", "agentType");

-- CreateIndex
CREATE INDEX "Criterion_agentType_idx" ON "Criterion"("agentType");

-- CreateIndex
CREATE INDEX "Criterion_name_idx" ON "Criterion"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Criterion_name_version_agentType_key" ON "Criterion"("name", "version", "agentType");

-- CreateIndex
CREATE INDEX "Run_subjectId_idx" ON "Run"("subjectId");

-- CreateIndex
CREATE INDEX "Run_fixtureId_idx" ON "Run"("fixtureId");

-- CreateIndex
CREATE INDEX "GateResult_runId_idx" ON "GateResult"("runId");

-- CreateIndex
CREATE INDEX "GateResult_criterionId_idx" ON "GateResult"("criterionId");

-- CreateIndex
CREATE INDEX "GateResult_passed_idx" ON "GateResult"("passed");

-- CreateIndex
CREATE INDEX "Comparison_runAId_idx" ON "Comparison"("runAId");

-- CreateIndex
CREATE INDEX "Comparison_runBId_idx" ON "Comparison"("runBId");

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GateResult" ADD CONSTRAINT "GateResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GateResult" ADD CONSTRAINT "GateResult_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "Criterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comparison" ADD CONSTRAINT "Comparison_runAId_fkey" FOREIGN KEY ("runAId") REFERENCES "Run"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comparison" ADD CONSTRAINT "Comparison_runBId_fkey" FOREIGN KEY ("runBId") REFERENCES "Run"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
