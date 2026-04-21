-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday');

-- CreateEnum
CREATE TYPE "BadgeTier" AS ENUM ('excellent', 'good', 'needs-practice');

-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('math', 'english');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gradeLevel" INTEGER NOT NULL DEFAULT 1,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_pins" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_pins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_periods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" "DayOfWeek" NOT NULL,
    "periodNumber" INTEGER NOT NULL,
    "subjectId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "roomNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_grades" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "badge" "BadgeTier" NOT NULL,
    "semester" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "earned_badges" (
    "id" TEXT NOT NULL,
    "userProgressId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "earned_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_best_scores" (
    "id" TEXT NOT NULL,
    "userProgressId" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL,
    "level" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "starsEarned" INTEGER NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_best_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parent_pins_userId_key" ON "parent_pins"("userId");

-- CreateIndex
CREATE INDEX "class_periods_userId_day_idx" ON "class_periods"("userId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "class_periods_userId_day_periodNumber_key" ON "class_periods"("userId", "day", "periodNumber");

-- CreateIndex
CREATE INDEX "subject_grades_userId_idx" ON "subject_grades"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subject_grades_userId_subjectId_semester_academicYear_key" ON "subject_grades"("userId", "subjectId", "semester", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_userId_key" ON "user_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "earned_badges_userProgressId_badgeId_key" ON "earned_badges"("userProgressId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "game_best_scores_userProgressId_gameType_level_key" ON "game_best_scores"("userProgressId", "gameType", "level");

-- AddForeignKey
ALTER TABLE "parent_pins" ADD CONSTRAINT "parent_pins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_periods" ADD CONSTRAINT "class_periods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_grades" ADD CONSTRAINT "subject_grades_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earned_badges" ADD CONSTRAINT "earned_badges_userProgressId_fkey" FOREIGN KEY ("userProgressId") REFERENCES "user_progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_best_scores" ADD CONSTRAINT "game_best_scores_userProgressId_fkey" FOREIGN KEY ("userProgressId") REFERENCES "user_progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;
