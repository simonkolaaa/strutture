import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { WORDS } from '@/core/content/words'
import { COLLECTIONS, collectionProgress, collectionWords } from '@/core/content/collections'
import { LEVELS } from '@/core/content/levels'
import { useProgressSlice } from '@/state/hooks'
import type { WordCategory } from '@/core/types'
import { Icon } from '@/ui/Icon'
import { cn } from '@/ui/cn'
import { WordRow } from './WordRow'

const CATEGORIES: { value: WordCategory | 'tutte'; label: string }[] = [
  { value: 'tutte', label: 'Tutte' },
  { value: 'comune', label: 'Comuni' },
  { value: 'letteraria', label: 'Letterarie' },
  { value: 'antica', label: 'Antiche' },
  { value: 'straniera', label: 'Straniere' },
  { value: 'regionale', label: 'Regionali' },
  { value: 'scientifica', label: 'Scientifiche' },
]

const DIFFICULTIES: { value: number; label: string }[] = [
  { value: 0, label: 'Ogni livello' },
  ...LEVELS.map((l) => ({ value: l.value, label: l.label })),
]

const SORTED = [...WORDS].sort((a, b) => a.term.localeCompare(b.term, 'it'))

/** Rendering all 386 rows at once is the slowest thing in the app on a phone. */
const PAGE = 40

export function ExplorePage() {
  const favorites = useProgressSlice((s) => s.favorites)
  const learned = useProgressSlice((s) => s.learned)
  const known = useProgressSlice((s) => s.known)
  const [category, setCategory] = useState<WordCategory | 'tutte'>('tutte')
  const [difficulty, setDifficulty] = useState(0)
  const [favOnly, setFavOnly] = useState(false)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const favs = useMemo(() => new Set(favorites), [favorites])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SORTED.filter((w) => {
      if (favOnly && !favs.has(w.id)) return false
      if (category !== 'tutte' && w.category !== category) return false
      if (difficulty && w.difficulty !== difficulty) return false
      if (q && !w.term.toLowerCase().includes(q) && !w.meaning.toLowerCase().includes(q)) return false
      return true
    })
  }, [category, difficulty, favOnly, query, favs])

  // Reveal the list a page at a time as the reader scrolls to the bottom.
  const [visible, setVisible] = useState(PAGE)
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => setVisible(PAGE), [category, difficulty, favOnly, query])

  useEffect(() => {
    const node = sentinel.current
    if (!node || visible >= results.length) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setVisible((v) => v + PAGE)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [visible, results.length])

  return (
    <div className="space-y-4 pt-2">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink-soft">Raccolte</h2>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {COLLECTIONS.map((c) => {
            const done = collectionProgress(c, { learned, known })
            const total = collectionWords(c).length
            return (
              <Link
                key={c.id}
                to={`/esplora/${c.id}`}
                className="flex w-40 shrink-0 flex-col justify-between rounded-2xl border border-line bg-paper-raised p-3 text-left transition hover:border-brand"
              >
                <span className="font-reading text-sm font-semibold leading-snug">{c.name}</span>
                <span className="mt-3 text-xs text-ink-soft">
                  {done === total ?
                    <span className="flex items-center gap-1 text-brand">
                      <Icon name="medal" size={13} /> completata
                    </span>
                  : `${done}/${total}`}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      <p className="text-sm text-ink-soft">
        Oppure sfoglia tutte le {WORDS.length} parole di Vocabe.
      </p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cerca per parola o significato…"
        className="w-full rounded-2xl border border-line bg-paper-raised px-4 py-2.5 text-sm outline-none focus:border-brand"
      />

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        <button
          onClick={() => setFavOnly((v) => !v)}
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition',
            favOnly ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink-soft',
          )}
        >
          <Icon name={favOnly ? 'star-filled' : 'star'} size={14} /> Preferiti
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition',
              category === c.value
                ? 'border-brand bg-brand-soft text-brand'
                : 'border-line text-ink-soft',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.value}
            onClick={() => setDifficulty(d.value)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition',
              difficulty === d.value
                ? 'border-brand bg-brand-soft text-brand'
                : 'border-line text-ink-soft',
            )}
          >
            {d.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-ink-soft">
        {results.length} {results.length === 1 ? 'parola' : 'parole'}
      </p>

      {results.length === 0 ? (
        <div className="animate-fade py-10 text-center">
          <Icon
            name={favOnly ? 'star' : 'compass'}
            size={36}
            className="mx-auto text-ink-soft"
            strokeWidth={1.3}
          />
          <p className="mt-3 text-sm text-ink-soft">
            {favOnly && favorites.length === 0
              ? 'Nessun preferito. Tocca la stella su una parola per aggiungerla.'
              : 'Nessuna parola con questi filtri.'}
          </p>
          <button
            className="mt-2 text-sm text-brand underline"
            onClick={() => {
              setCategory('tutte')
              setDifficulty(0)
              setFavOnly(false)
              setQuery('')
            }}
          >
            Azzera i filtri
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {results.slice(0, visible).map((word) => (
            <WordRow
              key={word.id}
              word={word}
              open={open === word.id}
              onToggle={() => setOpen(open === word.id ? null : word.id)}
            />
          ))}
          {visible < results.length && <div ref={sentinel} className="h-8" aria-hidden />}
        </ul>
      )}
    </div>
  )
}
