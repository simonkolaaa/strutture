import type { ProgressState } from '@/core/types'
import { addDays, localDateKey } from '@/core/date'
import { siteUrl } from '@/core/site'

/** Words in the lowest Leitner boxes are the ones still worth a second look. */
const SHAKY_BOX = 2
const MAX_SHAKY = 3

export type WeekRecap = {
  /** Monday that opens the week */
  from: string
  /** Sunday that closes it */
  to: string
  /** ids learned during the week, oldest first */
  learnedIds: string[]
  /** how many of the seven days saw any activity */
  activeDays: number
  /** words learned in the week before, for the comparison line */
  prevLearned: number
  /** longest run of consecutive active days inside the week */
  bestRun: number
  /** ids that keep being missed — worth reopening */
  shakyIds: string[]
}

/**
 * The Monday that opens the week containing `key`. Weeks run Monday to Sunday,
 * as they do on the Italian calendar.
 */
export function weekStart(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0 = Sunday
  return addDays(key, -((dow + 6) % 7))
}

/** Longest run of consecutive days present in `days`, all within one week. */
function longestRun(days: string[]): number {
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const day of days) {
    run = prev && addDays(prev, 1) === day ? run + 1 : 1
    if (run > best) best = run
    prev = day
  }
  return best
}

export function buildRecap(state: ProgressState, from: string): WeekRecap {
  const to = addDays(from, 6)
  const prevFrom = addDays(from, -7)
  const prevTo = addDays(from, -1)
  const entries = Object.entries(state.learned)

  const learnedIds = entries
    .filter(([, e]) => e.learnedOn >= from && e.learnedOn <= to)
    .sort((a, b) => a[1].learnedOn.localeCompare(b[1].learnedOn))
    .map(([id]) => id)

  const days = state.activeDays.filter((d) => d >= from && d <= to).sort()

  return {
    from,
    to,
    learnedIds,
    activeDays: days.length,
    prevLearned: entries.filter(([, e]) => e.learnedOn >= prevFrom && e.learnedOn <= prevTo).length,
    bestRun: longestRun(days),
    shakyIds: entries
      .filter(([, e]) => e.box <= SHAKY_BOX && e.wrong > 0)
      .sort((a, b) => b[1].wrong - a[1].wrong || a[0].localeCompare(b[0]))
      .slice(0, MAX_SHAKY)
      .map(([id]) => id),
  }
}

/** Nothing learned and never opened — not worth showing. */
export function isRecapEmpty(r: WeekRecap): boolean {
  return r.learnedIds.length === 0 && r.activeDays === 0
}

/**
 * The week to greet the reader with, or `null` if there is nothing new to show.
 * Fires once for each completed week in which the reader did something.
 */
export function pendingRecap(state: ProgressState, today = localDateKey()): string | null {
  const lastWeek = addDays(weekStart(today), -7)
  if (state.lastRecapSeen && state.lastRecapSeen >= lastWeek) return null
  return isRecapEmpty(buildRecap(state, lastWeek)) ? null : lastWeek
}

const MONTHS = [
  'gennaio',
  'febbraio',
  'marzo',
  'aprile',
  'maggio',
  'giugno',
  'luglio',
  'agosto',
  'settembre',
  'ottobre',
  'novembre',
  'dicembre',
]

/** "1 – 7 settembre", collapsing the month when both ends share it. */
export function formatWeekRange(from: string, to: string): string {
  const [, fm, fd] = from.split('-').map(Number)
  const [, tm, td] = to.split('-').map(Number)
  const left = fm === tm ? String(fd) : `${fd} ${MONTHS[fm - 1]}`
  return `${left} – ${td} ${MONTHS[tm - 1]}`
}

/**
 * One line on how the week went, given to the reader as the headline. It carries
 * the comparison with the week before, so the sheet doesn't repeat it elsewhere.
 */
export function recapVerdict(r: WeekRecap): string {
  const diff = r.learnedIds.length - r.prevLearned
  if (r.learnedIds.length === 0) return 'Una settimana di pausa. Si riparte da qui.'
  if (r.activeDays === 7) return 'Settimana piena: ci sei stato tutti i giorni.'
  if (r.prevLearned === 0) return r.learnedIds.length >= 3 ? 'Bella settimana.' : 'Qualche parola nuova.'
  if (diff > 0) return `Meglio della settimana scorsa: ${diff} in più.`
  if (diff === 0) return 'Stesso passo della settimana scorsa.'
  return `Settimana più leggera: ${-diff} in meno.`
}

export function recapText(r: WeekRecap): string {
  const w = r.learnedIds.length
  return [
    `La mia settimana su Vocabe (${formatWeekRange(r.from, r.to)}):`,
    `${w} ${w === 1 ? 'parola imparata' : 'parole imparate'} in ${r.activeDays} ${r.activeDays === 1 ? 'giorno' : 'giorni'}.`,
    siteUrl(),
  ].join('\n')
}
