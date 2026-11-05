import { describe, expect, it } from 'vitest'
import { WORDS, getWord, seededShuffle } from './words'

describe('dataset', () => {
  it('has unique ids and terms', () => {
    expect(new Set(WORDS.map((w) => w.id)).size).toBe(WORDS.length)
    expect(new Set(WORDS.map((w) => w.term.toLowerCase())).size).toBe(WORDS.length)
  })

  it('looks words up by id', () => {
    expect(getWord(WORDS[0].id)).toBe(WORDS[0])
    expect(getWord('non-esiste')).toBeUndefined()
  })

  it('gives every word a level from 1 to 5', () => {
    for (const w of WORDS) expect([1, 2, 3, 4, 5], w.id).toContain(w.difficulty)
  })
})

describe('seededShuffle', () => {
  it('is a permutation, stable for a seed and different across seeds', () => {
    const a = seededShuffle(WORDS, 42)
    expect(a).toHaveLength(WORDS.length)
    expect(new Set(a)).toEqual(new Set(WORDS))
    expect(seededShuffle(WORDS, 42)).toEqual(a)
    expect(seededShuffle(WORDS, 43)).not.toEqual(a)
  })
})
