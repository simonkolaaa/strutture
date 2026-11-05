import type { Difficulty, ProgressState, Word } from '@/core/types'
import { WORDS } from '@/core/content/words'
import { LEVELS, MIN_LEVEL, toLevel } from '@/core/content/levels'
import { makeQuestion, type Question, type Rng } from '@/core/quiz'

/** Questions per level; five levels → a twenty-question test. */
export const PER_LEVEL = 4
/** Correct answers (out of PER_LEVEL) needed to be placed at or above a level. */
export const PASS_MARK = 3

function shuffle<T>(arr: readonly T[], rnd: Rng): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Build the placement test: a few words from every level, easiest first, all
 * asked as "what does X mean". Words the reader has already learned or already
 * declared known are left out — they'd tell us nothing.
 */
export function buildPlacement(
  state: Pick<ProgressState, 'learned' | 'known'>,
  rnd: Rng = Math.random,
  pool: readonly Word[] = WORDS,
): Question[] {
  const done = new Set([...Object.keys(state.learned), ...state.known])
  return LEVELS.flatMap(({ value }) =>
    shuffle(
      pool.filter((w) => (w.difficulty ?? MIN_LEVEL) === value && !done.has(w.id)),
      rnd,
    )
      .slice(0, PER_LEVEL)
      .map((w) => makeQuestion(w, 'forward', rnd)),
  )
}

export type PlacementResult = {
  /** the level to start from */
  level: Difficulty
  /** words answered correctly — the reader already knows these */
  knownIds: string[]
  /** correct answers per level, for the result screen */
  perLevel: Record<Difficulty, { correct: number; asked: number }>
}

/**
 * Score the test. The reader starts from the first level they did *not* clear,
 * walking up from the bottom — a staircase, so a couple of lucky guesses at the
 * top don't skip the middle. Clearing every level places them at the top;
 * clearing none, at level 1.
 */
export function scorePlacement(
  answers: readonly { question: Question; correct: boolean }[],
): PlacementResult {
  const perLevel = Object.fromEntries(
    LEVELS.map((l) => [l.value, { correct: 0, asked: 0 }]),
  ) as PlacementResult['perLevel']

  for (const { question, correct } of answers) {
    const level = toLevel(question.word.difficulty ?? MIN_LEVEL)
    perLevel[level].asked += 1
    if (correct) perLevel[level].correct += 1
  }

  let level: Difficulty = MIN_LEVEL
  for (const { value } of LEVELS) {
    const { correct, asked } = perLevel[value]
    level = value
    const cleared = asked > 0 && correct >= Math.min(PASS_MARK, asked)
    if (!cleared) break
  }

  return {
    level,
    knownIds: answers.filter((a) => a.correct).map((a) => a.question.word.id),
    perLevel,
  }
}
