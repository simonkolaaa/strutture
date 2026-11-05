// Salvataggio locale su IndexedDB (ADR 0003). I dati sono un solo documento JSON: basta
// un archivio chiave-valore, e idb-keyval nasconde le API di IndexedDB dietro get/set.

import { get, set } from 'idb-keyval'
import { emptyData, normalizeData, type ProfclickData } from '@/core/model'

const DATA_KEY = 'profclick.data'
const SYNC_KEY = 'profclick.sync'

/** Dove siamo rispetto al file su Drive: sopravvive alla chiusura dell'app. */
export interface SyncMeta {
  fileId?: string
  /** Versione del file su Drive già unita ai dati locali. */
  baseVersion?: string
  /** Modifiche locali non ancora scritte su Drive. */
  dirty: boolean
}

export async function loadData(): Promise<ProfclickData> {
  const stored = await get<unknown>(DATA_KEY)
  return stored === undefined ? emptyData() : normalizeData(stored)
}

export async function saveData(data: ProfclickData): Promise<void> {
  await set(DATA_KEY, data)
}

export async function loadSyncMeta(): Promise<SyncMeta> {
  return (await get<SyncMeta>(SYNC_KEY)) ?? { dirty: true }
}

export async function saveSyncMeta(meta: SyncMeta): Promise<void> {
  await set(SYNC_KEY, meta)
}
