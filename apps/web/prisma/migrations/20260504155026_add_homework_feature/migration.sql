-- AlterTable
ALTER TABLE "class_periods" ADD COLUMN     "homeworkNote" VARCHAR(200),
ADD COLUMN     "isHomework" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "homework_completions" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "homework_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "homework_completions_userId_date_idx" ON "homework_completions"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "homework_completions_periodId_date_key" ON "homework_completions"("periodId", "date");

-- AddForeignKey
ALTER TABLE "homework_completions" ADD CONSTRAINT "homework_completions_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "class_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homework_completions" ADD CONSTRAINT "homework_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
