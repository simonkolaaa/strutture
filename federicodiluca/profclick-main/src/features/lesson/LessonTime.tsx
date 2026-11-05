import { useState } from 'react'
import { CourseName, Toggle } from '@/components/bits'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { addExtraLesson, type LessonTime, lessonTimeProblem } from '@/core/actions'
import { sortedCourses } from '@/core/calendar'
import type { ISODate } from '@/core/dates'
import { cn } from '@/lib/utils'
import { useData } from '@/state/data'

const START_HOURS = [1, 2, 3, 4, 5, 6, 7, 8]

/** Giorno, ora d'inizio, durata e ITP di una lezione: per aggiungerla o spostarla. */
export function LessonTimeFields({ value, onChange }: { value: LessonTime; onChange: (value: LessonTime) => void }) {
  const set = (patch: Partial<LessonTime>) => onChange({ ...value, ...patch })
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input type="date" value={value.date} onChange={(e) => e.target.value && set({ date: e.target.value })} className="w-[9.5rem]" aria-label="Giorno" />
      <select
        value={value.start ?? ''}
        onChange={(e) => set({ start: Number(e.target.value) || undefined })}
        className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
        aria-label="Ora d'inizio"
      >
        <option value="">ora non indicata</option>
        {START_HOURS.map((h) => (
          <option key={h} value={h}>
            dalla {h}ª ora
          </option>
        ))}
      </select>
      <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          max={8}
          value={value.hours}
          onChange={(e) => set({ hours: Math.min(8, Math.max(1, Number(e.target.value) || 1)) })}
          className="w-16 text-center"
          aria-label="Durata in ore"
        />
        {value.hours === 1 ? 'ora' : 'ore'}
      </label>
      <Toggle on={value.lab} onClick={() => set({ lab: !value.lab })}>
        con ITP
      </Toggle>
    </div>
  )
}

/**
 * Una lezione fuori dall'orario: supplenza, recupero, ora scambiata. Si sceglie la classe,
 * e la lezione si apre subito, pronta da riempire (o da lasciare vuota).
 */
export function AddLessonDialog({ date, onClose, onAdded }: { date: ISODate | null; onClose: () => void; onAdded: (courseId: string, date: ISODate) => void }) {
  return (
    <Dialog open={date !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">{date && <AddLesson date={date} onAdded={onAdded} />}</DialogContent>
    </Dialog>
  )
}

function AddLesson({ date, onAdded }: { date: ISODate; onAdded: (courseId: string, date: ISODate) => void }) {
  const { data, applyWithUndo } = useData()
  const courses = sortedCourses(data)
  const [courseId, setCourseId] = useState(courses.length === 1 ? courses[0].id : '')
  const [time, setTime] = useState<LessonTime>({ date, hours: 1, lab: false })
  const problem = courseId ? lessonTimeProblem(data, courseId, time) : null

  return (
    <>
      <DialogHeader>
        <DialogTitle>Lezione in più</DialogTitle>
        <DialogDescription>Fuori dall'orario: una supplenza, un recupero, un'ora scambiata con un collega.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Classe">
        {courses.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={courseId === c.id}
            onClick={() => setCourseId(c.id)}
            className={cn(
              'rounded-lg border px-2.5 py-1.5 text-sm transition-colors',
              courseId === c.id ? 'border-primary bg-primary/10 font-medium' : 'hover:bg-muted/60',
            )}
          >
            <CourseName course={c} />
          </button>
        ))}
      </div>
      <LessonTimeFields value={time} onChange={setTime} />
      {problem && <p className="text-sm text-warn">{problem}</p>}
      <div className="flex justify-end border-t pt-4">
        <Button
          disabled={!courseId || Boolean(problem)}
          onClick={() => {
            applyWithUndo(addExtraLesson(courseId, time), 'Lezione aggiunta')
            onAdded(courseId, time.date)
          }}
        >
          Aggiungi
        </Button>
      </div>
    </>
  )
}
