import { useState } from 'react'
import { PlusIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { saveNote } from '@/core/actions'
import { sortedCourses } from '@/core/calendar'
import { noteCourses, sortedNotes, topOrder } from '@/core/notes'
import { newId } from '@/lib/id'
import { courseColor } from '@/lib/ui'
import { cn } from '@/lib/utils'
import { useData } from '@/state/data'
import { NoteBoard } from './NoteCard'
import { NoteDialog } from './NoteDialog'

/** Tutte le note, quelle generali o quelle di una classe. */
type Filter = 'tutte' | 'generali' | string

/**
 * La bacheca delle note (ADR 0023): quello che prima stava su Keep. Le note fissate in cima, poi
 * le altre dalla più nuova. Se qualche nota è di una classe, si possono vedere solo quelle.
 */
export default function NotesPage() {
  const { data, apply } = useData()
  const [open, setOpen] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('tutte')
  const notes = sortedNotes(data)
  const linked = new Set(notes.flatMap((n) => noteCourses(data, n).map((c) => c.id)))
  const courses = sortedCourses(data).filter((c) => linked.has(c.id))
  const active = filter === 'tutte' || filter === 'generali' || linked.has(filter) ? filter : 'tutte'
  const shown = notes.filter((n) => {
    if (active === 'tutte') return true
    const ids = noteCourses(data, n).map((c) => c.id)
    return active === 'generali' ? ids.length === 0 : ids.includes(active)
  })

  const create = () => {
    const id = newId()
    apply(saveNote({ id, title: '', text: '', courseIds: active !== 'tutte' && active !== 'generali' ? [active] : [], pinned: false, order: topOrder(data) }))
    setOpen(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Note</h1>
        <Button onClick={create}>
          <PlusIcon /> Nuova nota
        </Button>
      </div>

      {courses.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Quali note vedere">
          <FilterChip on={active === 'tutte'} onClick={() => setFilter('tutte')}>
            Tutte
          </FilterChip>
          <FilterChip on={active === 'generali'} onClick={() => setFilter('generali')}>
            Generali
          </FilterChip>
          {courses.map((c) => (
            <FilterChip key={c.id} on={active === c.id} onClick={() => setFilter(c.id)}>
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: courseColor(c) }} />
              {c.className}
              {c.subject && <span className="text-muted-foreground">{c.subject}</span>}
            </FilterChip>
          ))}
        </div>
      )}

      {notes.length === 0 ? (
        <p className="max-w-prose text-muted-foreground">
          Le note che tenevi altrove: idee per le slide, cose da rivedere, numeri e scadenze della scuola. Scrivi come su un foglio; una riga che inizia con{' '}
          <code>[ ]</code> si spunta. Collegata a una classe, una nota compare anche nei suoi Appunti.
        </p>
      ) : shown.length === 0 ? (
        <p className="text-muted-foreground">Nessuna nota qui.</p>
      ) : (
        <NoteBoard notes={shown} onOpen={setOpen} />
      )}

      <NoteDialog id={open} onClose={() => setOpen(null)} />
    </div>
  )
}

function FilterChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
        on ? 'border-primary bg-primary text-primary-foreground [&_span]:text-primary-foreground/80' : 'text-muted-foreground hover:border-foreground/30 hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
