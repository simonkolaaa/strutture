import type { Difficulty, ProgressState, Word } from '@/core/types'
import { WORDS, seededShuffle } from './words'
import { MIN_LEVEL } from './levels'

/**
 * How many recently shown words stay out of rotation. Two per day (daily +
 * bonus), so this is roughly a month before an unlearned word can come back.
 */
export const RECENT_LIMIT = 60

/** Everyone gets their own order through the list, fixed by the reader's seed. */
const orderCache = new Map<number, Word[]>()
function orderFor(seed: number, pool: readonly Word[]): Word[] {
  if (pool !== WORDS) return seededShuffle(pool, seed) // tests pass their own pool
  let order = orderCache.get(seed)
  if (!order) {
    order = seededShuffle(WORDS, seed)
    orderCache.set(seed, order)
  }
  return order
}

export type DailyPick = { wordId: string; bonusId: string | null }

/**
 * Choose today's word and bonus word for a reader.
 *
 * Candidates come from the reader's level and above, skipping anything already
 * learned, anything they said they knew, and anything shown recently. When a
 * level runs dry the search widens one level down at a time; only when the whole
 * list is exhausted do recently shown words come back.
 *
 * Pure: the same state always gives the same pick, so the UI can render it
 * before the store has persisted it.
 */
export function pickDaily(
  state: Pick<ProgressState, 'level' | 'learned' | 'known' | 'seed' | 'recent'>,
  pool: readonly Word[] = WORDS,
): DailyPick {
  const order = orderFor(state.seed, pool)
  const done = new Set([...Object.keys(state.learned), ...state.known])
  const recent = new Set(state.recent)

  const search = (skipRecent: boolean): Word[] => {
    for (let level = state.level; level >= MIN_LEVEL; level--) {
      const found = order.filter(
        (w) =>
          (w.difficulty ?? MIN_LEVEL) >= level &&
          !done.has(w.id) &&
          (!skipRecent || !recent.has(w.id)),
      )
      if (found.length > 0) return found
    }
    return []
  }

  let candidates = search(true)
  if (candidates.length < 2) candidates = [...candidates, ...search(false).filter((w) => !candidates.includes(w))]
  if (candidates.length === 0) candidates = order // everything learned: start over

  return { wordId: candidates[0].id, bonusId: candidates[1]?.id ?? null }
}

/** Words at or above a level, for the placement test and for the level summary. */
export function wordsAtLevel(level: Difficulty, pool: readonly Word[] = WORDS): Word[] {
  return pool.filter((w) => (w.difficulty ?? MIN_LEVEL) === level)
}
