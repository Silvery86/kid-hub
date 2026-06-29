-- Parent account + refresh token + kid unlock fields on the single household user record
ALTER TABLE "users"
ADD COLUMN "parentEmail" TEXT,
ADD COLUMN "parentPasswordHash" TEXT,
ADD COLUMN "parentLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "parentLoginLockedUntil" TIMESTAMP(3),
ADD COLUMN "refreshTokenHash" TEXT,
ADD COLUMN "refreshTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN "kidPatternHash" TEXT,
ADD COLUMN "kidPatternAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "kidPatternLockedUntil" TIMESTAMP(3);

CREATE UNIQUE INDEX "users_parentEmail_key" ON "users"("parentEmail");
