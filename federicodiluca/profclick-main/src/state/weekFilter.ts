// Le classi spente nella settimana: come il tema, una comodità di chi guarda su questo
// dispositivo, non un dato da sincronizzare.

import { useState } from 'react'

const KEY = 'profclick-week-hidden'

export { MEETINGS } from '@/core/todo'

function read(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function useHiddenCourses() {
  const [hidden, setHidden] = useState(() => new Set(read()))

  const save = (next: Set<string>) => {
    try {
      if (next.size === 0) localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, JSON.stringify([...next]))
    } catch {
      // Senza storage la scelta vale finché la pagina resta aperta.
    }
    setHidden(next)
  }

  const toggle = (id: string) => {
    const next = new Set(hidden)
    if (!next.delete(id)) next.add(id)
    save(next)
  }

  return { hidden, toggle, showAll: () => save(new Set()) }
}
