import { NextResponse } from 'next/server'

/** 401 for a request with no valid parent Bearer token. */
export const unauthorized = () =>
  NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

/** 400 for a payload that fails its Zod schema. */
export const badRequest = (error = 'Invalid input') =>
  NextResponse.json({ success: false, error }, { status: 400 })

/** 500 with a caller-safe message; the cause is never echoed back. */
export const serverError = (error: string) =>
  NextResponse.json({ success: false, error }, { status: 500 })

export const ok = <T>(data: T) => NextResponse.json({ success: true, data })
