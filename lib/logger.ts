import 'server-only'

import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'kid-hub' },
  timestamp: pino.stdTimeFunctions.isoTime,
})
