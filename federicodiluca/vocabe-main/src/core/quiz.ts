import type { Word } from '@/core/types'
import { WORDS, getWord } from '@/core/content/words'

export type Direction = 'forward' | 'inverse'

export type Question = {
  word: Word
  direction: Direction
  /** the term (forward) or the definition (inverse) */
  prompt: string
  options: string[]
  answer: number
}

export const QUIZ_LENGTH = 5
/** From this Leitner box on, the harder "definition → word" direction kicks in. */
export const INVERSE_FROM_BOX = 3
const OPTIONS = 4

export type Rng = () => number

function shuffle<T>(arr: readonly T[], rnd: Rng): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * The grammatical family of a word: a verb's definition can only be confused
 * with another verb's, a noun's with a noun's. Finer distinctions (transitive
 * vs intransitive, masculine vs feminine) don't show in a definition, so they
 * are folded together — which also keeps the tiny classes usable.
 */
export function posFamily(pos: string | undefined): 'verbo' | 'nome' | 'aggettivo' | 'altro' {
  if (!pos) return 'altro'
  if (pos.startsWith('v.')) return 'verbo'
  if (pos.startsWith('s.')) return 'nome'
  if (pos.startsWith('agg')) return 'aggettivo'
  return 'altro'
}

const byFamily = new Map<string, Word[]>()
for (const w of WORDS) {
  const key = posFamily(w.pos)
  const bucket = byFamily.get(key)
  if (bucket) bucket.push(w)
  else byFamily.set(key, [w])
}

/**
 * Distractors drawn at random from the whole list are usually giveaways — a
 * literary term next to three everyday ones answers itself, and so does an
 * adjective's definition offered for a verb. So the candidates must share the
 * word's grammatical family, and within it the narrowest pool comes first
 * (same category and difficulty), widening only to top up. The whole list is
 * the last resort, for families too small to fill the options (adverbs).
 */
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
/** The first letters of a term, enough to recognise its inflected and derived forms. */
export function stemOf(term: string): string {
  return fold(term).slice(0, Math.max(4, term.length - 3))
}

const listsAsSynonym = (a: Word, b: Word) =>
  (a.synonyms ?? []).some((s) => fold(s) === fold(b.term))

/**
 * True when one word gives the other away, in either direction:
 *
 *   - its definition contains the other's root ("bruma" in an option when the
 *     question is about "brumoso");
 *   - the dataset lists one as a synonym of the other ("torvo" / "bieco"), in
 *     which case both definitions fit the prompt and the question has no single
 *     right answer.
 *
 * Such a pair must never sit in the same question.
 */
export function leaks(a: Word, b: Word): boolean {
  if (listsAsSynonym(a, b) || listsAsSynonym(b, a)) return true
  const ma = fold(a.meaning)
  const mb = fold(b.meaning)
  return new RegExp(`\\b${stemOf(a.term)}`).test(mb) || new RegExp(`\\b${stemOf(b.term)}`).test(ma)
}

function distractorsFor(word: Word, count: number, rnd: Rng): Word[] {
  const chosen: Word[] = []
  const used = new Set([word.id])
  const family = byFamily.get(posFamily(word.pos)) ?? []
  const sameCategory = family.filter((w) => w.category === word.category)

  const tiers: readonly Word[][] = [
    sameCategory.filter((w) => w.difficulty === word.difficulty),
    sameCategory,
    family,
    WORDS,
  ]

  for (const tier of tiers) {
    if (chosen.length >= count) break
    for (const candidate of shuffle(tier, rnd)) {
      if (chosen.length >= count) break
      if (used.has(candidate.id)) continue
      used.add(candidate.id)
      if (leaks(word, candidate)) continue
      chosen.push(candidate)
    }
  }
  return chosen
}

export function makeQuestion(word: Word, direction: Direction, rnd: Rng = Math.random): Question {
  const distractors = distractorsFor(word, OPTIONS - 1, rnd)
  const correct = direction === 'inverse' ? word.term : word.meaning
  const options = shuffle(
    [correct, ...distractors.map((w) => (direction === 'inverse' ? w.term : w.meaning))],
    rnd,
  )
  return {
    word,
    direction,
    prompt: direction === 'inverse' ? word.meaning : word.term,
    options,
    answer: options.indexOf(correct),
  }
}

/** Builds one round of recall questions from the words that are due. */
export function buildQuiz(
  due: readonly { id: string; box: number }[],
  rnd: Rng = Math.random,
): Question[] {
  return shuffle(due, rnd)
    .slice(0, QUIZ_LENGTH)
    .flatMap(({ id, box }) => {
      const word = getWord(id)
      if (!word) return []
      return [makeQuestion(word, box >= INVERSE_FROM_BOX ? 'inverse' : 'forward', rnd)]
    })
}
