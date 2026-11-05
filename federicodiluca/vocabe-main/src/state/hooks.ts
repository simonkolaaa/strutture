import { useMemo, useSyncExternalStore } from 'react'
import type { ProgressState } from '@/core/types'
import { pickDaily, type DailyPick } from '@/core/content/picker'
import { getInstallState, subscribeInstall, type InstallState } from '@/core/install'
import { getProgress, subscribeProgress } from './store'

/**
 * Subscribe to one slice of the progress state.
 *
 * The selector must return something referentially stable between updates —
 * a primitive, or a slice held directly on the state. Returning a fresh array
 * or object (`.map()`, `{ ... }`) on every call makes React re-render forever:
 * select the raw slice and derive it with `useMemo` in the component instead.
 */
export function useProgressSlice<T>(select: (s: ProgressState) => T): T {
  const snapshot = () => select(getProgress())
  return useSyncExternalStore(subscribeProgress, snapshot, snapshot)
}

/** The whole state — for the few screens that genuinely read most of it. */
export function useProgressState(): ProgressState {
  return useProgressSlice((s) => s)
}

export function useIsLearned(wordId: string): boolean {
  return useProgressSlice((s) => wordId in s.learned)
}

export function useIsFavorite(wordId: string): boolean {
  return useProgressSlice((s) => s.favorites.includes(wordId))
}

export function useNote(wordId: string): string {
  return useProgressSlice((s) => s.notes[wordId] ?? '')
}

/**
 * Today's word and bonus word. Reads the stored assignment when it is for
 * `today`; otherwise computes what `ensureDaily` is about to store, so the very
 * first render already shows the right word.
 *
 * The stored `daily` object is returned as-is (stable reference). The computed
 * fallback is memoised on the inputs that determine it, so it too stays stable
 * between renders and doesn't trip useSyncExternalStore into a loop.
 */
export function useDailyPick(today: string): DailyPick {
  const daily = useProgressSlice((s) => s.daily)
  const level = useProgressSlice((s) => s.level)
  const seed = useProgressSlice((s) => s.seed)
  const learned = useProgressSlice((s) => s.learned)
  const known = useProgressSlice((s) => s.known)
  const recent = useProgressSlice((s) => s.recent)

  return useMemo(() => {
    if (daily?.date === today) return daily
    return pickDaily({ level, seed, learned, known, recent })
  }, [daily, today, level, seed, learned, known, recent])
}

/** Whether the app is installed, and whether the browser offers its own install dialog. */
export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribeInstall, getInstallState, getInstallState)
}
