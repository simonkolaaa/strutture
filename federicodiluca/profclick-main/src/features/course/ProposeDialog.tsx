import { useMemo, useState } from 'react'
import { Segmented } from '@/components/bits'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { schoolWeeks } from '@/core/calendar'
import { formatRange, formatShort, startOfWeek, today } from '@/core/dates'
import type { Course, Period } from '@/core/model'
import { placedAssessments } from '@/core/grading'
import { type TopicProgress, topicProgress } from '@/core/progress'
import { freeSlots, type Proposal, proposeWeeks } from '@/core/proposal'
import { useData } from '@/state/data'

/**
 * Quali argomenti, su quante settimane (ADR 0020): la proposta riempie solo quelle, a partire
 * dalla prima con una lezione libera. Piccoli passi invece di tutto il periodo in una volta.
 */
export function ProposeDialog({ course, period, open, onClose, onPropose }: { course: Course; period: Period; open: boolean; onClose: () => void; onPropose: (p: Proposal) => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">{open && <ProposeForm course={course} period={period} onClose={onClose} onPropose={onPropose} />}</DialogContent>
    </Dialog>
  )
}

function ProposeForm({ course, period, onClose, onPropose }: { course: Course; period: Period; onClose: () => void; onPropose: (p: Proposal) => void }) {
  const { data } = useData()
  const now = today()
  const placed = placedAssessments(data, course.id)
  // Anche un argomento fatto, se ha ancora valutazioni da mettere in calendario.
  const pending = (p: TopicProgress) => p.topic.assessments.some((a) => !a.done && !placed.has(a.id))
  // Gli argomenti del periodo, senza periodo o dei periodi dopo: a volte si porta avanti il programma.
  const periods = data.year!.periods
  const later = new Set(periods.slice(periods.findIndex((p) => p.id === period.id)).map((p) => p.id))
  const topics = topicProgress(data, course).filter((p) => (p.topic.periodId === null || later.has(p.topic.periodId)) && (p.status !== 'fatto' || pending(p)))
  // Di base il primo argomento del periodo che non è ancora in calendario.
  const [selected, setSelected] = useState<string[]>(() => {
    const next = topics.find((p) => p.status === 'da-pianificare' && p.topic.periodId === period.id) ?? topics.find((p) => p.status === 'da-pianificare') ?? topics[0]
    return next ? [next.topic.id] : []
  })
  const free = freeSlots(data, course, period, now)
  const first = free[0] ? startOfWeek(free[0].date) : null
  const left = first ? schoolWeeks(data.year!, period).filter((w) => w >= first).length : 0
  const options = [1, 2, 3, 4, 6].filter((n) => n < left)
  const [weeks, setWeeks] = useState(() => Math.min(2, Math.max(left, 1)))
  const proposal = useMemo(() => proposeWeeks(data, course, period, selected, weeks, now), [data, course, period, selected, weeks, now])

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : topics.map((p) => p.topic.id).filter((x) => x === id || s.includes(x))))
  const perTopic = (id: string) => proposal.lessons.filter((l) => l.activity.kind !== 'verifica' && l.activity.topicIds.includes(id)).length
  const lessons = proposal.lessons.length + proposal.spareLessons

  return (
    <>
      <DialogHeader>
        <DialogTitle>Proponi piano</DialogTitle>
        <DialogDescription>Scegli gli argomenti e su quante settimane distribuirli. Le lezioni si dividono secondo i sotto-punti, poi vengono le valutazioni previste.</DialogDescription>
      </DialogHeader>

      {!first ? (
        <p className="text-sm text-muted-foreground">Non ci sono lezioni libere da qui alla fine di {period.name}.</p>
      ) : (
        <>
          <div className="grid gap-2">
            <span className="text-sm font-medium">Argomenti</span>
            {topics.length === 0 && <p className="text-sm text-muted-foreground">Tutti gli argomenti del periodo sono fatti.</p>}
            <ul className="divide-y rounded-xl border">
              {topics.map(({ topic, lastDate, plannedLessons }) => {
                const on = selected.includes(topic.id)
                const n = on ? perTopic(topic.id) : 0
                const other = topic.periodId !== period.id && periods.find((p) => p.id === topic.periodId)
                return (
                  <li key={topic.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/40">
                      <Checkbox checked={on} onCheckedChange={() => toggle(topic.id)} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{topic.title}</span>
                        {(plannedLessons > 0 || other) && (
                          <span className="block text-xs text-muted-foreground">
                            {[other && other.name, plannedLessons > 0 && lastDate && `in calendario fino a ${formatShort(lastDate)}`].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </span>
                      {on && !topic.assessmentOnly && (
                        <span className="shrink-0 text-xs text-muted-foreground">{n === 1 ? '+ una lezione' : `+ ${n} lezioni`}</span>
                      )}
                      {topic.assessmentOnly && <span className="shrink-0 text-xs text-muted-foreground">solo valutazione</span>}
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-medium">Settimane</span>
            <Segmented
              value={String(weeks)}
              onChange={(v) => setWeeks(Number(v))}
              options={[...options.map((n) => ({ value: String(n), label: String(n) })), { value: String(left), label: `Fino alla fine (${left})` }]}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            {formatRange(proposal.from, proposal.to)}: {lessons === 1 ? 'una lezione libera' : `${lessons} lezioni libere`}
            {proposal.assessments > 0 && `, di cui ${proposal.assessments === 1 ? 'una' : proposal.assessments} per le valutazioni`}.
            {proposal.overflowTopics.length > 0 && (
              <span className="text-pencil-red"> Non ci stanno: {proposal.overflowTopics.map((t) => t.title).join(', ')}. Aggiungi una settimana o toglili.</span>
            )}
            {proposal.overflowAssessments > 0 && (
              <span className="text-pencil-red">
                {' '}
                {proposal.overflowAssessments === 1 ? 'Una valutazione prevista non ci sta' : `${proposal.overflowAssessments} valutazioni previste non ci stanno`}.
              </span>
            )}
          </p>
        </>
      )}

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Annulla
        </Button>
        <Button disabled={proposal.lessons.length === 0} onClick={() => onPropose(proposal)}>
          Proponi
        </Button>
      </DialogFooter>
    </>
  )
}
