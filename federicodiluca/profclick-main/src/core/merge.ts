// Unione di due versioni dei dati (ADR 0003): quella del dispositivo e quella su Drive.
// Per ogni record vince la modifica più recente; un record cancellato resta cancellato se
// la cancellazione è più recente dell'ultima modifica. L'unione è commutativa: non conta
// chi sincronizza per primo, alla fine tutti i dispositivi arrivano agli stessi dati.

import type { Collection, ProfclickData, Stamped } from './model'

export const COLLECTIONS: Collection[] = ['courses', 'topics', 'lessons', 'meetings', 'notes', 'archive']

export function tombstone(collection: Collection, key: string): string {
  return `${collection}:${key}`
}

function newer<T extends Stamped>(a: T | undefined, b: T | undefined): T | undefined {
  if (!a) return b
  if (!b) return a
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt ? a : b
  // Stesso istante: si sceglie in modo deterministico, così entrambi i lati concordano.
  return JSON.stringify(a) >= JSON.stringify(b) ? a : b
}

export function mergeData(a: ProfclickData, b: ProfclickData): ProfclickData {
  const deleted: Record<string, number> = { ...a.deleted }
  for (const [key, at] of Object.entries(b.deleted)) deleted[key] = Math.max(deleted[key] ?? 0, at)

  const result: ProfclickData = {
    schema: 1,
    year: newer(a.year ?? undefined, b.year ?? undefined) ?? null,
    courses: {},
    topics: {},
    lessons: {},
    meetings: {},
    notes: {},
    archive: {},
    deleted,
  }

  for (const collection of COLLECTIONS) {
    const left = a[collection] as Record<string, Stamped>
    const right = b[collection] as Record<string, Stamped>
    const target = result[collection] as Record<string, Stamped>
    for (const key of new Set([...Object.keys(left), ...Object.keys(right)])) {
      const winner = newer(left[key], right[key])!
      const removedAt = deleted[tombstone(collection, key)]
      if (removedAt === undefined || winner.updatedAt > removedAt) target[key] = winner
    }
  }
  return result
}

/** Confronto per contenuto, indipendente dall'ordine delle chiavi. */
export function sameData(a: ProfclickData, b: ProfclickData): boolean {
  return canonical(a) === canonical(b)
}

function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([x], [y]) => (x < y ? -1 : 1))) : v,
  )
}
