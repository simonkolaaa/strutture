/** Rarity level of a word, 1 = everyday .. 5 = extremely rare. */
export type Difficulty = 1 | 2 | 3 | 4 | 5

export type WordCategory =
  | 'comune'
  | 'letteraria'
  | 'scientifica'
  | 'antica'
  | 'regionale'
  | 'straniera'

export type Word = {
  /** stable slug, used as key in progress state — never reuse or renumber */
  id: string
  term: string
  /** part of speech, e.g. "agg." / "s.m." / "v.tr." */
  pos?: string
  meaning: string
  /** a set phrase or construction the word lives in, e.g. «sotto l'egida di» */
  usage?: string
  examples: string[]
  synonyms?: string[]
  etymology?: string
  /** a quote, literary use or fun fact tied to the word */
  curiosity?: string
  category?: WordCategory
  /** rarity, 1 (quotidiana) to 5 (rarissima) — see core/content/levels.ts */
  difficulty?: Difficulty
}

/** Leitner box for spaced recall: 1 (soon) .. 5 (mastered) */
export type RecallBox = 1 | 2 | 3 | 4 | 5

export type LearnedEntry = {
  /** ISO date (local) when first marked as learned */
  learnedOn: string
  box: RecallBox
  /** ISO date (local) the recall quiz is next due */
  dueOn: string
  /** count of correct / wrong recall answers so far */
  correct: number
  wrong: number
}

export type ThemeSetting = 'system' | 'light' | 'dark'
/** Typeface used for the words themselves, not the interface chrome. */
export type ReadingFont = 'serif' | 'sans'
export type TextSize = 'normale' | 'grande'

export type Settings = {
  theme: ThemeSetting
  readingFont: ReadingFont
  textSize: TextSize
  /** display name used when challenging a friend */
  name: string
  /** the reader closed the "install the app" hint on the daily page */
  installHintDismissed: boolean
}

export type ProgressState = {
  version: number
  /** wordId -> entry */
  learned: Record<string, LearnedEntry>
  streak: {
    current: number
    longest: number
    /** ISO date (local) of the last day an action counted toward the streak */
    lastActiveOn: string | null
    /** "salvagenti": each covers one missed day so the streak doesn't reset */
    freezes: number
  }
  /** earned badge ids */
  badges: string[]
  /** ISO dates (local) on which the reader did something that counts — for the activity heatmap */
  activeDays: string[]
  /** word ids the reader starred */
  favorites: string[]
  /** wordId -> free-text personal note */
  notes: Record<string, string>
  /** true once the reader has seen (or skipped) the first-run intro */
  onboarded: boolean
  /** Monday of the last week whose recap was shown — keeps it to once a week */
  lastRecapSeen: string | null
  /**
   * Rarity level the reader starts from: the daily word is drawn from this level
   * and above. Set by the placement test or by hand in Opzioni.
   */
  level: Difficulty
  /** word ids the reader already knew (placement test) — never offered as daily words */
  known: string[]
  /** per-reader shuffle seed, drawn once — makes everyone's sequence different */
  seed: number
  /** today's assignment, fixed for the whole day so it never swaps under the reader */
  daily: { date: string; wordId: string; bonusId: string | null } | null
  /** ids recently shown as daily or bonus, oldest first — kept out of rotation for a while */
  recent: string[]
  settings: Settings
  /** ISO date (local) the app was first opened */
  startedOn: string
}
