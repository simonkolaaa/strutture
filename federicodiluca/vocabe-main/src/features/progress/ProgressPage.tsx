import { useMemo, useState } from 'react'
import { getWord } from '@/core/content/words'
import { useProgressState } from '@/state/hooks'
import { displayStreak } from '@/core/streak/streak'
import { BADGES } from '@/core/badges/badges'
import { localDateKey } from '@/core/date'
import { buildRecap, weekStart } from '@/core/recap/recap'
import { Button } from '@/ui/Button'
import { Icon } from '@/ui/Icon'
import { cn } from '@/ui/cn'
import { WordDetails } from '@/features/daily/WordDetails'
import { ChallengeSheet } from '@/features/challenge/ChallengeSheet'
import { RecapSheet } from '@/features/recap/RecapSheet'
import { MilestoneSheet } from './MilestoneSheet'
import type { Badge } from '@/core/badges/badges'
import { Heatmap } from './Heatmap'

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex-1 rounded-2xl border border-line bg-paper-raised p-4 text-center">
      <div className="font-serif text-2xl font-semibold">{value}</div>
      <div className="text-xs text-ink-soft">{label}</div>
    </div>
  )
}

export function ProgressPage() {
  const state = useProgressState()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [challengeOpen, setChallengeOpen] = useState(false)
  const [recapOpen, setRecapOpen] = useState(false)
  const [milestone, setMilestone] = useState<Badge | null>(null)

  const thisWeek = useMemo(() => weekStart(localDateKey()), [])
  const week = useMemo(() => buildRecap(state, thisWeek), [state, thisWeek])

  const entries = useMemo(() => {
    return Object.entries(state.learned)
      .map(([id, e]) => ({ id, entry: e, word: getWord(id) }))
      .filter((x) => x.word)
      .sort((a, b) => b.entry.learnedOn.localeCompare(a.entry.learnedOn))
  }, [state.learned])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter(
      (x) => x.word!.term.toLowerCase().includes(q) || x.word!.meaning.toLowerCase().includes(q),
    )
  }, [entries, query])

  const earned = new Set(state.badges)

  return (
    <div className="space-y-6 pt-2">
      <div className="flex gap-3">
        <Stat value={entries.length} label="parole imparate" />
        <Stat value={displayStreak(state.streak)} label="streak" />
        <Stat value={state.streak.longest} label="record" />
      </div>

      <p className="flex items-center justify-center gap-1.5 text-xs text-ink-soft">
        <Icon name="shield" size={14} className="text-brand" />
        {state.streak.freezes} {state.streak.freezes === 1 ? 'salvagente' : 'salvagenti'} — un giorno
        saltato non azzera la serie
      </p>

      <button
        onClick={() => setRecapOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-line bg-paper-raised p-4 text-left transition hover:border-brand"
      >
        <Icon name="calendar" size={22} className="shrink-0 text-brand" />
        <span className="flex-1">
          <span className="block text-sm font-semibold">Questa settimana</span>
          <span className="block text-xs text-ink-soft">
            {week.learnedIds.length}{' '}
            {week.learnedIds.length === 1 ? 'parola imparata' : 'parole imparate'} in{' '}
            {week.activeDays} {week.activeDays === 1 ? 'giorno' : 'giorni'}
          </span>
        </span>
        <span className="text-sm font-semibold text-brand">Riepilogo</span>
      </button>

      <Button variant="outline" className="w-full" onClick={() => setChallengeOpen(true)}>
        <Icon name="share" size={18} /> Sfida un amico
      </Button>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-soft">Attività</h2>
        <Heatmap activeDays={state.activeDays} />
        <p className="mt-2 text-xs text-ink-soft">
          {state.activeDays.length} {state.activeDays.length === 1 ? 'giorno attivo' : 'giorni attivi'}
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-soft">Obiettivi</h2>
        <div className="grid grid-cols-2 gap-2">
          {BADGES.map((b) => {
            const has = earned.has(b.id)
            return (
              <button
                key={b.id}
                disabled={!has}
                onClick={() => setMilestone(b)}
                className={cn(
                  'rounded-2xl border p-3 text-left text-sm transition',
                  has ? 'border-brand bg-brand-soft hover:bg-brand-soft/70' : 'border-line opacity-60',
                )}
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  <Icon name={has ? 'medal' : 'lock'} size={16} />
                  {b.name}
                </div>
                <div className="text-xs text-ink-soft">{b.hint}</div>
                {has && (
                  <div className="mt-1.5 flex items-center gap-1 text-xs text-brand">
                    <Icon name="share" size={12} /> condividi
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-soft">Storico</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca una parola…"
          className="mb-3 w-full rounded-2xl border border-line bg-paper-raised px-4 py-2.5 text-sm outline-none focus:border-brand"
        />

        {filtered.length === 0 ? (
          <div className="animate-fade py-10 text-center">
            <Icon name="book" size={36} className="mx-auto text-ink-soft" strokeWidth={1.3} />
            <p className="mt-3 text-sm text-ink-soft">
              {entries.length === 0
                ? 'Ancora nessuna parola imparata. Inizia da “Oggi”.'
                : 'Nessun risultato per questa ricerca.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map(({ id, entry, word }) => (
              <li key={id} className="rounded-2xl border border-line bg-paper-raised">
                <button
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                  onClick={() => setOpen(open === id ? null : id)}
                >
                  <span>
                    <span className="font-reading text-lg font-semibold">{word!.term}</span>
                    <span className="ml-2 text-xs text-ink-soft">{entry.learnedOn}</span>
                  </span>
                  <span className="text-xs text-ink-soft">{'●'.repeat(entry.box)}</span>
                </button>
                {open === id && (
                  <div className="border-t border-line px-4 py-4">
                    <WordDetails word={word!} learnAction />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ChallengeSheet open={challengeOpen} onClose={() => setChallengeOpen(false)} />
      <RecapSheet open={recapOpen} from={thisWeek} onClose={() => setRecapOpen(false)} />
      <MilestoneSheet badge={milestone} open={milestone !== null} onClose={() => setMilestone(null)} />
    </div>
  )
}
