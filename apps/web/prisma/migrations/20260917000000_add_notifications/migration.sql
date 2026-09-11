-- Notification centre (Phase N5).
--
-- Extends activity_events rather than adding a parallel table. The rows are the
-- same events; what a notification adds is a recipient and a read state, and
-- splitting them would have duplicated type/label/iconKey and left two feeds to
-- keep in step.
--
-- Every column is nullable with no default, so this is additive: existing rows
-- become log-only entries (parentId NULL), which is exactly what they were.

ALTER TABLE "activity_events"
  ADD COLUMN "parentId"  TEXT,
  ADD COLUMN "href"      VARCHAR(120),
  ADD COLUMN "readAt"    TIMESTAMP(3),
  ADD COLUMN "dedupeKey" VARCHAR(80);

-- Routing only. Authorisation is the parent_students join in the read path;
-- this cascade just stops orphaned rows when a parent account is deleted.
ALTER TABLE "activity_events"
  ADD CONSTRAINT "activity_events_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "parents"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Postgres treats NULLs as distinct in a unique index, so every log-only row
-- (dedupeKey NULL) is exempt and only real notifications are deduplicated.
-- Same property the weekStartDate work relied on in Phase 6.
CREATE UNIQUE INDEX "activity_events_parentId_dedupeKey_key"
  ON "activity_events"("parentId", "dedupeKey");

-- Serves both the unread count and the inbox listing.
CREATE INDEX "activity_events_parentId_readAt_createdAt_idx"
  ON "activity_events"("parentId", "readAt", "createdAt");

-- A read is only ever addressed to a parent OR is a plain log row; a readAt on
-- a row with no recipient would mean nothing, and would hide a bug rather than
-- surface it.
ALTER TABLE "activity_events"
  ADD CONSTRAINT "activity_events_read_requires_recipient"
  CHECK ("readAt" IS NULL OR "parentId" IS NOT NULL);
