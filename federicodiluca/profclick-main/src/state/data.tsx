import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { type Change, undoTo } from '@/core/actions'
import type { ProfclickData } from '@/core/model'
import { createDataFile, findDataFile, getVersion, readDataFile, updateDataFile } from '@/google/drive'
import { useAuth } from './auth'
import { loadData, loadSyncMeta, saveData, saveSyncMeta } from './storage'
import { type DriveApi, SyncEngine, type SyncStatus } from './syncEngine'

export type { SyncStatus }

interface DataContextValue {
  data: ProfclickData
  /** Applica una modifica (una delle funzioni pure di core/actions), salva e sincronizza. */
  apply: (change: Change) => void
  /** Come apply, con un avviso che permette di tornare indietro. */
  applyWithUndo: (change: Change, message: string) => void
  importData: (data: ProfclickData) => void
  sync: SyncStatus
  syncNow: () => void
}

const DataContext = createContext<DataContextValue | null>(null)

const drive: DriveApi = { find: findDataFile, getVersion, read: readDataFile, create: createDataFile, update: updateDataFile }

// Attesa dopo l'ultima modifica prima di scrivere su Drive: più tocchi ravvicinati
// (es. tre spunte di fila) finiscono in una sola scrittura.
const PUSH_DELAY_MS = 1500

export function DataProvider({ children }: { children: ReactNode }) {
  const { expire } = useAuth()
  const [engine, setEngine] = useState<SyncEngine>()
  const [loadError, setLoadError] = useState<string>()

  useEffect(() => {
    Promise.all([loadData(), loadSyncMeta()])
      .then(([data, meta]) =>
        setEngine(
          new SyncEngine({
            data,
            meta,
            drive,
            saveData: (d) => saveData(d).catch(() => toast.error('Salvataggio non riuscito su questo dispositivo')),
            saveMeta: (m) => saveSyncMeta(m).catch(() => {}),
            onUnauthorized: expire,
          }),
        ),
      )
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : String(e)))
  }, [expire])

  if (loadError) return <p className="p-6 text-destructive">Impossibile leggere i dati salvati: {loadError}</p>
  if (!engine) return null
  return <EngineBridge engine={engine}>{children}</EngineBridge>
}

function EngineBridge({ engine, children }: { engine: SyncEngine; children: ReactNode }) {
  const { token } = useAuth()
  const snapshot = useSyncExternalStore(engine.subscribe, engine.getSnapshot)
  const pushTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const syncNow = useCallback(() => {
    if (token) void engine.sync(token)
  }, [engine, token])

  const schedulePush = useCallback(() => {
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(syncNow, PUSH_DELAY_MS)
  }, [syncNow])

  const apply = useCallback(
    (change: Change) => {
      engine.apply(change)
      schedulePush()
    },
    [engine, schedulePush],
  )

  const applyWithUndo = useCallback(
    (change: Change, message: string) => {
      const before = engine.getSnapshot().data
      apply(change)
      toast(message, {
        action: {
          label: 'Annulla',
          onClick: () => apply(undoTo(before)),
        },
      })
    },
    [apply, engine],
  )

  const importData = useCallback(
    (data: ProfclickData) => {
      engine.importData(data)
      schedulePush()
    },
    [engine, schedulePush],
  )

  const value = useMemo<DataContextValue>(
    () => ({ ...snapshot, apply, applyWithUndo, importData, syncNow }),
    [snapshot, apply, applyWithUndo, importData, syncNow],
  )

  // Si sincronizza al login, quando l'app torna in primo piano (magari dopo averla usata
  // da un altro dispositivo) e quando torna la rete.
  useEffect(() => {
    syncNow()
    const onVisible = () => document.visibilityState === 'visible' && syncNow()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', syncNow)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', syncNow)
    }
  }, [syncNow])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  const value = useContext(DataContext)
  if (!value) throw new Error('useData va usato dentro DataProvider')
  return value
}
