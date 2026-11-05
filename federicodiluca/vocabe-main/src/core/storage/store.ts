import type { ProgressState, Settings } from '@/core/types'
import { localDateKey } from '@/core/date'
import { toLevel } from '@/core/content/levels'

export const KEY = 'vocabe:v1'
/** Bump together with a new entry in MIGRATIONS below. */
export const STATE_VERSION = 2

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  readingFont: 'serif',
  textSize: 'normale',
  name: '',
  installHintDismissed: false,
}

/** A fresh 32-bit seed. Persisted on first save, so a reader's sequence never changes. */
function newSeed(): number {
  return Math.floor(Math.random() * 0x1_0000_0000)
}

export function defaultState(): ProgressState {
  const today = localDateKey()
  return {
    version: STATE_VERSION,
    learned: {},
    streak: { current: 0, longest: 0, lastActiveOn: null, freezes: 0 },
    badges: [],
    activeDays: [],
    favorites: [],
    notes: {},
    onboarded: false,
    lastRecapSeen: null,
    level: 1,
    known: [],
    seed: newSeed(),
    daily: null,
    recent: [],
    settings: { ...DEFAULT_SETTINGS },
    startedOn: today,
  }
}

function read(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

function write(value: string): void {
  try {
    localStorage.setItem(KEY, value)
  } catch {
    /* private mode / quota — state stays in memory for this session */
  }
}

type RawState = Record<string, unknown>

/**
 * One step per schema change, keyed by the version it upgrades *from*. Add a new
 * entry and bump STATE_VERSION whenever the shape changes in a way that stored
 * data can't satisfy on its own.
 *
 * Version 1 covers everything shipped up to the heatmap: those saves may be
 * missing `activeDays`, `onboarded`, `favorites`, `notes`, `streak.freezes` and
 * `settings.name`, because the version was never bumped while they were added.
 * Anything that is only a new field with a sane default is handled by
 * `normalize` instead — migrations are for data that has to be *derived*.
 */
const MIGRATIONS: Record<number, (s: RawState) => RawState> = {
  1: (s) => {
    const learned = (s.learned ?? {}) as Record<string, { learnedOn?: string }>
    const streak = (s.streak ?? {}) as { lastActiveOn?: string | null }

    // The heatmap didn't exist, so reconstruct the active days from what we know.
    const days = new Set<string>()
    for (const entry of Object.values(learned)) {
      if (entry?.learnedOn) days.add(entry.learnedOn)
    }
    if (streak.lastActiveOn) days.add(streak.lastActiveOn)

    return {
      ...s,
      activeDays: Array.isArray(s.activeDays) && s.activeDays.length ? s.activeDays : [...days].sort(),
      // Someone with progress already knows the app — don't show them the intro.
      onboarded: typeof s.onboarded === 'boolean' ? s.onboarded : days.size > 0,
    }
  },
}

/** Walk a stored blob up to the current schema version. */
function migrate(input: RawState): RawState {
  let s = input
  let version = typeof s.version === 'number' ? s.version : 1
  while (version < STATE_VERSION) {
    const step = MIGRATIONS[version]
    if (step) s = step(s)
    version += 1
  }
  return { ...s, version: STATE_VERSION }
}

function isDaily(d: unknown): d is NonNullable<ProgressState['daily']> {
  if (!d || typeof d !== 'object') return false
  const x = d as Record<string, unknown>
  return typeof x.date === 'string' && typeof x.wordId === 'string'
}

/** Run migrations, then coerce anything missing or malformed to a safe default. */
export function normalize(input: unknown): ProgressState {
  const base = defaultState()
  if (!input || typeof input !== 'object') return base

  const s = migrate(input as RawState) as Partial<ProgressState>
  const learned = s.learned && typeof s.learned === 'object' ? s.learned : base.learned

  return {
    version: STATE_VERSION,
    learned,
    streak: { ...base.streak, ...(s.streak ?? {}) },
    badges: Array.isArray(s.badges) ? s.badges : base.badges,
    activeDays: Array.isArray(s.activeDays) ? s.activeDays : base.activeDays,
    favorites: Array.isArray(s.favorites) ? s.favorites : base.favorites,
    notes: s.notes && typeof s.notes === 'object' ? s.notes : base.notes,
    onboarded: typeof s.onboarded === 'boolean' ? s.onboarded : base.onboarded,
    lastRecapSeen: typeof s.lastRecapSeen === 'string' ? s.lastRecapSeen : base.lastRecapSeen,
    level: typeof s.level === 'number' ? toLevel(s.level) : base.level,
    known: Array.isArray(s.known) ? s.known : base.known,
    seed: typeof s.seed === 'number' ? s.seed : base.seed,
    daily: isDaily(s.daily) ? s.daily : base.daily,
    recent: Array.isArray(s.recent) ? s.recent : base.recent,
    settings: { ...base.settings, ...(s.settings ?? {}) },
    startedOn: typeof s.startedOn === 'string' ? s.startedOn : base.startedOn,
  }
}

export function loadState(): ProgressState {
  const raw = read()
  if (!raw) return defaultState()
  try {
    return normalize(JSON.parse(raw))
  } catch {
    return defaultState()
  }
}

export function saveState(state: ProgressState): void {
  write(JSON.stringify(state))
}

export function exportState(state: ProgressState): string {
  return JSON.stringify(state, null, 2)
}

export function parseImported(text: string): ProgressState {
  return normalize(JSON.parse(text))
}
