/*
  Warnings:

  - Added the required column `prompt` to the `AgentRun` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AgentRun" ADD COLUMN     "prompt" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "AgentRun_agentType_idx" ON "AgentRun"("agentType");
