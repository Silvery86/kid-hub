/** Client-safe date utilities — mirrors server-side helpers without server-only imports. */

/** Returns today's date as "YYYY-MM-DD". */
export const todayDateKey = (): string => new Date().toISOString().split('T')[0]!
