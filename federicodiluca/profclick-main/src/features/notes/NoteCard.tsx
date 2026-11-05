import type { CSSProperties } from 'react'
import { PinIcon } from '@/components/icons'
import { saveNote } from '@/core/actions'
import type { Note } from '@/core/model'
import { inlineParts, noteCourses, noteLines, toggleNoteLine } from '@/core/notes'
import { courseColor, courseSurface } from '@/lib/ui'
import { cn } from '@/lib/utils'
import { useData } from '@/state/data'

/** Una riga con il suo grassetto e i suoi link. */
export function NoteText({ text }: { text: string }) {
  return (
    <>
      {inlineParts(text).map((part, i) =>
        part.kind === 'bold' ? (
          <strong key={i}>{part.text}</strong>
        ) : part.kind === 'link' ? (
          <a
            key={i}
            href={part.text}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="break-all text-primary underline underline-offset-2"
          >
            {part.text.replace(/^https?:\/\/(www\.)?/, '')}
          </a>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  )
}

/**
 * Una nota nella bacheca: si legge com'è scritta, le caselle si spuntano direttamente e un tocco
 * altrove la apre. Una nota di una sola classe ne prende il colore.
 */
export function NoteCard({ note, onOpen, className }: { note: Note; onOpen: () => void; className?: string }) {
  const { data, apply } = useData()
  const courses = noteCourses(data, note)
  const lines = noteLines(note.text)
  // Le righe vuote in fondo non servono nella scheda.
  while (lines.at(-1)?.kind === 'blank') lines.pop()
  const surface: CSSProperties | undefined = courses.length === 1 ? courseSurface(courses[0]) : undefined

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onOpen()
        }
      }}
      style={surface}
      className={cn('block w-full cursor-pointer space-y-2 rounded-xl border bg-card p-4 text-left shadow-xs transition-colors hover:border-foreground/25', surface && 'pl-5', className)}
    >
      <div className="flex items-start gap-2">
        <h3 className={cn('min-w-0 flex-1 font-heading text-base font-semibold break-words', !note.title.trim() && 'text-muted-foreground italic')}>
          {note.title.trim() || 'Senza titolo'}
        </h3>
        {note.pinned && <PinIcon className="mt-0.5 size-4 shrink-0 text-pencil-blue" aria-label="Fissata" />}
      </div>

      {lines.length > 0 && (
        <div className="space-y-0.5 text-sm">
          {lines.map((line, i) => {
            if (line.kind === 'blank') return <div key={i} className="h-2" />
            if (line.kind === 'check')
              return (
                <label key={i} className="flex items-start gap-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={line.done}
                    onChange={() => apply(saveNote({ ...note, text: toggleNoteLine(note.text, i) }))}
                    className="mt-0.5 size-4 shrink-0 accent-[var(--done)]"
                  />
                  <span className={cn('min-w-0 break-words', line.done && 'text-muted-foreground line-through')}>
                    <NoteText text={line.text} />
                  </span>
                </label>
              )
            if (line.kind === 'bullet')
              return (
                <p key={i} className="flex gap-2">
                  <span className="mt-[0.55rem] size-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                  <span className="min-w-0 break-words">
                    <NoteText text={line.text} />
                  </span>
                </p>
              )
            return (
              <p key={i} className="break-words whitespace-pre-wrap">
                <NoteText text={line.text} />
              </p>
            )
          })}
        </div>
      )}

      {courses.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {courses.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-2 py-0.5 text-xs font-medium">
              <span className="size-2 rounded-full" style={{ background: courseColor(c) }} />
              {c.className}
              {c.subject && <span className="text-muted-foreground">{c.subject}</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Le schede in colonne, come una bacheca: ognuna alta quanto il suo testo. */
export function NoteBoard({ notes, onOpen }: { notes: Note[]; onOpen: (id: string) => void }) {
  return (
    <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} onOpen={() => onOpen(note.id)} className="mb-3 break-inside-avoid" />
      ))}
    </div>
  )
}
