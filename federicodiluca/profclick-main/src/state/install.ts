import { useSyncExternalStore } from 'react'

/** L'evento di Chrome, Edge e Android che permette di aprire la finestra di installazione. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Come si installa ProfClick da qui:
 * - "prompt": il browser offre la sua finestra di installazione;
 * - "ios" / "mac-safari": nessuna API, si spiega il menu da usare;
 * - null: già installata, oppure il browser non permette di installarla.
 */
export type InstallMode = 'prompt' | 'ios' | 'mac-safari' | null

let deferred: BeforeInstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

// Nei test e fuori dal browser non c'è niente da installare.
const inBrowser = typeof window !== 'undefined'
const ua = inBrowser ? navigator.userAgent : ''
// iPadOS si presenta come un Mac: lo tradisce lo schermo touch.
const isIos = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
const isMacSafari = !isIos && /Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg|Firefox|OPR/.test(ua)

// Registrati al caricamento del modulo: l'evento può arrivare prima che React disegni la pagina.
if (inBrowser) {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Niente mini-barra automatica del browser: l'installazione parte dal nostro pulsante.
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    installed = true
    deferred = null
    notify()
  })
}

function getMode(): InstallMode {
  if (!inBrowser || installed || isStandalone()) return null
  if (deferred) return 'prompt'
  if (isIos) return 'ios'
  if (isMacSafari) return 'mac-safari'
  return null
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Apre la finestra di installazione del browser; l'evento vale una volta sola. */
export async function promptInstall() {
  const event = deferred
  if (!event) return
  deferred = null
  await event.prompt()
  const { outcome } = await event.userChoice
  if (outcome === 'accepted') installed = true
  notify()
}

export function useInstallMode() {
  return useSyncExternalStore(subscribe, getMode, () => null)
}
