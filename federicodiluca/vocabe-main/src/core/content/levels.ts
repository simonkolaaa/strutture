import type { Difficulty } from '@/core/types'

/**
 * The five rarity levels. A word's level is how likely an Italian reader is to
 * already know it, not how hard it is to spell or pronounce.
 */
export const LEVELS: { value: Difficulty; label: string; hint: string }[] = [
  { value: 1, label: 'Quotidiana', hint: 'la conosce chi legge un giornale' },
  { value: 2, label: 'Colta', hint: 'la usa chi legge libri' },
  { value: 3, label: 'Ricercata', hint: 'la incontri nella buona narrativa' },
  { value: 4, label: 'Rara', hint: 'letteraria o desueta: serve il dizionario' },
  { value: 5, label: 'Rarissima', hint: 'aulica, arcaica, da cruciverba difficile' },
]

export const MIN_LEVEL: Difficulty = 1
export const MAX_LEVEL: Difficulty = 5

export function levelLabel(d: Difficulty): string {
  return LEVELS[d - 1].label
}

/** Clamp any number into a valid level. */
export function toLevel(n: number): Difficulty {
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(n))) as Difficulty
}
