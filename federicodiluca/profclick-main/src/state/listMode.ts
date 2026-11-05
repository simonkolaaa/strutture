// Come si vede ogni lista: estesa, compatta (una riga per voce) o chiusa. Come il filtro delle
// classi, è una comodità di chi guarda su questo dispositivo, non un dato da sincronizzare.

import { useState } from 'react'
import { type ISODate, startOfWeek } from '@/core/dates'

export type ListMode = 'estesa' | 'compatta' | 'chiusa'

const KEY = 'profclick-list-modes'

function readAll(): Record<string, ListMode> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return value && typeof value === 'object' ? (value as Record<string, ListMode>) : {}
  } catch {
    return {}
  }
}

/**
 * Il modo di una lista, ricordato per nome. Chiusa, si riapre nel modo in cui era. Di base
 * compatta: le voci sono tante, e quella estesa si sceglie quando serve.
 */
export function useListMode(name: string, initial: ListMode = 'compatta') {
  const [state, setState] = useState(() => {
    const saved = readAll()
    return { mode: saved[name] ?? initial, open: (saved[`${name}:aperta`] ?? (initial === 'chiusa' ? 'compatta' : initial)) as ListMode }
  })

  const save = (mode: ListMode) => {
    const open = mode === 'chiusa' ? state.mode === 'chiusa' ? state.open : state.mode : mode
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [name]: mode, [`${name}:aperta`]: open }))
    } catch {
      // Senza storage la scelta vale finché la pagina resta aperta.
    }
    setState({ mode, open })
  }

  return {
    mode: state.mode,
    setMode: save,
    /** Apre o chiude, tornando a estesa o compatta com'era. */
    toggleOpen: () => save(state.mode === 'chiusa' ? state.open : 'chiusa'),
  }
}

const DAYS_KEY = 'profclick-week-closed-days'
const OPENED_KEY = 'profclick-week-opened-days'

function readDays(key: string): Set<string> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return new Set(Array.isArray(value) ? value.filter((d): d is string => typeof d === 'string') : [])
  } catch {
    return new Set()
  }
}

function writeDays(key: string, days: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...days].sort().slice(-60)))
  } catch {
    // Senza storage la scelta vale finché la pagina resta aperta.
  }
}

const GROUPS_KEY = 'profclick-todo-closed-groups'

/** I gruppi chiusi dentro una lista (le settimane di "Da preparare"), per chiave: solo su questo dispositivo. */
export function useClosedGroups() {
  const [closed, setClosed] = useState(() => readDays(GROUPS_KEY))
  const toggle = (key: string) => {
    const next = new Set(closed)
    if (!next.delete(key)) next.add(key)
    writeDays(GROUPS_KEY, next)
    setClosed(next)
  }
  return { isClosed: (key: string) => closed.has(key), toggle }
}

/**
 * I giorni chiusi nella settimana, per data. Nella settimana in corso i giorni già passati si
 * chiudono da soli, a meno di averli riaperti; tornando alle settimane prima sono aperti, perché
 * si va a vederli. Gli altri si chiudono a mano. Si tengono solo gli ultimi: quelli vecchi non servono.
 */
export function useClosedDays(today: ISODate) {
  const [state, setState] = useState(() => ({ closed: readDays(DAYS_KEY), opened: readDays(OPENED_KEY) }))
  const monday = startOfWeek(today)
  const auto = (date: string) => date < today && date >= monday
  const isClosed = (date: string) => (auto(date) ? !state.opened.has(date) : state.closed.has(date))
  const toggle = (date: string) => {
    const key = auto(date) ? 'opened' : 'closed'
    const next = new Set(state[key])
    if (!next.delete(date)) next.add(date)
    writeDays(key === 'opened' ? OPENED_KEY : DAYS_KEY, next)
    setState({ ...state, [key]: next })
  }
  return { isClosed, toggle }
}
