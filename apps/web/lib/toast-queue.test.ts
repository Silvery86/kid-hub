import { describe, it, expect } from 'vitest'
import { resolveDuration, idsToEvict, MAX_VISIBLE, SUCCESS_MS, INFO_MS } from './toast-queue'

describe('resolveDuration', () => {
  it('pins an error until it is dismissed', () => {
    expect(resolveDuration('error', undefined)).toBeNull()
  })

  it('gives success and info a life span', () => {
    expect(resolveDuration('success', undefined)).toBe(SUCCESS_MS)
    expect(resolveDuration('info', undefined)).toBe(INFO_MS)
  })

  it('lets a caller override, including pinning a success', () => {
    expect(resolveDuration('success', 9000)).toBe(9000)
    expect(resolveDuration('success', null)).toBeNull()
  })

  it('treats an explicit zero as the caller meaning zero, not as absent', () => {
    expect(resolveDuration('error', 0)).toBe(0)
  })
})

describe('idsToEvict', () => {
  const item = (id: string, leaving = false) => ({ id, leaving })

  it('evicts nothing while there is room', () => {
    expect(idsToEvict([item('a'), item('b'), item('c')])).toEqual([])
  })

  it('evicts the oldest when a fourth arrives', () => {
    expect(idsToEvict([item('a'), item('b'), item('c'), item('d')])).toEqual(['a'])
  })

  it('evicts oldest-first when several arrive at once', () => {
    const list = [item('a'), item('b'), item('c'), item('d'), item('e')]
    expect(idsToEvict(list)).toEqual(['a', 'b'])
  })

  it('ignores toasts already leaving, so a burst never evicts one twice', () => {
    const list = [item('a', true), item('b'), item('c'), item('d')]
    expect(idsToEvict(list)).toEqual([])
  })

  it('honours the documented maximum', () => {
    const list = Array.from({ length: MAX_VISIBLE + 1 }, (_, i) => item(`t${i}`))
    expect(idsToEvict(list)).toHaveLength(1)
  })
})
