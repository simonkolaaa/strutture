// Il tema scelto su questo dispositivo: una comodità di chi guarda, non un dato da
// sincronizzare. Lo applica public/theme.js, caricato in testa alla pagina (profclickApplyTheme),
// che segue anche i cambi del sistema e delle altre schede.

import { useEffect, useState } from 'react'

export type ThemeChoice = 'system' | 'light' | 'dark'

const KEY = 'profclick-theme'

declare global {
  interface Window {
    profclickApplyTheme?: () => void
  }
}

function readChoice(): ThemeChoice {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

function resolved(): 'light' | 'dark' {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function useTheme() {
  const [choice, setChoiceState] = useState<ThemeChoice>(readChoice)
  const [theme, setTheme] = useState(resolved)

  // Il tema effettivo cambia anche da fuori: il sistema passa allo scuro, un'altra scheda sceglie.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(resolved())
      setChoiceState(readChoice())
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const setChoice = (next: ThemeChoice) => {
    try {
      if (next === 'system') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, next)
    } catch {
      // Senza storage la scelta vale finché la pagina resta aperta.
      document.documentElement.dataset.theme = next === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : next
    }
    setChoiceState(next)
    window.profclickApplyTheme?.()
  }

  return { choice, theme, setChoice }
}
