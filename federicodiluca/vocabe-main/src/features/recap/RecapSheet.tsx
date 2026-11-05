import { useMemo, useState } from 'react'
import { useProgressState } from '@/state/hooks'
import { getWord } from '@/core/content/words'
import { buildRecap, formatWeekRange, recapText, recapVerdict } from '@/core/recap/recap'
import { copyText } from '@/core/share/share'
import { Button } from '@/ui/Button'
import { Icon } from '@/ui/Icon'
import { Sheet } from '@/ui/Sheet'

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-brand-soft/50 p-3 text-center">
      <div className="font-serif text-2xl font-semibold">{value}</div>
      <div className="text-xs text-ink-soft">{label}</div>
    </div>
  )
}

export function RecapSheet({
  open,
  onClose,
  from,
}: {
  open: boolean
  onClose: () => void
  /** Monday of the week to recap */
  from: string
}) {
  const state = useProgressState()
  const [note, setNote] = useState<string | null>(null)

  const recap = useMemo(() => buildRecap(state, from), [state, from])
  const words = recap.learnedIds.map(getWord).filter((w) => w !== undefined)
  const shaky = recap.shakyIds.map(getWord).filter((w) => w !== undefined)

  async function share() {
    const text = recapText(recap)
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> }
    if (nav.share) {
      try {
        await nav.share({ text })
        return
      } catch {
        /* cancelled or blocked — fall through to the clipboard */
      }
    }
    setNote((await copyText(text)) ? 'Riepilogo copiato' : 'Condivisione non riuscita')
  }

  return (
    <Sheet open={open} onClose={onClose} title="La tua settimana">
      <p className="-mt-2 mb-4 text-center text-sm text-ink-soft">
        {formatWeekRange(recap.from, recap.to)}
      </p>

      <div className="flex gap-2">
        <Figure value={recap.learnedIds.length} label={recap.learnedIds.length === 1 ? 'parola' : 'parole'} />
        <Figure value={recap.activeDays} label={recap.activeDays === 1 ? 'giorno' : 'giorni'} />
        <Figure value={recap.bestRun} label="di fila" />
      </div>

      <p className="mt-3 text-center text-sm font-semibold">{recapVerdict(recap)}</p>

      {words.length > 0 && (
        <section className="mt-5">
          <h3 className="mb-2 text-xs font-semibold text-ink-soft">Le parole della settimana</h3>
          <ul className="space-y-1.5">
            {words.map((w) => (
              <li key={w.id} className="flex gap-2 text-sm">
                <span className="font-reading font-semibold">{w.term}</span>
                <span className="truncate text-ink-soft">{w.meaning}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {shaky.length > 0 && (
        <section className="mt-5">
          <h3 className="mb-2 text-xs font-semibold text-ink-soft">Da riprendere</h3>
          <p className="text-sm text-ink-soft">
            {shaky.map((w) => w.term).join(', ')} — {shaky.length === 1 ? 'ti è' : 'ti sono'}{' '}
            {shaky.length === 1 ? 'sfuggita' : 'sfuggite'} più di una volta.
          </p>
        </section>
      )}

      <Button className="mt-5 w-full" onClick={share}>
        <Icon name="share" size={18} /> Condividi il riepilogo
      </Button>
      <Button variant="ghost" className="mt-1 w-full" onClick={onClose}>
        Chiudi
      </Button>
      {note && <p className="mt-2 text-center text-sm text-ink-soft">{note}</p>}
    </Sheet>
  )
}
