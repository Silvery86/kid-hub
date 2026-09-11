-- Bán trú: whether the child stays at school over midday.
--
-- Defaulted TRUE because that is what every existing row already assumes: the
-- primary preset shipped a hard-coded "Ăn trưa & ngủ 11:00–13:30" routine for
-- every weekday, so a household that had saved a schedule was, in effect,
-- already marked as boarding. Defaulting FALSE would silently delete the
-- midday block from timetables that are in use.
ALTER TABLE "bell_schedules" ADD COLUMN "boarding" BOOLEAN NOT NULL DEFAULT true;
