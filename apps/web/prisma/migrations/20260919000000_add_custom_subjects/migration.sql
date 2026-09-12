-- Subjects a school teaches that the national programme does not name.
--
-- Only parent-added rows live here. The programme's own subjects are fixed in
-- code (docs/SCHEDULE_SUBJECT.md S1–S3), so this table is empty for a household
-- with nothing extra to say, and an empty table means the picker behaves exactly
-- as it did before this migration.
CREATE TABLE "custom_subjects" (
  "id"        TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  -- "custom_<cuid>", generated once. Timetable rows, homework and grades point
  -- at this string, so it must survive a rename: the name is a label, this is
  -- the key. Same width as ClassPeriod.subjectId so a join can never truncate.
  "subjectId" VARCHAR(30) NOT NULL,
  "name"      VARCHAR(40) NOT NULL,
  "color"     VARCHAR(9)  NOT NULL,
  -- The emoji itself. Both SubjectIcon implementations draw Subject.icon;
  -- the lucide `iconName` on the type is rendered by nothing.
  "icon"      VARCHAR(8)  NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "custom_subjects_pkey" PRIMARY KEY ("id")
);

-- One student cannot hold the same key twice.
CREATE UNIQUE INDEX "custom_subjects_studentId_subjectId_key"
  ON "custom_subjects" ("studentId", "subjectId");

-- Two subjects with the same name in one class is a parent typing instead of
-- scrolling, not a real second subject. Enforced here as well as in the service,
-- because two tabs can pass the service check at the same moment.
CREATE UNIQUE INDEX "custom_subjects_studentId_name_key"
  ON "custom_subjects" ("studentId", "name");

CREATE INDEX "custom_subjects_studentId_idx" ON "custom_subjects" ("studentId");

ALTER TABLE "custom_subjects"
  ADD CONSTRAINT "custom_subjects_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
