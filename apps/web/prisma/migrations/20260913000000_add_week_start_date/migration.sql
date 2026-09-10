-- Phase 6 — a school period belongs to a week, not to every week.
-- docs/SCHEDULE_PARENT_IMP.md §12.5.

-- 1. The column. Nullable, because EXTRA_CLASS rows stay recurring.
ALTER TABLE "class_periods" ADD COLUMN "weekStartDate" VARCHAR(10);

-- 2. Backfill. Existing rows become *this* week's timetable, so every later
--    week inherits them (§12.2) and the app behaves identically the moment
--    this lands. date_trunc('week', …) is Monday-based, matching weekStartOf().
UPDATE "class_periods"
SET "weekStartDate" = to_char(date_trunc('week', CURRENT_DATE), 'YYYY-MM-DD')
WHERE "eventType" = 'SCHOOL_PERIOD'
  AND "weekStartDate" IS NULL;

-- 3. Swap the uniqueness rule: one subject per (week, day, tiết), not per
--    (day, tiết). Done after the backfill so no two weeks' rows can collide
--    while the old index is still the only guard.
DROP INDEX "class_periods_studentId_day_periodNumber_key";

CREATE UNIQUE INDEX "class_periods_studentId_weekStartDate_day_periodNumber_key"
  ON "class_periods" ("studentId", "weekStartDate", "day", "periodNumber");

CREATE INDEX "class_periods_studentId_weekStartDate_idx"
  ON "class_periods" ("studentId", "weekStartDate");

-- 4. The invariant the PSL cannot state: dated iff SCHOOL_PERIOD. Without it a
--    school period with a NULL week would be invisible to every reader and
--    silently exempt from the unique index above.
ALTER TABLE "class_periods"
  ADD CONSTRAINT "class_periods_week_scope"
  CHECK (("eventType" = 'SCHOOL_PERIOD') = ("weekStartDate" IS NOT NULL));
