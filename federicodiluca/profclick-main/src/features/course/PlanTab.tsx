import { useMemo, useState } from 'react'
import { ActivityLine, Segmented } from '@/components/bits'
import { formatHours } from '@/lib/ui'
import { CancelledIcon, DoneIcon, SuggestIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { applyProposal } from '@/core/actions'
import { currentPeriod, isAvailable, periodSlots } from '@/core/calendar'
import { formatRange, formatShort, startOfWeek, today } from '@/core/dates'
import { periodGrades } from '@/core/grading'
import { type Course, GRADE_LABELS, isDone } from '@/core/model'
import { topicProgress } from '@/core/progress'
import { freeSlots, type Proposal } from '@/core/proposal'
import { LessonDialog } from '@/features/lesson/LessonDialog'
import { newId } from '@/lib/id'
import { cn } from '@/lib/utils'
import { useData } from '@/state/data'
import { ProposeDialog } from './ProposeDialog'

/**
 * Il piano di un periodo, lezione per lezione (ADR 0006). La proposta riempie le lezioni vuote
 * delle prossime settimane con gli argomenti scelti (ADR 0020): si vede tratteggiata, e
 * diventa piano solo con "Applica".
 */
export function PlanTab({ course, onShowGrades }: { course: Course; onShowGrades?: () => void }) {
  const { data, applyWithUndo } = useData()
  const year = data.year!
  const now = today()
  const [periodId, setPeriodId] = useState(() => currentPeriod(year, now)?.id ?? year.periods[0].id)
  const period = year.periods.find((p) => p.id === periodId) ?? year.periods[0]
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [showPast, setShowPast] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const [open, setOpen] = useState<string | null>(null)

  const slots = periodSlots(data, course, period)
  const available = slots.filter(isAvailable)
  const grades = periodGrades(data, course, period, now)
  const topics = topicProgress(data, course).filter((p) => p.topic.periodId === period.id || p.topic.periodId === null)
  const topicsLeft = topics.filter((p) => p.status !== 'fatto' && !p.topic.assessmentOnly).length
  const weeksToPlan = new Set(freeSlots(data, course, period, now).map((s) => startOfWeek(s.date))).size
  const proposed = useMemo(() => new Map(proposal?.lessons.map((l) => [l.date, l.activity])), [proposal])
  const past = slots.filter((s) => s.date < now)
  const visible = showPast ? slots : slots.filter((s) => s.date >= now)

  const propose = (p: Proposal) => {
    setProposal(p)
    setChoosing(false)
    setShowPast(false)
  }

  return (
    <div className="space-y-5">
      {year.periods.length > 1 && (
        <Segmented
          value={period.id}
          onChange={(id) => {
            setPeriodId(id)
            setProposal(null)
          }}
          options={year.periods.map((p) => ({ value: p.id, label: p.name }))}
        />
      )}

      <div className={cn('grid grid-cols-2 gap-3', grades.civics.target > 0 ? 'sm:grid-cols-5' : 'sm:grid-cols-4')}>
        <Stat label="Lezioni" value={String(available.length)} hint={formatHours(available.reduce((s, x) => s + x.hours, 0))} />
        <Stat label="Da oggi" value={String(grades.remainingLessons)} hint={`${grades.freeLessons} ancora libere`} />
        <Stat
          label="Da pianificare"
          value={weeksToPlan === 1 ? '1 settimana' : `${weeksToPlan} settimane`}
          hint={topicsLeft === 1 ? 'un argomento da fare' : `${topicsLeft} argomenti da fare`}
        />
        <Stat
          label="Voti"
          value={`${grades.full.length}/${grades.target}`}
          hint={grades.missingTypes.length ? `manca ${grades.missingTypes.map((t) => GRADE_LABELS[t].toLowerCase()).join(', ')}` : `${grades.done} ${grades.done === 1 ? "fatto" : "fatti"}`}
          tone={grades.status === 'a-rischio' ? 'red' : grades.status === 'da-pianificare' ? 'warn' : undefined}
          onClick={onShowGrades}
        />
        {grades.civics.target > 0 && (
          <Stat
            label="Ed. civica"
            value={`${Math.round(grades.civics.planned * 10) / 10}/${grades.civics.target} h`}
            hint={`${Math.round(grades.civics.done * 10) / 10} h fatte`}
            tone={grades.civics.planned < grades.civics.target - 0.01 ? 'warn' : undefined}
          />
        )}
      </div>

      {proposal ? (
        <div className="space-y-3 rounded-xl border border-dashed border-primary/50 bg-primary/5 p-4">
          <p className="text-sm">
            Proposta {formatRange(proposal.from, proposal.to)}: <strong>{proposal.lessons.length - proposal.assessments} lezioni</strong> di programma e{' '}
            <strong>{proposal.assessments} valutazioni</strong>, sulle lezioni ancora vuote.
            {proposal.overflowTopics.length > 0 && <span className="text-pencil-red"> Non ci stanno: {proposal.overflowTopics.map((t) => t.title).join(', ')}.</span>}
            {proposal.overflowAssessments > 0 && (
              <span className="text-pencil-red"> {proposal.overflowAssessments === 1 ? 'Una valutazione prevista non ci sta.' : `${proposal.overflowAssessments} valutazioni previste non ci stanno.`}</span>
            )}
            {proposal.spareLessons > 0 && ` Restano ${proposal.spareLessons === 1 ? 'una lezione libera' : `${proposal.spareLessons} lezioni libere`}.`}
          </p>
          <div className="flex gap-2">
            <Button
              disabled={proposal.lessons.length === 0}
              onClick={() => {
                applyWithUndo(applyProposal(course.id, proposal.lessons, newId), 'Piano applicato')
                setProposal(null)
              }}
            >
              Applica
            </Button>
            <Button variant="ghost" onClick={() => setProposal(null)}>
              Scarta
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setChoosing(true)} disabled={topics.length === 0 || grades.freeLessons === 0}>
            <SuggestIcon /> Proponi piano
          </Button>
          <p className="text-sm text-muted-foreground">
            {topics.length === 0
              ? 'Aggiungi gli argomenti nel Programma per avere una proposta.'
              : 'Scegli gli argomenti e su quante settimane: riempie le lezioni vuote, il piano già fatto non si tocca.'}
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        {past.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setShowPast(!showPast)}>
            {showPast ? 'Nascondi le lezioni passate' : `Mostra le ${past.length} lezioni passate`}
          </Button>
        )}
        {visible.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nessuna lezione in questo periodo.</p>}
        {visible.map((slot) => {
          const lesson = slot.lesson
          const suggestion = proposed.get(slot.date)
          return (
            <button
              key={slot.date}
              type="button"
              onClick={() => setOpen(slot.date)}
              className={cn(
                'flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted/40',
                slot.date === now && 'border-primary/50',
                suggestion && 'border-dashed border-primary/50 bg-primary/5',
                lesson?.cancelled && 'text-muted-foreground',
              )}
            >
              <span className={cn('w-24 shrink-0 text-sm tabular-nums', slot.date < now && 'text-muted-foreground')}>
                {slot.floating ? `${formatShort(startOfWeek(slot.date)).slice(4)} · L${slot.index}` : formatShort(slot.date)}
                <span className="block text-xs text-muted-foreground">
                  {formatHours(slot.hours)}
                  {slot.lab && ' · ITP'}
                </span>
              </span>
              <span className="min-w-0 flex-1 space-y-1">
                {lesson?.cancelled ? (
                  <span className="flex items-center gap-1.5 text-sm">
                    <CancelledIcon className="size-4" /> Saltata
                  </span>
                ) : lesson?.activities.length ? (
                  lesson.activities.map((a) => <ActivityLine key={a.id} activity={a} data={data} />)
                ) : suggestion ? (
                  <ActivityLine activity={suggestion} data={data} dashed />
                ) : (
                  <span className="text-sm text-muted-foreground">Da pianificare</span>
                )}
              </span>
              {isDone(lesson, now) && <DoneIcon className="size-5 shrink-0 text-done" aria-label="Fatta" />}
            </button>
          )
        })}
      </div>

      <LessonDialog courseId={course.id} date={open} onClose={() => setOpen(null)} />
      <ProposeDialog course={course} period={period} open={choosing} onClose={() => setChoosing(false)} onPropose={propose} />
    </div>
  )
}

function Stat({ label, value, hint, tone, onClick }: { label: string; value: string; hint: string; tone?: 'warn' | 'red'; onClick?: () => void }) {
  const content = (
    <>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn('font-heading text-xl font-bold', tone === 'warn' && 'text-warn', tone === 'red' && 'text-pencil-red')}>{value}</div>
      <div className="truncate text-xs text-muted-foreground">{hint}</div>
    </>
  )
  if (!onClick) return <div className="rounded-xl border bg-card p-3">{content}</div>
  return (
    <button type="button" onClick={onClick} title="Apri i voti" className="rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted/40">
      {content}
    </button>
  )
}
