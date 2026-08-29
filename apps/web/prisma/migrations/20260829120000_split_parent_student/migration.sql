-- Split the conflated `users` row into `parents` (who signs in) and
-- `students` (whose data it is), joined many-to-many by `parent_students`.
--
-- The key move: each new `students` row KEEPS THE ID of the `users` row it came
-- from. Every child-table FK value therefore stays byte-identical and only the
-- column name and FK target change — no child data is rewritten and no id is
-- remapped. The parent gets a new, derived id ('parent-' || old id) so the
-- transitional DEFAULT_PARENT_ID constant can address it.
--
-- No refresh token is carried across (D6): every live session dies here and the
-- parent signs in once against their now-unambiguous parent id.

-- ── 1. Enums ────────────────────────────────────────────────────────────────
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED');
CREATE TYPE "ParentRole" AS ENUM ('OWNER', 'GUARDIAN');

-- ── 2. New tables ───────────────────────────────────────────────────────────
CREATE TABLE "parents" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "loginLockedUntil" TIMESTAMP(3),
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "reviewNote" VARCHAR(200),
    "signupPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "parents_email_key" ON "parents"("email");
CREATE INDEX "parents_status_idx" ON "parents"("status");
ALTER TABLE "parents" ADD CONSTRAINT "parents_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gradeLevel" INTEGER NOT NULL DEFAULT 1,
    "avatarUrl" TEXT,
    "kidPatternHash" TEXT,
    "kidPatternAttempts" INTEGER NOT NULL DEFAULT 0,
    "kidPatternLockedUntil" TIMESTAMP(3),
    "kidAccessSettings" JSONB,
    "screenTimeLimitMins" INTEGER NOT NULL DEFAULT 120,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "parent_students" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "role" "ParentRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_students_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "parent_students_parentId_studentId_key" ON "parent_students"("parentId", "studentId");
CREATE INDEX "parent_students_studentId_idx" ON "parent_students"("studentId");

CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "deviceLabel" VARCHAR(60),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "refresh_tokens_parentId_idx" ON "refresh_tokens"("parentId");
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

CREATE TABLE "student_invites" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "email" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "acceptedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_invites_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "student_invites_studentId_idx" ON "student_invites"("studentId");

-- ── 3. Every existing user row becomes a student, keeping its id ────────────
INSERT INTO "students" ("id", "name", "gradeLevel", "avatarUrl",
                        "kidPatternHash", "kidPatternAttempts", "kidPatternLockedUntil",
                        "kidAccessSettings", "screenTimeLimitMins", "createdAt", "updatedAt")
SELECT "id", "name", "gradeLevel", "avatarUrl",
       "kidPatternHash", "kidPatternAttempts", "kidPatternLockedUntil",
       "kidAccessSettings", "screenTimeLimitMins", "createdAt", "updatedAt"
FROM "users";

-- ── 4. Rows that carry credentials become a parent, with a derived id ───────
INSERT INTO "parents" ("id", "email", "passwordHash",
                       "loginAttempts", "loginLockedUntil", "createdAt", "updatedAt")
SELECT 'parent-' || "id", "parentEmail", "parentPasswordHash",
       "parentLoginAttempts", "parentLoginLockedUntil", "createdAt", "updatedAt"
FROM "users"
WHERE "parentEmail" IS NOT NULL AND "parentPasswordHash" IS NOT NULL;

-- ── 5. Link parent to student ───────────────────────────────────────────────
INSERT INTO "parent_students" ("id", "parentId", "studentId", "role", "createdAt")
SELECT 'link-' || u."id", 'parent-' || u."id", u."id", 'OWNER', NOW()
FROM "users" u
WHERE u."parentEmail" IS NOT NULL AND u."parentPasswordHash" IS NOT NULL;

-- The migrated household is the founding account: ACTIVE and admin, so somebody
-- can approve the first applicant. Every later signup starts PENDING.
UPDATE "parents" SET "status" = 'ACTIVE', "isAdmin" = true, "approvedAt" = NOW();

ALTER TABLE "parent_students" ADD CONSTRAINT "parent_students_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "parent_students" ADD CONSTRAINT "parent_students_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_invites" ADD CONSTRAINT "student_invites_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_invites" ADD CONSTRAINT "student_invites_invitedById_fkey"
    FOREIGN KEY ("invitedById") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 6. Repoint the PIN from the student to the parent ───────────────────────
ALTER TABLE "parent_pins" DROP CONSTRAINT "parent_pins_userId_fkey";
ALTER TABLE "parent_pins" ADD COLUMN "parentId" TEXT;

UPDATE "parent_pins" pp
SET "parentId" = ps."parentId"
FROM "parent_students" ps
WHERE ps."studentId" = pp."userId";

-- A PIN whose household never had credentials has no parent to belong to.
DELETE FROM "parent_pins" WHERE "parentId" IS NULL;

DROP INDEX "parent_pins_userId_key";
ALTER TABLE "parent_pins" DROP COLUMN "userId";
ALTER TABLE "parent_pins" ALTER COLUMN "parentId" SET NOT NULL;
CREATE UNIQUE INDEX "parent_pins_parentId_key" ON "parent_pins"("parentId");
ALTER TABLE "parent_pins" ADD CONSTRAINT "parent_pins_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 7. Rename userId -> studentId in the nine student-scoped tables ─────────
-- RENAME COLUMN is catalogue-only in Postgres: instant, no table rewrite.

ALTER TABLE "class_periods" DROP CONSTRAINT "class_periods_userId_fkey";
ALTER TABLE "class_periods" RENAME COLUMN "userId" TO "studentId";
ALTER INDEX "class_periods_userId_day_periodNumber_key" RENAME TO "class_periods_studentId_day_periodNumber_key";
ALTER INDEX "class_periods_userId_day_idx" RENAME TO "class_periods_studentId_day_idx";
ALTER INDEX "class_periods_userId_eventType_idx" RENAME TO "class_periods_studentId_eventType_idx";
ALTER TABLE "class_periods" ADD CONSTRAINT "class_periods_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "daily_homework" DROP CONSTRAINT "daily_homework_userId_fkey";
ALTER TABLE "daily_homework" RENAME COLUMN "userId" TO "studentId";
ALTER INDEX "daily_homework_userId_date_idx" RENAME TO "daily_homework_studentId_date_idx";
ALTER TABLE "daily_homework" ADD CONSTRAINT "daily_homework_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "extra_class_overrides" DROP CONSTRAINT "extra_class_overrides_userId_fkey";
ALTER TABLE "extra_class_overrides" RENAME COLUMN "userId" TO "studentId";
ALTER INDEX "extra_class_overrides_userId_date_idx" RENAME TO "extra_class_overrides_studentId_date_idx";
ALTER TABLE "extra_class_overrides" ADD CONSTRAINT "extra_class_overrides_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subject_grades" DROP CONSTRAINT "subject_grades_userId_fkey";
ALTER TABLE "subject_grades" RENAME COLUMN "userId" TO "studentId";
ALTER INDEX "subject_grades_userId_subjectId_semester_academicYear_key" RENAME TO "subject_grades_studentId_subjectId_semester_academicYear_key";
ALTER INDEX "subject_grades_userId_idx" RENAME TO "subject_grades_studentId_idx";
ALTER TABLE "subject_grades" ADD CONSTRAINT "subject_grades_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_progress" DROP CONSTRAINT "user_progress_userId_fkey";
ALTER TABLE "user_progress" RENAME COLUMN "userId" TO "studentId";
ALTER INDEX "user_progress_userId_key" RENAME TO "user_progress_studentId_key";
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "math_progress" DROP CONSTRAINT "math_progress_userId_fkey";
ALTER TABLE "math_progress" RENAME COLUMN "userId" TO "studentId";
ALTER INDEX "math_progress_userId_completedAt_idx" RENAME TO "math_progress_studentId_completedAt_idx";
ALTER INDEX "math_progress_userId_homeworkPeriodId_idx" RENAME TO "math_progress_studentId_homeworkPeriodId_idx";
ALTER TABLE "math_progress" ADD CONSTRAINT "math_progress_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "english_progress" DROP CONSTRAINT "english_progress_userId_fkey";
ALTER TABLE "english_progress" RENAME COLUMN "userId" TO "studentId";
ALTER INDEX "english_progress_userId_completedAt_idx" RENAME TO "english_progress_studentId_completedAt_idx";
ALTER INDEX "english_progress_userId_homeworkPeriodId_idx" RENAME TO "english_progress_studentId_homeworkPeriodId_idx";
ALTER TABLE "english_progress" ADD CONSTRAINT "english_progress_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "screen_time_logs" DROP CONSTRAINT "screen_time_logs_userId_fkey";
ALTER TABLE "screen_time_logs" RENAME COLUMN "userId" TO "studentId";
ALTER INDEX "screen_time_logs_userId_date_key" RENAME TO "screen_time_logs_studentId_date_key";
ALTER INDEX "screen_time_logs_userId_idx" RENAME TO "screen_time_logs_studentId_idx";
ALTER TABLE "screen_time_logs" ADD CONSTRAINT "screen_time_logs_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "activity_events" DROP CONSTRAINT "activity_events_userId_fkey";
ALTER TABLE "activity_events" RENAME COLUMN "userId" TO "studentId";
ALTER INDEX "activity_events_userId_createdAt_idx" RENAME TO "activity_events_studentId_createdAt_idx";
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 8. The old table has no readers left ────────────────────────────────────
DROP TABLE "users";
