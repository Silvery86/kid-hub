-- Phase 7b — a summer break records which grade the child returns to.
-- docs/SCHEDULE_PARENT_IMP.md §13.6.
--
-- Both columns are nullable and default to nothing on purpose. An existing
-- summer break offers no promotion until a parent says where it leads, and
-- `promotedAt` staying NULL is what keeps the question open. Neither is ever
-- written by a scheduled job — see domain/school-breaks.ts pendingPromotion.

ALTER TABLE "school_breaks" ADD COLUMN "promotesToGrade" INTEGER;
ALTER TABLE "school_breaks" ADD COLUMN "promotedAt" TIMESTAMP(3);

-- A grade outside 1–12 is a typo, and it would be written straight onto the
-- student record by the promotion.
ALTER TABLE "school_breaks"
  ADD CONSTRAINT "school_breaks_promotes_to_grade_range"
  CHECK ("promotesToGrade" IS NULL OR ("promotesToGrade" BETWEEN 1 AND 12));

-- Only a summer break leads anywhere: a public holiday that promoted a child
-- would advance them nine days into Tết.
ALTER TABLE "school_breaks"
  ADD CONSTRAINT "school_breaks_promotion_is_summer_only"
  CHECK ("promotesToGrade" IS NULL OR "kind" = 'SUMMER_BREAK');
