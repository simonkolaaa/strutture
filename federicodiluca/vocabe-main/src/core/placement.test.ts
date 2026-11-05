import { describe, expect, it } from 'vitest'
import type { Difficulty, Word } from '@/core/types'
import { buildPlacement, PER_LEVEL, scorePlacement } from './placement'
import type { Question } from './quiz'

function word(id: string, difficulty: Difficulty): Word {
  return { id, term: id, meaning: `significato di ${id}`, examples: ['x'], difficulty, category: 'comune' }
}

/** Six words per level — enough to draw PER_LEVEL from each. */
const POOL: Word[] = ([1, 2, 3, 4, 5] as Difficulty[]).flatMap((d) =>
  [1, 2, 3, 4, 5, 6].map((n) => word(`${d}-${n}`, d)),
)

let seed = 1
const rnd = () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

function fakeQuestion(difficulty: Difficulty, id = `${difficulty}-x`): Question {
  const w = word(id, difficulty)
  return { word: w, direction: 'forward', prompt: w.term, options: [w.meaning], answer: 0 }
}

/** `correct` = how many of the PER_LEVEL questions at each level were answered right. */
function answers(correct: Partial<Record<Difficulty, number>>) {
  return ([1, 2, 3, 4, 5] as Difficulty[]).flatMap((d) =>
    Array.from({ length: PER_LEVEL }, (_, i) => ({
      question: fakeQuestion(d, `${d}-${i}`),
      correct: i < (correct[d] ?? 0),
    })),
  )
}

describe('buildPlacement', () => {
  it('asks PER_LEVEL questions per level, easiest first, all forward', () => {
    const qs = buildPlacement({ learned: {}, known: [] }, rnd, POOL)
    expect(qs).toHaveLength(5 * PER_LEVEL)
    expect(qs.map((q) => q.word.difficulty)).toEqual(
      ([1, 2, 3, 4, 5] as Difficulty[]).flatMap((d) => Array(PER_LEVEL).fill(d)),
    )
    expect(qs.every((q) => q.direction === 'forward')).toBe(true)
  })

  it('never asks about words the reader has learned or declared known', () => {
    const qs = buildPlacement(
      { learned: { '3-1': { learnedOn: '', box: 1, dueOn: '', correct: 0, wrong: 0 } }, known: ['3-2', '3-3'] },
      rnd,
      POOL,
    )
    const ids = qs.map((q) => q.word.id)
    expect(ids).not.toContain('3-1')
    expect(ids).not.toContain('3-2')
    expect(ids).not.toContain('3-3')
  })

  it('works on the real dataset', () => {
    expect(buildPlacement({ learned: {}, known: [] })).toHaveLength(5 * PER_LEVEL)
  })
})

describe('scorePlacement', () => {
  it('places a reader who clears nothing at level 1', () => {
    expect(scorePlacement(answers({})).level).toBe(1)
  })

  it('starts from the first level not cleared', () => {
    expect(scorePlacement(answers({ 1: 4, 2: 4, 3: 3, 4: 2, 5: 4 })).level).toBe(4)
  })

  it('does not let lucky guesses at the top skip a failed level', () => {
    expect(scorePlacement(answers({ 1: 4, 2: 1, 3: 4, 4: 4, 5: 4 })).level).toBe(2)
  })

  it('places a reader who clears everything at the top', () => {
    expect(scorePlacement(answers({ 1: 4, 2: 4, 3: 4, 4: 3, 5: 3 })).level).toBe(5)
  })

  it('reports the words answered correctly as known', () => {
    const r = scorePlacement(answers({ 1: 2 }))
    expect(r.knownIds).toEqual(['1-0', '1-1'])
    expect(r.perLevel[1]).toEqual({ correct: 2, asked: 4 })
    expect(r.perLevel[5]).toEqual({ correct: 0, asked: 4 })
  })
})
