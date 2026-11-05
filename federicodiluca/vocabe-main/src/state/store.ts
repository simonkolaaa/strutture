import type { Difficulty, ProgressState, Settings } from '@/core/types'
import { loadState, saveState, defaultState } from '@/core/storage/store'
import { touchStreak } from '@/core/streak/streak'
import { evaluateBadges } from '@/core/badges/badges'
import { newEntry, grade } from '@/core/srs/leitner'
import { localDateKey } from '@/core/date'
import { pickDaily, RECENT_LIMIT } from '@/core/content/picker'

/*
 * Progress lives in a plain module-level store rather than React context: with a
 * single context every one of the ~14 consumers re-rendered on any change, so
 * starring one word re-rendered the whole 386-row list. Components subscribe to
 * the slice they need through the hooks in ./hooks.
 */

type Listener = () => void

let state: ProgressState | null = null
const listeners = new Set<Listener>()

/** Call once at startup, before the first render. */
export function initProgress(): void {
  state = loadState()
}

export function getProgress(): ProgressState {
  if (!state) state = loadState()
  return state
}

export function subscribeProgress(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// --- persistence -----------------------------------------------------------
// A full state can reach ~40 KB; stringifying it on every keystroke-sized change
// stalls the commit. Batch writes and flush before the page can go away.

const SAVE_DELAY_MS = 400
let saveTimer: ReturnType<typeof setTimeout> | null = null

function flushSave(): void {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  if (state) saveState(state)
}

function scheduleSave(): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(flushSave, SAVE_DELAY_MS)
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushSave)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushSave()
  })
}

function update(fn: (s: ProgressState) => ProgressState): void {
  const prev = getProgress()
  const next = fn(prev)
  if (next === prev) return
  state = next
  scheduleSave()
  for (const listener of listeners) listener()
}

// --- derivations shared by several actions ---------------------------------

/** Fold any newly earned badges into the state. */
function withBadges(s: ProgressState): ProgressState {
  const earned = evaluateBadges(s)
  return earned.length ? { ...s, badges: [...s.badges, ...earned] } : s
}

/** Record `day` as active (for the heatmap), keeping the list sorted and unique. */
function withActiveDay(s: ProgressState, day: string): ProgressState {
  if (s.activeDays.includes(day)) return s
  return { ...s, activeDays: [...s.activeDays, day].sort() }
}

// --- actions ---------------------------------------------------------------

export function markLearned(wordId: string): void {
  update((s) => {
    if (wordId in s.learned) return s
    const today = localDateKey()
    return withBadges(
      withActiveDay(
        {
          ...s,
          learned: { ...s.learned, [wordId]: newEntry(today) },
          streak: touchStreak(s.streak, today),
        },
        today,
      ),
    )
  })
}

export function unmarkLearned(wordId: string): void {
  update((s) => {
    if (!(wordId in s.learned)) return s
    const learned = { ...s.learned }
    delete learned[wordId]
    return { ...s, learned }
  })
}

export function recordRecall(wordId: string, correct: boolean): void {
  update((s) => {
    const entry = s.learned[wordId]
    if (!entry) return s
    const today = localDateKey()
    return withBadges(
      withActiveDay(
        {
          ...s,
          learned: { ...s.learned, [wordId]: grade(entry, correct, today) },
          streak: touchStreak(s.streak, today),
        },
        today,
      ),
    )
  })
}

export function toggleFavorite(wordId: string): void {
  update((s) => ({
    ...s,
    favorites: s.favorites.includes(wordId)
      ? s.favorites.filter((id) => id !== wordId)
      : [...s.favorites, wordId],
  }))
}

export function setNote(wordId: string, text: string): void {
  const trimmed = text.trim()
  update((s) => {
    if ((s.notes[wordId] ?? '') === trimmed) return s
    const notes = { ...s.notes }
    if (trimmed) notes[wordId] = trimmed
    else delete notes[wordId]
    return { ...s, notes }
  })
}

export function updateSettings(patch: Partial<Settings>): void {
  update((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
}

/**
 * Fix today's word and bonus word if not done yet. Idempotent within a day. The
 * pick is what `pickDaily` would return for the current state, so a component
 * that computed it first and this action always agree.
 */
export function ensureDaily(today = localDateKey()): void {
  update((s) => {
    if (s.daily?.date === today) return s
    const pick = pickDaily(s)
    const shown = [pick.wordId, ...(pick.bonusId ? [pick.bonusId] : [])]
    const recent = [...s.recent.filter((id) => !shown.includes(id)), ...shown].slice(-RECENT_LIMIT)
    return { ...s, daily: { date: today, ...pick }, recent }
  })
}

/** Change the starting level by hand. Today's word is re-picked under the new level. */
export function setLevel(level: Difficulty): void {
  update((s) => (s.level === level ? s : { ...s, level, daily: null }))
}

/**
 * Apply a placement result: the level to start from and the words the reader
 * proved to know. Today's assignment is dropped so tomorrow — or a reload —
 * starts from the new level rather than a word picked under the old one.
 */
export function applyPlacement(level: Difficulty, knownIds: string[]): void {
  update((s) => ({
    ...s,
    level,
    known: [...new Set([...s.known, ...knownIds])],
    daily: null,
  }))
}

/** Remember that the recap for the week starting `weekFrom` has been shown. */
export function markRecapSeen(weekFrom: string): void {
  update((s) => (s.lastRecapSeen === weekFrom ? s : { ...s, lastRecapSeen: weekFrom }))
}

export function completeOnboarding(): void {
  update((s) => (s.onboarded ? s : { ...s, onboarded: true }))
}

/** Replace everything — used by the backup import. */
export function replaceProgress(next: ProgressState): void {
  update(() => withBadges(next))
}

export function resetProgress(): void {
  update(() => defaultState())
}
