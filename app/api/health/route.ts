import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const requestId = (await headers()).get('x-request-id') ?? crypto.randomUUID()
  try {
    await db.$queryRaw`SELECT 1`
    logger.info({ requestId, db: 'connected' }, 'health check ok')
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    logger.error({ requestId, err }, 'health check failed — db unreachable')
    return NextResponse.json(
      { status: 'error', db: 'disconnected', timestamp: new Date().toISOString() },
      { status: 503 }
    )
  }
}
