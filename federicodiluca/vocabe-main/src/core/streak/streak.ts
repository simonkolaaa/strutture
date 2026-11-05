import type { ProgressState } from '@/core/types'
import { daysBetween, localDateKey } from '@/core/date'

const MAX_FREEZES = 3

/**
 * Register activity for `today` and return the updated streak block.
 * Same-day calls are idempotent. A one-day gap keeps the streak growing.
 * A two-day gap is forgiven if a "salvagente" (freeze) is available — one is
 * spent instead of resetting. Longer gaps reset to 1.
 * Every full week of streak earns a freeze back, up to MAX_FREEZES.
 */
export function touchStreak(streak: ProgressState['streak'], today = localDateKey()) {
  if (streak.lastActiveOn === today) return streak

  const gap = streak.lastActiveOn ? daysBetween(streak.lastActiveOn, today) : Infinity
  let current: number
  let freezes = streak.freezes

  if (gap === 1) {
    current = streak.current + 1
  } else if (gap === 2 && freezes > 0) {
    current = streak.current + 1
    freezes -= 1
  } else {
    current = 1
  }

  if (current > 0 && current % 7 === 0) {
    freezes = Math.min(freezes + 1, MAX_FREEZES)
  }

  return {
    current,
    longest: Math.max(streak.longest, current),
    lastActiveOn: today,
    freezes,
  }
}

/** The streak shown in the UI — still "alive" through a gap a freeze could cover. */
export function displayStreak(streak: ProgressState['streak'], today = localDateKey()): number {
  if (!streak.lastActiveOn) return 0
  const gap = daysBetween(streak.lastActiveOn, today)
  if (gap <= 1) return streak.current
  if (gap === 2 && streak.freezes > 0) return streak.current
  return 0
}
