-- Lesson variant as the printed timetable renders it: "Tiếng Việt (Học vần)".
-- Additive and nullable: every existing row stays valid with no variant.
ALTER TABLE "class_periods" ADD COLUMN "note" VARCHAR(40);
