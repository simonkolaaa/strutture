import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRegisterSW } from 'virtual:pwa-register/react'

const UPDATE_CHECK_MS = 60 * 60 * 1000

/**
 * Avvisa quando è pronta una nuova versione dell'app. Il service worker la scarica in
 * background, ma la pagina aperta continua con quella vecchia finché non si ricarica: senza
 * questo avviso le novità comparivano solo al ricaricamento successivo, per caso.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      // Un'app installata può restare aperta per giorni: si controlla ogni ora e al ritorno in primo piano.
      setInterval(() => registration.update(), UPDATE_CHECK_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update()
      })
    },
  })

  useEffect(() => {
    if (!needRefresh) return
    toast('È disponibile una nuova versione di ProfClick', {
      id: 'update',
      duration: Infinity,
      description: 'I tuoi dati restano dove sono.',
      action: { label: 'Aggiorna', onClick: () => void updateServiceWorker(true) },
    })
  }, [needRefresh, updateServiceWorker])

  return null
}
