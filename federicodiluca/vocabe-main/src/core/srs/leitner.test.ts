import { describe, expect, it } from 'vitest'
import { newEntry, grade, isDue } from './leitner'

describe('newEntry', () => {
  it('starts in box 1, due the next day', () => {
    const e = newEntry('2026-03-10')
    expect(e).toMatchObject({ learnedOn: '2026-03-10', box: 1, dueOn: '2026-03-11', correct: 0, wrong: 0 })
  })
})

describe('grade', () => {
  it('promotes and pushes the due date further out when correct', () => {
    const e = grade(newEntry('2026-03-10'), true, '2026-03-11')
    expect(e.box).toBe(2)
    expect(e.dueOn).toBe('2026-03-14') // box 2 = 3 days
    expect(e.correct).toBe(1)
  })

  it('drops back to box 1 when wrong', () => {
    const known = { learnedOn: '2026-03-01', box: 4 as const, dueOn: '2026-03-10', correct: 3, wrong: 0 }
    const e = grade(known, false, '2026-03-10')
    expect(e.box).toBe(1)
    expect(e.dueOn).toBe('2026-03-11')
    expect(e.wrong).toBe(1)
  })

  it('caps at box 5', () => {
    const mastered = { learnedOn: '2026-01-01', box: 5 as const, dueOn: '2026-03-10', correct: 9, wrong: 0 }
    expect(grade(mastered, true, '2026-03-10').box).toBe(5)
  })

  it('keeps the original learnedOn date', () => {
    const e = grade(newEntry('2026-03-10'), true, '2026-06-01')
    expect(e.learnedOn).toBe('2026-03-10')
  })
})

describe('isDue', () => {
  const entry = { learnedOn: '2026-03-01', box: 2 as const, dueOn: '2026-03-10', correct: 1, wrong: 0 }

  it('is due on and after the due date', () => {
    expect(isDue(entry, '2026-03-10')).toBe(true)
    expect(isDue(entry, '2026-03-20')).toBe(true)
  })

  it('is not due before', () => {
    expect(isDue(entry, '2026-03-09')).toBe(false)
  })
})
