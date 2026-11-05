import { describe, expect, it } from 'vitest'
import { touchStreak, displayStreak } from './streak'
import type { ProgressState } from '@/core/types'

type Streak = ProgressState['streak']
const streak = (p: Partial<Streak> = {}): Streak => ({
  current: 0,
  longest: 0,
  lastActiveOn: null,
  freezes: 0,
  ...p,
})

describe('touchStreak', () => {
  it('starts a streak at 1 on the first activity', () => {
    expect(touchStreak(streak(), '2026-03-10')).toMatchObject({ current: 1, lastActiveOn: '2026-03-10' })
  })

  it('is idempotent within the same day', () => {
    const s = streak({ current: 4, lastActiveOn: '2026-03-10' })
    expect(touchStreak(s, '2026-03-10')).toBe(s)
  })

  it('increments on consecutive days', () => {
    const s = streak({ current: 4, longest: 4, lastActiveOn: '2026-03-10' })
    expect(touchStreak(s, '2026-03-11').current).toBe(5)
  })

  it('spends a freeze to survive a single missed day', () => {
    const s = streak({ current: 4, lastActiveOn: '2026-03-10', freezes: 2 })
    const next = touchStreak(s, '2026-03-12')
    expect(next.current).toBe(5)
    expect(next.freezes).toBe(1)
  })

  it('resets after a missed day when no freeze is left', () => {
    const s = streak({ current: 9, lastActiveOn: '2026-03-10', freezes: 0 })
    expect(touchStreak(s, '2026-03-12').current).toBe(1)
  })

  it('resets after a gap of more than two days even with freezes', () => {
    const s = streak({ current: 9, lastActiveOn: '2026-03-10', freezes: 3 })
    const next = touchStreak(s, '2026-03-14')
    expect(next.current).toBe(1)
    expect(next.freezes).toBe(3)
  })

  it('earns a freeze every seventh day, capped at three', () => {
    const s = streak({ current: 6, lastActiveOn: '2026-03-10', freezes: 0 })
    expect(touchStreak(s, '2026-03-11').freezes).toBe(1)

    const capped = streak({ current: 13, lastActiveOn: '2026-03-10', freezes: 3 })
    expect(touchStreak(capped, '2026-03-11').freezes).toBe(3)
  })

  it('keeps the longest streak ever reached', () => {
    const s = streak({ current: 9, longest: 20, lastActiveOn: '2026-03-10' })
    expect(touchStreak(s, '2026-03-11').longest).toBe(20)

    const beaten = streak({ current: 20, longest: 20, lastActiveOn: '2026-03-10' })
    expect(touchStreak(beaten, '2026-03-11').longest).toBe(21)
  })
})

describe('displayStreak', () => {
  it('is zero before any activity', () => {
    expect(displayStreak(streak(), '2026-03-10')).toBe(0)
  })

  it('stays alive today and yesterday', () => {
    const s = streak({ current: 5, lastActiveOn: '2026-03-10' })
    expect(displayStreak(s, '2026-03-10')).toBe(5)
    expect(displayStreak(s, '2026-03-11')).toBe(5)
  })

  it('survives a two-day gap only while a freeze could cover it', () => {
    expect(displayStreak(streak({ current: 5, lastActiveOn: '2026-03-10', freezes: 1 }), '2026-03-12')).toBe(5)
    expect(displayStreak(streak({ current: 5, lastActiveOn: '2026-03-10', freezes: 0 }), '2026-03-12')).toBe(0)
  })

  it('is broken after three days', () => {
    expect(displayStreak(streak({ current: 5, lastActiveOn: '2026-03-10', freezes: 3 }), '2026-03-13')).toBe(0)
  })
})
