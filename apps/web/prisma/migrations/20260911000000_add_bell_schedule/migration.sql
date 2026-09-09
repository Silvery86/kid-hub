-- The bell rules a school publishes, plus the day timeline derived from them.
-- Purely additive: nothing existing reads or writes these tables yet.

CREATE TYPE "SlotKind" AS ENUM ('PERIOD', 'BREAK', 'ROUTINE');

CREATE TABLE "bell_schedules" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "presetKey" VARCHAR(40),
    "periodMinutes" INTEGER NOT NULL DEFAULT 35,
    "transitionMinutes" INTEGER NOT NULL DEFAULT 5,
    "morningStart" VARCHAR(5) NOT NULL,
    "morningPeriods" INTEGER NOT NULL DEFAULT 4,
    "morningRecessAfter" INTEGER,
    "morningRecessStart" VARCHAR(5),
    "morningRecessMinutes" INTEGER,
    "afternoonStart" VARCHAR(5),
    "afternoonPeriods" INTEGER NOT NULL DEFAULT 0,
    "afternoonRecessAfter" INTEGER,
    "afternoonRecessStart" VARCHAR(5),
    "afternoonRecessMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bell_schedules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bell_schedules_studentId_key" ON "bell_schedules"("studentId");

ALTER TABLE "bell_schedules" ADD CONSTRAINT "bell_schedules_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "bell_slots" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "kind" "SlotKind" NOT NULL,
    "periodNumber" INTEGER,
    "label" VARCHAR(40),
    "startTime" VARCHAR(5) NOT NULL,
    "endTime" VARCHAR(5) NOT NULL,
    "days" "DayOfWeek"[],
    "isGenerated" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "bell_slots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bell_slots_scheduleId_idx" ON "bell_slots"("scheduleId");

ALTER TABLE "bell_slots" ADD CONSTRAINT "bell_slots_scheduleId_fkey"
    FOREIGN KEY ("scheduleId") REFERENCES "bell_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
