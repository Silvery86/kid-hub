-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('SCHOOL_PERIOD', 'EXTRA_CLASS');

-- CreateEnum
CREATE TYPE "EnglishGameType" AS ENUM ('alphabet', 'vocabulary', 'phonics');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DayOfWeek" ADD VALUE 'saturday';
ALTER TYPE "DayOfWeek" ADD VALUE 'sunday';

-- AlterTable
ALTER TABLE "class_periods" DROP COLUMN "homeworkNote",
DROP COLUMN "isHomework",
ADD COLUMN     "eventType" "EventType" NOT NULL DEFAULT 'SCHOOL_PERIOD',
ADD COLUMN     "iconKey" VARCHAR(30),
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "periodNumber" DROP NOT NULL;

-- CreateTable
CREATE TABLE "daily_homework" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "subjectId" VARCHAR(30) NOT NULL,
    "label" VARCHAR(150) NOT NULL,
    "iconKey" VARCHAR(30),
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),
    "points" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_homework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extra_class_overrides" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "reason" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extra_class_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "english_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "minigame" "EnglishGameType" NOT NULL,
    "level" INTEGER NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "incorrectCount" INTEGER NOT NULL,
    "timeSpentSecs" INTEGER NOT NULL,
    "starsEarned" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "homeworkPeriodId" TEXT,
    "homeworkDate" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "english_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_homework_userId_date_idx" ON "daily_homework"("userId", "date");

-- CreateIndex
CREATE INDEX "extra_class_overrides_userId_date_idx" ON "extra_class_overrides"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "extra_class_overrides_periodId_date_key" ON "extra_class_overrides"("periodId", "date");

-- CreateIndex
CREATE INDEX "english_progress_userId_completedAt_idx" ON "english_progress"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "english_progress_userId_homeworkPeriodId_idx" ON "english_progress"("userId", "homeworkPeriodId");

-- CreateIndex
CREATE INDEX "class_periods_userId_eventType_idx" ON "class_periods"("userId", "eventType");

-- AddForeignKey
ALTER TABLE "daily_homework" ADD CONSTRAINT "daily_homework_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extra_class_overrides" ADD CONSTRAINT "extra_class_overrides_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "class_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extra_class_overrides" ADD CONSTRAINT "extra_class_overrides_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "english_progress" ADD CONSTRAINT "english_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
