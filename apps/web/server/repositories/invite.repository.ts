/**
 * Server-only module — Prisma queries for second-parent invites.
 * No business logic in this layer — pure data access only.
 *
 * The raw code is never stored, only its hash. A lookup therefore cannot be a
 * WHERE on the code: candidates are fetched by their non-secret fields and the
 * hash is compared in the service.
 */

import { db } from '@/lib/db'

export interface InviteRecord {
  id: string
  studentId: string
  invitedById: string
  codeHash: string
  email: string | null
  expiresAt: Date
  acceptedAt: Date | null
}

const FIELDS = {
  id: true,
  studentId: true,
  invitedById: true,
  codeHash: true,
  email: true,
  expiresAt: true,
  acceptedAt: true,
} as const

/** Records an invite. The caller stores only the hash. */
export const create = async (data: {
  studentId: string
  invitedById: string
  codeHash: string
  email?: string
  expiresAt: Date
}): Promise<{ id: string }> => {
  return db.studentInvite.create({
    data: {
      studentId: data.studentId,
      invitedById: data.invitedById,
      codeHash: data.codeHash,
      email: data.email ?? null,
      expiresAt: data.expiresAt,
    },
    select: { id: true },
  })
}

/**
 * Every invite that could still be redeemed. Small by nature — one household
 * invites a handful of people — and the service compares hashes across them.
 */
export const listRedeemable = async (): Promise<InviteRecord[]> => {
  return db.studentInvite.findMany({
    where: { acceptedAt: null, expiresAt: { gt: new Date() } },
    select: FIELDS,
    orderBy: { createdAt: 'desc' },
  })
}

/** Invites raised for one student, newest first. */
export const listForStudent = async (studentId: string) => {
  return db.studentInvite.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    select: { ...FIELDS, createdAt: true, acceptedBy: true },
  })
}

/**
 * Marks an invite redeemed, but only if it is still unredeemed and unexpired.
 * The condition lives in the WHERE so two simultaneous redemptions cannot both
 * succeed — a check-then-write in the service would race.
 */
export const markAccepted = async (
  inviteId: string,
  acceptedBy: string
): Promise<boolean> => {
  const result = await db.studentInvite.updateMany({
    where: { id: inviteId, acceptedAt: null, expiresAt: { gt: new Date() } },
    data: { acceptedAt: new Date(), acceptedBy },
  })
  return result.count === 1
}

/** Withdraws an unredeemed invite. Scoped to its issuer. */
export const revoke = async (inviteId: string, invitedById: string): Promise<void> => {
  await db.studentInvite.deleteMany({
    where: { id: inviteId, invitedById, acceptedAt: null },
  })
}
