import type { ReactNode } from 'react'
import type { Platform } from '@/core/install'
import { SITE_LABEL } from '@/core/site'
import { Button } from '@/ui/Button'
import { Sheet } from '@/ui/Sheet'

/** Safari's share glyph, drawn inline so the step reads like what's on screen. */
function ShareGlyph() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mx-0.5 inline -translate-y-0.5"
      aria-label="Condividi"
    >
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M7 10H5.5v10.5h13V10H17" />
    </svg>
  )
}

function steps(platform: Platform): { intro?: string; list: ReactNode[] } {
  const ua = navigator.userAgent
  if (platform === 'ios') {
    return {
      list: [
        <>
          Tocca <ShareGlyph /> <b>Condividi</b> nella barra del browser (in Safari è in basso, su iPad in alto).
        </>,
        <>
          Scorri l'elenco e scegli <b>Aggiungi alla schermata Home</b>.
        </>,
        <>
          Tocca <b>Aggiungi</b>: Vocabe comparirà tra le tue app.
        </>,
      ],
    }
  }
  if (platform === 'android') {
    return {
      list: [
        <>
          Apri il menu del browser (<b>⋮</b> o <b>≡</b>).
        </>,
        <>
          Scegli <b>Installa app</b> oppure <b>Aggiungi a schermata Home</b>.
        </>,
        <>Conferma: Vocabe comparirà tra le tue app.</>,
      ],
    }
  }
  if (/Firefox\//.test(ua)) {
    return {
      intro: 'Firefox per computer non installa le app web.',
      list: [
        <>
          Apri <b>{SITE_LABEL}</b> con Chrome o Edge e premi di nuovo <b>Installa</b>.
        </>,
        <>Oppure installala dal telefono.</>,
      ],
    }
  }
  if (/Safari\//.test(ua) && !/Chrome\/|Chromium\/|Edg\//.test(ua)) {
    return {
      list: [
        <>
          Nella barra dei menu apri <b>File</b>.
        </>,
        <>
          Scegli <b>Aggiungi al Dock</b> e conferma.
        </>,
      ],
    }
  }
  return {
    list: [
      <>
        Cerca l'icona di installazione a destra nella barra degli indirizzi, oppure apri il menu del browser (<b>⋮</b>).
      </>,
      <>
        Scegli <b>Installa Vocabe</b> (a volte in <b>Trasmetti, salva e condividi</b>) e conferma.
      </>,
    ],
  }
}

/** Manual steps, for browsers that don't offer their own install dialog. */
export function InstallSheet({
  open,
  onClose,
  platform,
}: {
  open: boolean
  onClose: () => void
  platform: Platform
}) {
  if (!open) return null
  const { intro, list } = steps(platform)
  return (
    <Sheet open={open} onClose={onClose} title="Installa Vocabe">
      <p className="mb-4 text-center text-sm text-ink-soft">
        {intro ?? 'Si apre come un\'app, a tutto schermo, e funziona anche offline. Gratis, niente store.'}
      </p>
      <ol className="mb-5 space-y-3">
        {list.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
              {i + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
      <Button variant="outline" className="w-full" onClick={onClose}>
        Ho capito
      </Button>
    </Sheet>
  )
}
