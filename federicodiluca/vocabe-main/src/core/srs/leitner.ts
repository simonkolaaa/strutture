import type { LearnedEntry, RecallBox } from '@/core/types'
import { addDays, localDateKey } from '@/core/date'

/** Days until the next recall, per Leitner box. */
const INTERVALS: Record<RecallBox, number> = { 1: 1, 2: 3, 3: 7, 4: 16, 5: 40 }

export function newEntry(today = localDateKey()): LearnedEntry {
  return { learnedOn: today, box: 1, dueOn: addDays(today, INTERVALS[1]), correct: 0, wrong: 0 }
}

/** Advance (or reset) an entry after a recall answer. */
export function grade(entry: LearnedEntry, correct: boolean, today = localDateKey()): LearnedEntry {
  const box = (correct ? Math.min(entry.box + 1, 5) : 1) as RecallBox
  return {
    ...entry,
    box,
    dueOn: addDays(today, INTERVALS[box]),
    correct: entry.correct + (correct ? 1 : 0),
    wrong: entry.wrong + (correct ? 0 : 1),
  }
}

export function isDue(entry: LearnedEntry, today = localDateKey()): boolean {
  return entry.dueOn <= today
}
