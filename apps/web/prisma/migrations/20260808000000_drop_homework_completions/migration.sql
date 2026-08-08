-- Drop the orphaned homework_completions table.
-- The model had no application code path (kid-facing homework uses daily_homework);
-- removed in the Phase 3 cleanup (D1).

-- DropForeignKey
ALTER TABLE "homework_completions" DROP CONSTRAINT "homework_completions_periodId_fkey";

-- DropForeignKey
ALTER TABLE "homework_completions" DROP CONSTRAINT "homework_completions_userId_fkey";

-- DropTable
DROP TABLE "homework_completions";
