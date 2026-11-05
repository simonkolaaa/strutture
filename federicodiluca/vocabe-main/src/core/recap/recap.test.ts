import { describe, expect, it } from 'vitest'
import { defaultState } from '@/core/storage/store'
import type { LearnedEntry, ProgressState, RecallBox } from '@/core/types'
import {
  buildRecap,
  formatWeekRange,
  isRecapEmpty,
  pendingRecap,
  recapVerdict,
  weekStart,
} from './recap'

function entry(learnedOn: string, box: RecallBox = 1, wrong = 0): LearnedEntry {
  return { learnedOn, box, dueOn: learnedOn, correct: 0, wrong }
}

function stateWith(patch: Partial<ProgressState>): ProgressState {
  return { ...defaultState(), ...patch }
}

describe('weekStart', () => {
  it('returns the Monday of the week', () => {
    // 2026-09-07 is a Monday.
    expect(weekStart('2026-09-07')).toBe('2026-09-07')
    expect(weekStart('2026-09-10')).toBe('2026-09-07')
    expect(weekStart('2026-09-13')).toBe('2026-09-07') // Sunday closes the week
    expect(weekStart('2026-09-14')).toBe('2026-09-14')
  })

  it('walks back across a month boundary', () => {
    expect(weekStart('2026-10-01')).toBe('2026-09-28')
  })
})

describe('buildRecap', () => {
  const state = stateWith({
    learned: {
      a: entry('2026-09-07'),
      b: entry('2026-09-09'),
      c: entry('2026-09-08'),
      old: entry('2026-09-02'),
      older: entry('2026-08-30'),
    },
    activeDays: ['2026-08-30', '2026-09-02', '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-12'],
  })

  const r = buildRecap(state, '2026-09-07')

  it('covers Monday to Sunday', () => {
    expect(r.from).toBe('2026-09-07')
    expect(r.to).toBe('2026-09-13')
  })

  it('keeps only the words learned inside the week, oldest first', () => {
    expect(r.learnedIds).toEqual(['a', 'c', 'b'])
  })

  it('counts the active days of the week alone', () => {
    expect(r.activeDays).toBe(4)
  })

  it('counts the previous week for the comparison', () => {
    // 2026-09-02 falls in the week starting 2026-08-31; 2026-08-30 does not.
    expect(r.prevLearned).toBe(1)
  })

  it('measures the longest consecutive run', () => {
    expect(r.bestRun).toBe(3)
  })

  it('leaves bestRun at 0 for a week with no activity', () => {
    expect(buildRecap(stateWith({}), '2026-09-07').bestRun).toBe(0)
  })

  it('picks the most-missed words still in a low box', () => {
    const shaky = buildRecap(
      stateWith({
        learned: {
          fine: entry('2026-09-07', 4, 9),
          bad: entry('2026-09-07', 1, 3),
          worse: entry('2026-09-07', 2, 5),
          never: entry('2026-09-07', 1, 0),
        },
      }),
      '2026-09-07',
    ).shakyIds
    expect(shaky).toEqual(['worse', 'bad'])
  })
})

describe('isRecapEmpty', () => {
  it('is empty only when nothing at all happened', () => {
    expect(isRecapEmpty(buildRecap(stateWith({}), '2026-09-07'))).toBe(true)
    expect(
      isRecapEmpty(buildRecap(stateWith({ activeDays: ['2026-09-08'] }), '2026-09-07')),
    ).toBe(false)
  })
})

describe('pendingRecap', () => {
  const active = stateWith({ activeDays: ['2026-09-02'] })

  it('offers the previous week when it saw activity', () => {
    expect(pendingRecap(active, '2026-09-07')).toBe('2026-08-31')
  })

  it('stays quiet once that week has been seen', () => {
    expect(pendingRecap({ ...active, lastRecapSeen: '2026-08-31' }, '2026-09-07')).toBeNull()
  })

  it('comes back the week after', () => {
    const later = stateWith({ activeDays: ['2026-09-08'], lastRecapSeen: '2026-08-31' })
    expect(pendingRecap(later, '2026-09-14')).toBe('2026-09-07')
  })

  it('stays quiet for a week with nothing in it', () => {
    expect(pendingRecap(stateWith({}), '2026-09-07')).toBeNull()
  })
})

describe('formatWeekRange', () => {
  it('collapses the month when the week does not cross one', () => {
    expect(formatWeekRange('2026-09-07', '2026-09-13')).toBe('7 – 13 settembre')
  })

  it('names both months when it does', () => {
    expect(formatWeekRange('2026-09-28', '2026-10-04')).toBe('28 settembre – 4 ottobre')
  })
})

describe('recapVerdict', () => {
  const base = buildRecap(stateWith({}), '2026-09-07')

  it('acknowledges an empty week without scolding', () => {
    expect(recapVerdict(base)).toBe('Una settimana di pausa. Si riparte da qui.')
  })

  it('calls out a full week before comparing', () => {
    expect(recapVerdict({ ...base, learnedIds: ['a'], activeDays: 7, prevLearned: 5 })).toBe(
      'Settimana piena: ci sei stato tutti i giorni.',
    )
  })

  it('compares with the week before, carrying the difference', () => {
    expect(recapVerdict({ ...base, learnedIds: ['a', 'b', 'c'], activeDays: 2, prevLearned: 1 })).toBe(
      'Meglio della settimana scorsa: 2 in più.',
    )
    expect(recapVerdict({ ...base, learnedIds: ['a'], activeDays: 1, prevLearned: 3 })).toBe(
      'Settimana più leggera: 2 in meno.',
    )
    expect(recapVerdict({ ...base, learnedIds: ['a'], activeDays: 1, prevLearned: 1 })).toBe(
      'Stesso passo della settimana scorsa.',
    )
  })

  it('does not compare against a week that had nothing', () => {
    expect(recapVerdict({ ...base, learnedIds: ['a', 'b', 'c'], activeDays: 2 })).toBe(
      'Bella settimana.',
    )
    expect(recapVerdict({ ...base, learnedIds: ['a'], activeDays: 1 })).toBe('Qualche parola nuova.')
  })
})
