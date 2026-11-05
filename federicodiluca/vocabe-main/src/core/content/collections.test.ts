import { describe, expect, it } from 'vitest'
import { getWord } from './words'
import {
  COLLECTIONS,
  collectionProgress,
  collectionWords,
  getCollection,
} from './collections'

describe('collections data', () => {
  it('has a unique id for every collection', () => {
    const ids = COLLECTIONS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only references words that exist', () => {
    const missing = COLLECTIONS.flatMap((c) =>
      c.wordIds.filter((id) => !getWord(id)).map((id) => `${c.id}/${id}`),
    )
    expect(missing).toEqual([])
  })

  it('never repeats a word inside a collection', () => {
    for (const c of COLLECTIONS) {
      expect(new Set(c.wordIds).size, c.id).toBe(c.wordIds.length)
    }
  })

  it('gives every collection a name, a description and enough words to be worth opening', () => {
    for (const c of COLLECTIONS) {
      expect(c.name.length, c.id).toBeGreaterThan(0)
      expect(c.description.length, c.id).toBeGreaterThan(0)
      expect(c.wordIds.length, c.id).toBeGreaterThanOrEqual(10)
    }
  })
})

describe('collection helpers', () => {
  const first = COLLECTIONS[0]

  it('looks a collection up by id', () => {
    expect(getCollection(first.id)).toBe(first)
    expect(getCollection('non-esiste')).toBeUndefined()
  })

  it('resolves the words in curated order', () => {
    expect(collectionWords(first).map((w) => w.id)).toEqual(first.wordIds)
  })

  it('counts learned and already-known words of that collection', () => {
    const learned = {
      [first.wordIds[0]]: {
        learnedOn: '2026-09-07',
        box: 1 as const,
        dueOn: '2026-09-08',
        correct: 0,
        wrong: 0,
      },
      'parola-di-un-altra-raccolta': {
        learnedOn: '2026-09-07',
        box: 1 as const,
        dueOn: '2026-09-08',
        correct: 0,
        wrong: 0,
      },
    }
    expect(collectionProgress(first, { learned, known: [] })).toBe(1)
    expect(collectionProgress(first, { learned, known: [first.wordIds[1]] })).toBe(2)
  })
})
