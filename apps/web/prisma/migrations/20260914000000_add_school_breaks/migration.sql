-- Phase 7 — days the timetable does not run.
-- docs/SCHEDULE_PARENT_IMP.md §13.

CREATE TYPE "SchoolBreakKind" AS ENUM ('PUBLIC_HOLIDAY', 'SUMMER_BREAK');

CREATE TABLE "school_breaks" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "kind" "SchoolBreakKind" NOT NULL DEFAULT 'PUBLIC_HOLIDAY',
    "label" VARCHAR(60) NOT NULL,
    "startDate" VARCHAR(10) NOT NULL,
    "endDate" VARCHAR(10) NOT NULL,
    "presetKey" VARCHAR(40),
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_breaks_pkey" PRIMARY KEY ("id")
);

-- A break that ends before it starts would silently cover nothing, and the
-- inclusive-range checks in domain/school-breaks.ts would report every date as
-- a school day. Cheaper to reject at the boundary than to debug later.
ALTER TABLE "school_breaks"
  ADD CONSTRAINT "school_breaks_date_order"
  CHECK ("endDate" >= "startDate");

-- One row per shipped holiday per student. Parent-added rows carry a NULL
-- presetKey and are deliberately unconstrained: two breaks may share a name.
CREATE UNIQUE INDEX "school_breaks_studentId_presetKey_key"
  ON "school_breaks" ("studentId", "presetKey");

CREATE INDEX "school_breaks_studentId_startDate_idx"
  ON "school_breaks" ("studentId", "startDate");

ALTER TABLE "school_breaks"
  ADD CONSTRAINT "school_breaks_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "students"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
