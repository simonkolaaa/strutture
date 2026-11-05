import { useMemo, useState } from 'react'
import { useProgressState } from '@/state/hooks'
import { updateSettings } from '@/state/store'
import {
  challengeFromState,
  challengeText,
  challengeUrl,
  type Challenge,
} from '@/core/challenge'
import { copyText } from '@/core/share/share'
import { Button } from '@/ui/Button'
import { Icon } from '@/ui/Icon'
import { Sheet } from '@/ui/Sheet'

async function shareChallenge(text: string): Promise<'shared' | 'copied' | 'failed'> {
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> }
  if (nav.share) {
    try {
      await nav.share({ text })
      return 'shared'
    } catch {
      return 'failed'
    }
  }
  return (await copyText(text)) ? 'copied' : 'failed'
}

function Row({ label, mine, theirs }: { label: string; mine: number; theirs: number }) {
  const win = mine > theirs
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-2 text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className={win ? 'font-semibold text-brand' : ''}>{mine}</span>
      <span className="w-10 text-right text-ink-soft">{theirs}</span>
    </div>
  )
}

export function ChallengeSheet({
  open,
  onClose,
  incoming,
}: {
  open: boolean
  onClose: () => void
  incoming?: Challenge | null
}) {
  const state = useProgressState()
  const [mode, setMode] = useState<'view' | 'create'>(incoming ? 'view' : 'create')
  const [note, setNote] = useState<string | null>(null)

  const mine = useMemo(() => challengeFromState(state), [state])

  async function send() {
    const r = await shareChallenge(challengeText(mine))
    if (r === 'copied') setNote('Link copiato')
    else if (r === 'failed') setNote('Condivisione non riuscita')
  }

  if (incoming && mode === 'view') {
    const who = incoming.n || 'Un amico'
    const diff = mine.s - incoming.s
    const verdict =
      diff > 0 ? 'Sei in vantaggio.' : diff < 0 ? 'Ti tocca recuperare.' : 'Siete pari.'
    return (
      <Sheet open={open} onClose={onClose} title={`${who} ti sfida`}>
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-line pb-1 text-xs text-ink-soft">
          <span />
          <span>tu</span>
          <span className="w-10 text-right">{who.slice(0, 8)}</span>
        </div>
        <Row label="Serie di giorni" mine={mine.s} theirs={incoming.s} />
        <Row label="Parole imparate" mine={mine.w} theirs={incoming.w} />
        <Row label="Giorni attivi" mine={mine.d} theirs={incoming.d} />
        <p className="mt-3 text-center text-sm font-semibold">{verdict}</p>
        <Button className="mt-4 w-full" onClick={() => setMode('create')}>
          Rilancia la sfida
        </Button>
        <Button variant="ghost" className="mt-1 w-full" onClick={onClose}>
          Chiudi
        </Button>
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onClose={onClose} title="Sfida un amico">
      <p className="mb-4 text-sm text-ink-soft">
        Manda il tuo punteggio a un amico. Quando apre il link vede il confronto con il suo.
      </p>
      <label className="mb-4 block">
        <span className="mb-1 block text-xs text-ink-soft">Il tuo nome (facoltativo)</span>
        <input
          value={state.settings.name}
          onChange={(e) => updateSettings({ name: e.target.value.slice(0, 24) })}
          placeholder="es. Marco"
          className="w-full rounded-2xl border border-line bg-paper-raised px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
      </label>
      <div className="mb-4 rounded-2xl bg-brand-soft/50 p-4 text-sm">
        Serie <strong>{mine.s}</strong> · <strong>{mine.w}</strong> parole ·{' '}
        <strong>{mine.d}</strong> giorni attivi
      </div>
      <Button className="w-full" onClick={send}>
        <Icon name="share" size={18} /> Condividi la sfida
      </Button>
      <Button
        variant="outline"
        className="mt-2 w-full"
        onClick={async () => setNote((await copyText(challengeUrl(mine))) ? 'Link copiato' : 'Copia non riuscita')}
      >
        Copia il link
      </Button>
      {note && <p className="mt-3 text-center text-sm text-ink-soft">{note}</p>}
    </Sheet>
  )
}
