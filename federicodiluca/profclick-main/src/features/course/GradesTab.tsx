import { createElement, useState } from 'react'
import { Section } from '@/components/bits'
import { CivicsIcon, DoneIcon, MergeIcon, MinorGradeIcon, SplitIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { mergeAssessment, saveCourse, separateAssessment } from '@/core/actions'
import { formatShort, type ISODate, today } from '@/core/dates'
import { type GradeEvent, periodGrades } from '@/core/grading'
import { assessmentLabel, type Course, GRADE_LABELS, isMinor, type Period, weeklyHours } from '@/core/model'
import { GRADE_ICONS } from '@/lib/activityIcons'
import { formatHours, gradesLine } from '@/lib/ui'
import { cn } from '@/lib/utils'
import { useAutosave } from '@/lib/useAutosave'
import { LessonDialog } from '@/features/lesson/LessonDialog'
import { useData } from '@/state/data'

/**
 * Per ogni periodo: quanti voti servono, quali tipi ci sono, quando cadono. Ogni voto si apre
 * e si cambia; due valutazioni si uniscono in un voto solo anche dopo (il giro di
 * interrogazioni, il recupero degli assenti), e si separano di nuovo.
 */
export function GradesTab({ course }: { course: Course }) {
  const { data } = useData()
  const [open, setOpen] = useState<ISODate | null>(null)
  const now = today()
  const rule = course.rules.perPeriod === null ? `un voto per ogni ora settimanale (${weeklyHours(course)})` : `${course.rules.perPeriod} voti`

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Regola: {rule}
        {course.rules.required.length > 0 && `, con almeno uno ${course.rules.required.map((t) => GRADE_LABELS[t].toLowerCase()).join(', ')}`}. I voti minori
        si aggiungono a questi.
      </p>
      {data.year!.periods.map((period) => {
        const g = periodGrades(data, course, period, now)
        const unplacedFull = g.unplaced.filter((u) => !isMinor(u.planned)).length
        const toPlan = Math.max(0, g.missing - unplacedFull)
        return (
          <Section
            key={period.id}
            title={period.name}
            action={
              <span className="text-sm text-muted-foreground">
                {gradesLine(g)}
              </span>
            }
          >
            <div className="flex flex-wrap gap-2">
              {course.rules.required.map((t) => {
                const ok = !g.missingTypes.includes(t)
                return (
                  <span
                    key={t}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                      ok ? 'border-done/40 text-done' : 'border-pencil-red/40 text-pencil-red',
                    )}
                  >
                    {createElement(GRADE_ICONS[t], { className: 'size-3.5' })}
                    {GRADE_LABELS[t]} {ok ? 'in calendario' : 'mancante'}
                  </span>
                )
              })}
              {g.civics.target > 0 && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                    g.civics.planned >= g.civics.target - 0.01 ? 'border-done/40 text-done' : 'border-warn/50 text-warn',
                  )}
                >
                  <CivicsIcon className="size-3.5" />
                  Ed. civica: {formatHours(g.civics.planned)} su {g.civics.target}
                </span>
              )}
            </div>
            <ul className="divide-y rounded-xl border">
              {[...g.full, ...g.minor]
                .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
                .map((e, i, list) => (
                  <GradeRow key={e.activity.id} course={course} event={e} previous={list[i - 1]} onOpen={setOpen} />
                ))}
              {g.unplaced.map(({ topic, planned }) => (
                <li key={planned.id} className="flex items-start gap-3 px-3 py-2 text-sm text-muted-foreground">
                  <span className="w-24 shrink-0 italic">da collocare</span>
                  {createElement(isMinor(planned) ? MinorGradeIcon : GRADE_ICONS[planned.type], { className: 'mt-0.5 size-4 shrink-0' })}
                  <span className="min-w-0 flex-1">
                    {assessmentLabel(planned)} · {topic.title}
                    {planned.text && ` · ${planned.text}`}
                  </span>
                </li>
              ))}
              {Array.from({ length: toPlan }, (_, i) => (
                <li key={`m${i}`} className="px-3 py-2 text-sm text-muted-foreground italic">
                  Voto ancora da pianificare
                </li>
              ))}
              {g.full.length + g.minor.length + g.unplaced.length + toPlan === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">Niente in programma.</li>
              )}
            </ul>
            {(g.unplaced.length > 0 || toPlan > 0) && (
              <p className="text-xs text-muted-foreground">Nel Piano, <em>Proponi piano</em> mette in calendario quello che manca.</p>
            )}
            <PeriodNotes course={course} period={period} />
          </Section>
        )
      })}
      <LessonDialog courseId={course.id} date={open} onClose={() => setOpen(null)} />
    </div>
  )
}

/** Le note per lo scrutinio del periodo: si salvano da sole. */
function PeriodNotes({ course, period }: { course: Course; period: Period }) {
  const { apply } = useData()
  const note = course.periodNotes[period.id] ?? ''
  const field = useAutosave((value) => value !== note && apply(saveCourse({ ...course, periodNotes: { ...course.periodNotes, [period.id]: value } })))
  return (
    <div className="space-y-1.5">
      <label htmlFor={`note-${period.id}`} className="text-sm font-medium">
        Note per lo scrutinio
      </label>
      <Textarea
        id={`note-${period.id}`}
        key={`${course.id}${period.id}`}
        defaultValue={note}
        rows={note ? 4 : 2}
        placeholder="Recuperi, accordi, chi tenere d'occhio…"
        {...field}
      />
    </div>
  )
}

function GradeRow({ course, event, previous, onOpen }: { course: Course; event: GradeEvent; previous?: GradeEvent; onOpen: (date: ISODate) => void }) {
  const { data, applyWithUndo } = useData()
  const topics = event.activity.topicIds.map((id) => data.topics[id]?.title).filter(Boolean)
  const detail = [topics.join(', '), event.activity.text].filter(Boolean).join(' · ')
  const date = event.date
  // Si unisce solo a una valutazione con una lezione: quelle spuntate nel programma non ne hanno.
  const canMerge = date && previous?.date
  return (
    <li className="space-y-1.5 px-3 py-2 text-sm">
      <div className="flex items-start gap-3">
        {date ? (
          <button type="button" onClick={() => onOpen(date)} className="w-24 shrink-0 text-left text-primary tabular-nums hover:underline">
            {formatShort(date)}
          </button>
        ) : (
          <span className="w-24 shrink-0 text-muted-foreground">già fatto</span>
        )}
        {createElement(isMinor(event) ? MinorGradeIcon : GRADE_ICONS[event.type], { className: 'mt-0.5 size-4 shrink-0 text-pencil-red' })}
        <span className="min-w-0 flex-1">
          <span className="font-medium">{assessmentLabel(event)}</span>
          {detail && <span className="text-muted-foreground"> · {detail}</span>}
          {/* Sotto il testo, non accanto: da telefono il pulsante schiacciava la riga. */}
          {canMerge && (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-1.5 flex h-6 px-1.5 text-xs text-muted-foreground"
              title="Questa valutazione prosegue quella prima: un voto solo"
              onClick={() =>
                applyWithUndo(mergeAssessment(course.id, date, event.activity.id, previous.activity), `Unita a quella del ${formatShort(previous.date!)}: un voto solo`)
              }
            >
              <MergeIcon /> Unisci alla precedente
            </Button>
          )}
        </span>
        {event.done && <DoneIcon className="size-4 shrink-0 text-done" aria-label="Fatto" />}
      </div>
      {event.parts.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pl-[6.75rem] text-xs text-muted-foreground">
          anche
          {event.parts.map((p) => (
            <span key={p.activity.id} className="inline-flex items-center gap-0.5 rounded-full border pl-2">
              <button type="button" onClick={() => onOpen(p.date)} className="tabular-nums hover:text-foreground hover:underline">
                {formatShort(p.date)}
                {p.activity.assessment?.makeup && ' · recupero'}
              </button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-6 rounded-full"
                aria-label={`Separa il ${formatShort(p.date)}: diventa un voto a sé`}
                title="Separa: diventa un voto a sé"
                onClick={() => applyWithUndo(separateAssessment(course.id, p.date, p.activity.id), `Il ${formatShort(p.date)} ora è un voto a sé`)}
              >
                <SplitIcon className="size-3.5" />
              </Button>
            </span>
          ))}
        </div>
      )}
    </li>
  )
}
