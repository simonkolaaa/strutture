import { describe, expect, it } from 'vitest'
import { defaultState } from '@/core/storage/store'
import { COLLECTIONS } from '@/core/content/collections'
import type { LearnedEntry, ProgressState } from '@/core/types'
import { evaluateBadges } from './badges'

function learn(ids: string[]): ProgressState['learned'] {
  const entry: LearnedEntry = {
    learnedOn: '2026-09-07',
    box: 1,
    dueOn: '2026-09-08',
    correct: 0,
    wrong: 0,
  }
  return Object.fromEntries(ids.map((id) => [id, entry]))
}

describe('evaluateBadges', () => {
  it('returns nothing for a fresh state', () => {
    expect(evaluateBadges(defaultState())).toEqual([])
  })

  it('never re-awards a badge already held', () => {
    const s = { ...defaultState(), learned: learn(['effimero']), badges: ['first-word'] }
    expect(evaluateBadges(s)).not.toContain('first-word')
  })

  it('awards the collection badge once every word of one is learned', () => {
    const words = COLLECTIONS[0].wordIds
    const partial = { ...defaultState(), learned: learn(words.slice(0, -1)) }
    expect(evaluateBadges(partial)).not.toContain('raccolta-1')

    const full = { ...defaultState(), learned: learn(words) }
    expect(evaluateBadges(full)).toContain('raccolta-1')
    expect(evaluateBadges(full)).not.toContain('raccolta-3')
  })

  it('awards the second collection badge at three', () => {
    const three = COLLECTIONS.slice(0, 3).flatMap((c) => c.wordIds)
    const s = { ...defaultState(), learned: learn(three) }
    expect(evaluateBadges(s)).toContain('raccolta-3')
  })
})
