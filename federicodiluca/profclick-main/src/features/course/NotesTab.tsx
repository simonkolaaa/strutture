import { useState } from 'react'
import { NotesIcon, PlusIcon, PrepIcon, TrashIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveCourse, saveNote, togglePrep } from '@/core/actions'
import { formatShort, today } from '@/core/dates'
import type { Course } from '@/core/model'
import { sortedNotes, topOrder } from '@/core/notes'
import { openPrep } from '@/core/prep'
import { courseTopics } from '@/core/progress'
import { newId } from '@/lib/id'
import { NoteBoard } from '@/features/notes/NoteCard'
import { NoteDialog } from '@/features/notes/NoteDialog'
import { cn } from '@/lib/utils'
import { useData } from '@/state/data'

/** Tutto quello che c'è da preparare, con quando serve, e le note della bacheca che riguardano la classe. */
export function NotesTab({ course }: { course: Course }) {
  const { data, apply } = useData()
  const [openNote, setOpenNote] = useState<string | null>(null)
  const linkedNotes = sortedNotes(data).filter((n) => n.courseIds.includes(course.id))
  const [draft, setDraft] = useState('')
  const [topicId, setTopicId] = useState('')
  const due = new Map(openPrep(data, today()).map((p) => [p.item.id, p.due]))
  const topics = courseTopics(data, course.id).filter((t) => !t.completed)
  const items = [...course.prep].sort((a, b) => Number(a.done) - Number(b.done) || (due.get(a.id) ?? '9999').localeCompare(due.get(b.id) ?? '9999'))

  const add = () => {
    if (!draft.trim()) return
    apply(saveCourse({ ...course, prep: [...course.prep, { id: newId(), text: draft.trim(), topicId: topicId || null, done: false }] }))
    setDraft('')
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
          <PrepIcon className="size-4 text-warn" /> Da preparare
        </h2>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
        >
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Slide, esercizi dal libro, laboratorio…" className="min-w-48 flex-1" />
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="h-8 max-w-56 rounded-lg border border-input bg-transparent px-2 text-sm"
            aria-label="Per quale argomento"
          >
            <option value="">Nessun argomento</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={!draft.trim()}>
            <PlusIcon /> Aggiungi
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">Legato a un argomento, prende la data della prima lezione in cui serve e compare in Da fare. Spiegazioni, esercitazioni e verifiche in programma ci sono già da sole: qui va il resto.</p>
        {items.length > 0 && (
          <ul className="divide-y rounded-xl border bg-card">
            {items.map((item) => {
              const when = due.get(item.id)
              return (
                <li key={item.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => apply(togglePrep(course.id, item.id))}
                    className="size-4 shrink-0 accent-[var(--done)]"
                    aria-label={`Pronto: ${item.text}`}
                  />
                  <span className={cn('min-w-0 flex-1', item.done && 'text-muted-foreground line-through')}>
                    {item.text}
                    {!item.done && (
                      <span className="block text-xs text-muted-foreground">
                        {item.topicId && data.topics[item.topicId] ? data.topics[item.topicId].title : 'Senza argomento'}
                        {when ? ` · serve ${formatShort(when)}` : item.topicId ? ' · argomento non ancora in calendario' : ''}
                      </span>
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Togli ${item.text}`}
                    onClick={() => apply(saveCourse({ ...course, prep: course.prep.filter((p) => p.id !== item.id) }))}
                  >
                    <TrashIcon />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
            <NotesIcon className="size-4 text-pencil-blue" /> Note
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const id = newId()
              apply(saveNote({ id, title: '', text: '', courseIds: [course.id], pinned: false, order: topOrder(data) }))
              setOpenNote(id)
            }}
          >
            <PlusIcon /> Nuova nota
          </Button>
        </div>
        {linkedNotes.length > 0 ? (
          <NoteBoard notes={linkedNotes} onOpen={setOpenNote} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Accordi con i colleghi, studenti con PDP, materiale da portare: le note collegate a {course.className} stanno qui e nella bacheca.
          </p>
        )}
        <NoteDialog id={openNote} onClose={() => setOpenNote(null)} />
      </section>
    </div>
  )
}
