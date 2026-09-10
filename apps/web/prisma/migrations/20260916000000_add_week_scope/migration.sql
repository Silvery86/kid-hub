-- Phase 8 — an edited week no longer becomes everyone else's timetable.
-- docs/SCHEDULE_PARENT_IMP.md §14.
--
-- Before this, resolveWeekStart fell back to "the most recent earlier week", so
-- saving week 38 made weeks 39, 40, 41 show week 38. A week is now either
-- STANDING (the timetable from here on) or an EXCEPTION (this week only), and
-- the fallback skips exceptions.
--
-- Defaulting to false keeps every existing week standing, which is right for the
-- seeded baseline. Weeks the parent edited as one-offs are marked separately, as
-- a data fix, because only they know which those were.

ALTER TABLE "class_periods"
  ADD COLUMN "isWeekException" BOOLEAN NOT NULL DEFAULT false;

-- The fallback query filters on this alongside the existing (studentId,
-- weekStartDate) predicate, so it belongs in the same index.
CREATE INDEX "class_periods_studentId_isWeekException_weekStartDate_idx"
  ON "class_periods" ("studentId", "isWeekException", "weekStartDate");

-- An extra class has no week, so it can be neither standing nor an exception.
ALTER TABLE "class_periods"
  ADD CONSTRAINT "class_periods_exception_needs_week"
  CHECK ("isWeekException" = false OR "weekStartDate" IS NOT NULL);
