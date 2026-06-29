/*
  Warnings:

  - A unique constraint covering the columns `[userProgressId,gameType,level,subType]` on the table `game_best_scores` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MathGameType" AS ENUM ('counting', 'addition', 'shapes');

-- DropIndex
DROP INDEX "game_best_scores_userProgressId_gameType_level_key";

-- AlterTable
ALTER TABLE "game_best_scores" ADD COLUMN     "subType" TEXT;

-- CreateTable
CREATE TABLE "math_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "minigame" "MathGameType" NOT NULL,
    "level" INTEGER NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "incorrectCount" INTEGER NOT NULL,
    "timeSpentSecs" INTEGER NOT NULL,
    "starsEarned" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "homeworkPeriodId" TEXT,
    "homeworkDate" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "math_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "math_progress_userId_completedAt_idx" ON "math_progress"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "math_progress_userId_homeworkPeriodId_idx" ON "math_progress"("userId", "homeworkPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "game_best_scores_userProgressId_gameType_level_subType_key" ON "game_best_scores"("userProgressId", "gameType", "level", "subType");

-- AddForeignKey
ALTER TABLE "math_progress" ADD CONSTRAINT "math_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
