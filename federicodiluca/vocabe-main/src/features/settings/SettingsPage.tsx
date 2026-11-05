import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProgressState } from '@/state/hooks'
import { updateSettings, replaceProgress, resetProgress, setLevel } from '@/state/store'
import { exportState, parseImported } from '@/core/storage/store'
import { LEVELS } from '@/core/content/levels'
import type { ReadingFont, TextSize, ThemeSetting } from '@/core/types'
import { Button } from '@/ui/Button'
import { Icon } from '@/ui/Icon'
import { cn } from '@/ui/cn'
import { InstallButton } from '@/features/install/InstallButton'
import { InviteSheet } from './InviteSheet'

const THEMES: { value: ThemeSetting; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Chiaro' },
  { value: 'dark', label: 'Scuro' },
]

const FONTS: { value: ReadingFont; label: string }[] = [
  { value: 'serif', label: 'Classico' },
  { value: 'sans', label: 'Moderno' },
]

const SIZES: { value: TextSize; label: string }[] = [
  { value: 'normale', label: 'Normale' },
  { value: 'grande', label: 'Grande' },
]

/** Segmented control shared by the three appearance settings. */
function Choice<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 rounded-2xl border py-2.5 text-sm font-medium transition',
            value === o.value ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink-soft',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SettingsPage() {
  const state = useProgressState()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  function flash(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(null), 3000)
  }

  function onExport() {
    const blob = new Blob([exportState(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vocabe-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onImportFile(file: File) {
    try {
      replaceProgress(parseImported(await file.text()))
      flash('Progressi importati')
    } catch {
      flash('File non valido')
    }
  }

  return (
    <div className="space-y-6 pt-2">
      <InstallButton />

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink-soft">Livello di partenza</h2>
        <p className="mb-3 text-xs text-ink-soft">
          La parola del giorno viene scelta da questo livello in su. {LEVELS[state.level - 1].hint}.
        </p>
        <div className="space-y-1.5">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              onClick={() => setLevel(l.value)}
              className={cn(
                'flex w-full items-center justify-between rounded-2xl border px-4 py-2.5 text-left text-sm transition',
                state.level === l.value ? 'border-brand bg-brand-soft text-brand' : 'border-line',
              )}
            >
              <span className="font-medium">{l.label}</span>
              <span className={cn('text-xs', state.level === l.value ? 'text-brand' : 'text-ink-soft')}>
                {'●'.repeat(l.value)}
                {'○'.repeat(5 - l.value)}
              </span>
            </button>
          ))}
        </div>
        <Link
          to="/livello"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-line py-3 text-sm font-semibold transition hover:bg-line/40"
        >
          <Icon name="cards" size={18} /> Fai il test di livello
        </Link>
        {state.known.length > 0 && (
          <p className="mt-2 text-xs text-ink-soft">
            {state.known.length} {state.known.length === 1 ? 'parola che conoscevi già è messa' : 'parole che conoscevi già sono messe'} da parte.
          </p>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink-soft">Tema</h2>
          <Choice
            options={THEMES}
            value={state.settings.theme}
            onChange={(theme) => updateSettings({ theme })}
          />
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink-soft">Carattere delle parole</h2>
          <Choice
            options={FONTS}
            value={state.settings.readingFont}
            onChange={(readingFont) => updateSettings({ readingFont })}
          />
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink-soft">Dimensione del testo</h2>
          <Choice
            options={SIZES}
            value={state.settings.textSize}
            onChange={(textSize) => updateSettings({ textSize })}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink-soft">Dati</h2>
        <div className="space-y-2">
          <Button variant="outline" className="w-full" onClick={onExport}>
            Esporta progressi (backup)
          </Button>
          <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
            Importa da file
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onImportFile(f)
              e.target.value = ''
            }}
          />
          <Button
            variant="ghost"
            className="w-full text-bad"
            onClick={() => {
              if (confirm('Cancellare tutti i progressi? Non si può annullare.')) {
                resetProgress()
                flash('Tutto azzerato')
              }
            }}
          >
            Azzera tutto
          </Button>
        </div>
        {msg && <p className="mt-2 text-center text-sm text-ink-soft">{msg}</p>}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink-soft">Fai conoscere Vocabe</h2>
        <Button variant="outline" className="w-full" onClick={() => setInviteOpen(true)}>
          <Icon name="share" size={18} /> Invita un amico
        </Button>
      </section>

      <p className="pt-4 text-center text-xs text-ink-soft">
        <a href={`${import.meta.env.BASE_URL}parole/`} className="underline">
          Glossario
        </a>
        <span className="mx-2">·</span>
        <a href={`${import.meta.env.BASE_URL}privacy/`} className="underline">
          Privacy
        </a>
        <span className="mx-2">·</span>i tuoi dati restano su questo dispositivo
      </p>

      <p className="text-center text-xs text-ink-soft">
        Un progetto di{' '}
        <a
          href="https://federicodiluca.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Federico Di Luca
        </a>
      </p>

      <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  )
}
