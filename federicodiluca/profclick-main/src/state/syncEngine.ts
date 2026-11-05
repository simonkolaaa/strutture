// Il motore dei dati: tiene lo stato, applica le modifiche e lo sincronizza con Drive
// (ADR 0003). A differenza di un semplice "vince l'ultimo", unisce le due versioni record
// per record (core/merge.ts): nessun conflitto da risolvere a mano, nemmeno dopo aver
// lavorato offline su due dispositivi. È una classe senza React, così si testa con un
// Drive finto; React la legge con useSyncExternalStore (vedi data.tsx).

import type { Change } from '@/core/actions'
import { mergeData, sameData } from '@/core/merge'
import type { ProfclickData } from '@/core/model'
import { GoogleApiError } from '@/google/http'
import type { SyncMeta } from './storage'

export type SyncStatus =
  | { state: 'off' }
  | { state: 'syncing' }
  | { state: 'synced'; at: Date }
  | { state: 'pending' }
  | { state: 'offline' }
  | { state: 'error'; message: string }

/** Le operazioni sul file di Drive: in produzione google/drive.ts, nei test un finto. */
export interface DriveApi {
  find(token: string): Promise<{ id: string; version: string } | null>
  getVersion(token: string, fileId: string): Promise<string | null>
  read(token: string, fileId: string): Promise<ProfclickData>
  create(token: string, data: ProfclickData): Promise<{ id: string; version: string }>
  update(token: string, fileId: string, data: ProfclickData): Promise<string>
}

export interface EngineOptions {
  data: ProfclickData
  meta: SyncMeta
  drive: DriveApi
  saveData: (data: ProfclickData) => void
  saveMeta: (meta: SyncMeta) => void
  /** Chiamata su 401: il token non vale più. */
  onUnauthorized: () => void
}

export interface EngineSnapshot {
  data: ProfclickData
  sync: SyncStatus
}

export class SyncEngine {
  private data: ProfclickData
  private meta: SyncMeta
  private running = false
  private rerun = false
  private snapshot: EngineSnapshot
  private listeners = new Set<() => void>()
  private readonly options: EngineOptions

  constructor(options: EngineOptions) {
    this.options = options
    this.data = options.data
    this.meta = options.meta
    this.snapshot = { data: this.data, sync: { state: 'off' } }
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.snapshot

  private publish(patch: Partial<EngineSnapshot>) {
    this.snapshot = { ...this.snapshot, data: this.data, ...patch }
    for (const listener of this.listeners) listener()
  }

  apply(change: Change): void {
    this.setData(change(this.data))
    this.setMeta({ dirty: true })
    const state = this.snapshot.sync.state
    this.publish(state === 'syncing' || state === 'off' ? {} : { sync: { state: 'pending' } })
  }

  /** Sostituisce tutti i dati (es. ripristino di un backup): si unisce come un altro dispositivo. */
  importData(data: ProfclickData): void {
    this.apply((current) => mergeData(current, data))
  }

  private setData(next: ProfclickData) {
    this.data = next
    this.options.saveData(next)
  }

  private setMeta(patch: Partial<SyncMeta>) {
    this.meta = { ...this.meta, ...patch }
    this.options.saveMeta(this.meta)
  }

  /**
   * Allinea dati locali e file su Drive. Una sola alla volta: una richiesta che arriva
   * mentre un'altra è in corso la fa ripetere alla fine, invece di sovrapporsi.
   */
  async sync(token: string): Promise<void> {
    if (this.running) {
      this.rerun = true
      return
    }
    this.running = true
    this.publish({ sync: { state: 'syncing' } })
    try {
      do {
        this.rerun = false
        await this.syncOnce(token)
      } while (this.rerun)
      this.publish({ sync: this.meta.dirty ? { state: 'pending' } : { state: 'synced', at: new Date() } })
    } catch (e) {
      if (e instanceof GoogleApiError && e.status === 401) {
        this.options.onUnauthorized()
        this.publish({ sync: { state: 'off' } })
      } else if (e instanceof TypeError) {
        // fetch lancia TypeError quando la rete non c'è: si riprova al ritorno online.
        this.publish({ sync: { state: 'offline' } })
      } else {
        this.publish({ sync: { state: 'error', message: e instanceof Error ? e.message : String(e) } })
      }
    } finally {
      this.running = false
    }
  }

  private async syncOnce(token: string): Promise<void> {
    const { drive } = this.options
    let fileId = this.meta.fileId
    let version = fileId ? await drive.getVersion(token, fileId) : null
    if (version === null) {
      // Il file ricordato non c'è più, o non c'è mai stato: lo si cerca per nome.
      const found = await drive.find(token)
      fileId = found?.id
      version = found?.version ?? null
    }

    if (!fileId || version === null) {
      const written = this.data
      const created = await drive.create(token, written)
      this.afterWrite(created.id, created.version, written)
      return
    }

    if (fileId !== this.meta.fileId || version !== this.meta.baseVersion) {
      // Drive è cambiato da un altro dispositivo: si uniscono le due versioni.
      const remote = await drive.read(token, fileId)
      // Da qui alla scrittura tutto è sincrono: nessuna modifica può inserirsi a metà.
      const merged = mergeData(this.data, remote)
      if (!sameData(merged, this.data)) {
        this.setData(merged)
        this.publish({})
      }
      if (sameData(merged, remote)) {
        this.setMeta({ fileId, baseVersion: version, dirty: false })
        return
      }
      const written = this.data
      this.afterWrite(fileId, await drive.update(token, fileId, written), written)
      return
    }

    if (this.meta.dirty) {
      const written = this.data
      this.afterWrite(fileId, await drive.update(token, fileId, written), written)
    }
  }

  /** Dopo una scrittura: se nel frattempo sono arrivate modifiche, serve un altro giro. */
  private afterWrite(fileId: string, version: string, written: ProfclickData) {
    const dirty = this.data !== written
    this.setMeta({ fileId, baseVersion: version, dirty })
    this.rerun ||= dirty
  }
}
