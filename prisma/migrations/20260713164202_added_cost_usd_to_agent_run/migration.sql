/*
  Warnings:

  - Added the required column `costUsd` to the `AgentRun` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AgentRun" ADD COLUMN     "costUsd" DECIMAL(10,6) NOT NULL;
