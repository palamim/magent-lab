-- AlterEnum
ALTER TYPE "AgentType" ADD VALUE 'architect';

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agentType" "AgentType" NOT NULL,
    "model" TEXT NOT NULL,
    "steps" INTEGER NOT NULL,
    "toolCalls" INTEGER NOT NULL,
    "readFileCalls" INTEGER NOT NULL,
    "filesRead" TEXT[],
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "repoKey" TEXT NOT NULL,
    "output" JSONB NOT NULL,

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);
