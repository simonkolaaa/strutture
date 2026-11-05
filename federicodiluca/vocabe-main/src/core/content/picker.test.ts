import { describe, expect, it } from 'vitest'
import type { Difficulty, LearnedEntry, Word } from '@/core/types'
import { WORDS } from './words'
import { pickDaily, RECENT_LIMIT } from './picker'

const entry: LearnedEntry = { learnedOn: '2026-09-07', box: 1, dueOn: '2026-09-08', correct: 0, wrong: 0 }

function word(id: string, difficulty: Difficulty): Word {
  return { id, term: id, meaning: `significato di ${id}`, examples: ['x'], difficulty }
}

/** Two words per level, ten in all. */
const POOL: Word[] = ([1, 2, 3, 4, 5] as Difficulty[]).flatMap((d) => [word(`${d}a`, d), word(`${d}b`, d)])

const base = { level: 1 as Difficulty, learned: {}, known: [] as string[], seed: 7, recent: [] as string[] }
const level = (id: string) => POOL.find((w) => w.id === id)!.difficulty!

describe('pickDaily', () => {
  it('is deterministic for the same state', () => {
    expect(pickDaily(base, POOL)).toEqual(pickDaily(base, POOL))
  })

  it('gives different readers different words', () => {
    const picks = new Set([1, 2, 3, 4, 5, 6].map((seed) => pickDaily({ ...base, seed }, WORDS).wordId))
    expect(picks.size).toBeGreaterThan(1)
  })

  it('never picks the same word as daily and bonus', () => {
    const p = pickDaily(base, POOL)
    expect(p.bonusId).not.toBe(p.wordId)
  })

  it('only draws from the reader level and above', () => {
    for (let i = 0; i < 20; i++) {
      const p = pickDaily({ ...base, level: 4, seed: i }, POOL)
      expect(level(p.wordId)).toBeGreaterThanOrEqual(4)
      expect(level(p.bonusId!)).toBeGreaterThanOrEqual(4)
    }
  })

  it('skips learned, known and recently shown words', () => {
    const p = pickDaily(
      { ...base, level: 5, learned: { '5a': entry }, known: [], recent: ['5b'] },
      POOL,
    )
    // Both level-5 words are out of reach, so it widens to level 4.
    expect(level(p.wordId)).toBe(4)
    expect(pickDaily({ ...base, level: 5, known: ['5a', '5b'] }, POOL).wordId).not.toMatch(/^5/)
  })

  it('widens one level at a time when a level runs dry', () => {
    const p = pickDaily({ ...base, level: 5, known: ['5a', '5b', '4a', '4b'] }, POOL)
    expect(level(p.wordId)).toBe(3)
  })

  it('lets recent words back only when nothing else is left', () => {
    const recent = POOL.map((w) => w.id)
    const p = pickDaily({ ...base, recent }, POOL)
    expect(p.wordId).toBeDefined()
    expect(POOL.map((w) => w.id)).toContain(p.wordId)
  })

  it('starts over when everything is learned', () => {
    const learned = Object.fromEntries(POOL.map((w) => [w.id, entry]))
    const p = pickDaily({ ...base, learned }, POOL)
    expect(POOL.map((w) => w.id)).toContain(p.wordId)
  })

  it('keeps a full recent window out of rotation on the real list', () => {
    const recent = WORDS.slice(0, RECENT_LIMIT).map((w) => w.id)
    const p = pickDaily({ ...base, recent }, WORDS)
    expect(recent).not.toContain(p.wordId)
    expect(recent).not.toContain(p.bonusId)
  })
})
