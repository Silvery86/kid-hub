-- Class identity from the header of a printed timetable: Lớp 1A1, GVCN, SĐT.
-- Additive and nullable; a household that leaves them blank sees no header.
ALTER TABLE "students" ADD COLUMN "className" VARCHAR(20);
ALTER TABLE "students" ADD COLUMN "teacherName" VARCHAR(80);
ALTER TABLE "students" ADD COLUMN "teacherPhone" VARCHAR(20);
