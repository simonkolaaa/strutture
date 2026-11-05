import { createElement, useState } from 'react'
import { Segmented, Toggle } from '@/components/bits'
import { ProgramBar } from '@/components/ProgramBar'
import { ArrowDownIcon, ArrowUpIcon, CopyIcon, DoneIcon, MinorGradeIcon, PasteIcon, PlusIcon, PrepIcon, TrashIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { deleteTopic, moveTopic, saveCourse, saveTopic, saveTopics, setAssessmentDone, setTopicCompleted } from '@/core/actions'
import { currentProgram, programSources } from '@/core/archive'
import { formatShort, type ISODate } from '@/core/dates'
import { placedAssessments } from '@/core/grading'
import { type ParsedTopic, parseProgram } from '@/core/importText'
import { assessmentLabel, type Course, GRADE_LABELS, type GradeType, isMinor, type PlannedAssessment, type PrepItem, type Topic } from '@/core/model'
import { courseTopics, programLine, type TopicProgress, topicProgress } from '@/core/progress'
import { GRADE_ICONS } from '@/lib/activityIcons'
import { newId } from '@/lib/id'
import { cn } from '@/lib/utils'
import { useData } from '@/state/data'
import { CopyProgramDialog } from './CopyProgramDialog'
import { ProgramTextDialog } from './ProgramTextDialog'

const STATUS_LABELS: Record<TopicProgress['status'], string> = {
  'da-pianificare': 'Da pianificare',
  pianificato: 'Pianificato',
  'in-corso': 'In corso',
  fatto: 'Fatto',
}

export function ProgramTab({ course }: { course: Course }) {
  const { data, apply, applyWithUndo } = useData()
  const [editing, setEditing] = useState<Topic | 'new' | null>(null)
  const [importing, setImporting] = useState(false)
  const [copying, setCopying] = useState(false)
  const [asText, setAsText] = useState(false)
  const progress = topicProgress(data, course)
  const placed = placedAssessments(data, course.id)
  const periods = data.year!.periods
  const totals = periods.map((p) => ({ period: p, count: progress.filter((x) => x.topic.periodId === p.id && !x.topic.assessmentOnly).length }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{totals.map((t) => `${t.period.name}: ${t.count} ${t.count === 1 ? 'argomento' : 'argomenti'}`).join(' · ')}</p>
        <div className="flex flex-wrap gap-2">
          {progress.length > 0 && (
            <Button variant="outline" onClick={() => setAsText(true)} title="Programma svolto o piano di lavoro, da incollare nel modello della scuola">
              <CopyIcon /> Copia come testo
            </Button>
          )}
          <Button variant="outline" onClick={() => setImporting(true)}>
            <PasteIcon /> Incolla da una nota
          </Button>
          <Button onClick={() => setEditing('new')}>
            <PlusIcon /> Argomento
          </Button>
        </div>
      </div>

      <ProgramTextDialog
        input={asText ? currentProgram(data, course) : null}
        // A inizio anno serve il piano di lavoro; da quando c'è qualcosa di fatto, il programma svolto.
        kind={progress.some((p) => p.status === 'fatto' || p.status === 'in-corso') ? 'svolto' : 'piano'}
        onClose={() => setAsText(false)}
      />

      {progress.some((p) => !p.topic.assessmentOnly) && (
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">{programLine(progress)}</p>
          <ProgramBar progress={progress} />
          {/* Finché non se ne spunta uno, si dice che si può: la spunta automatica arriva solo quando si va avanti. */}
          {!progress.some((p) => p.topic.completed) && (
            <p className="text-xs text-muted-foreground">
              Un argomento si segna fatto da solo quando le sue lezioni sono svolte e sei passato al successivo, o l'hai verificato. Se l'hai finito prima,
              o l'hai fatto senza lezioni in calendario, spuntalo tu dal cerchio a sinistra del titolo.
            </p>
          )}
        </div>
      )}

      {progress.length === 0 && (
        <div className="space-y-3 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {programSources(data, course.id).length > 0 ? (
            <>
              <p>Il programma è vuoto. Se è lo stesso di un'altra classe, di quest'anno o degli anni passati, copialo e poi ritoccalo.</p>
              <Button onClick={() => setCopying(true)}>
                <CopyIcon /> Copia da un'altra classe
              </Button>
              <p>
                Oppure copia la nota con il programma o con l'elenco dei voti (da Keep, da un documento) e usa <strong>Incolla da una nota</strong>.
              </p>
            </>
          ) : (
            <p>
              Il programma è vuoto. Il modo più veloce: copia la nota con il programma o con l'elenco dei voti (da Keep, da un documento, dal piano di
              lavoro dell'anno scorso) e usa <strong>Incolla da una nota</strong>.
            </p>
          )}
          <CopyProgramDialog course={course} open={copying} onClose={() => setCopying(false)} />
        </div>
      )}

      <ol className="space-y-2">
        {progress.map((p, i) => {
          const prep = course.prep.filter((x) => x.topicId === p.topic.id && !x.done).length
          return (
            <li key={p.topic.id} className="rounded-xl border bg-card p-3">
              <div className="flex items-start gap-3">
                {/* Si spunta a mano un argomento svolto senza lezioni in calendario; se risulta fatto dal piano, resta fatto. */}
                <button
                  type="button"
                  aria-pressed={p.status === 'fatto'}
                  aria-label={p.topic.completed ? `Togli fatto da ${p.topic.title}` : `Segna fatto ${p.topic.title}`}
                  title={p.status === 'fatto' && !p.topic.completed ? 'Fatto: lezioni svolte e argomento superato' : p.topic.completed ? 'Togli fatto' : 'Segna come fatto'}
                  disabled={p.status === 'fatto' && !p.topic.completed}
                  onClick={() => apply(setTopicCompleted(p.topic.id, !p.topic.completed))}
                  className={cn(
                    'mt-0.5 grid size-6 shrink-0 place-items-center rounded-full transition-colors',
                    p.status === 'fatto' ? 'bg-done text-background' : 'border-2 border-muted-foreground/40 text-muted-foreground/50 hover:border-done hover:bg-done/15 hover:text-done',
                  )}
                >
                  {/* La spunta si vede sempre, anche vuota: si capisce che si tocca senza passarci sopra. */}
                  <DoneIcon className="size-4" />
                </button>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <button type="button" className="w-full space-y-1.5 text-left" onClick={() => setEditing(p.topic)}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="font-medium">
                        <span className="text-muted-foreground tabular-nums">{i + 1}. </span>
                        {p.topic.title}
                      </span>
                      <span className="text-xs text-muted-foreground">{periods.find((x) => x.id === p.topic.periodId)?.name ?? 'Periodo da decidere'}</span>
                    </div>
                    {p.topic.points.length > 0 && <p className="text-xs text-muted-foreground">{p.topic.points.join(' · ')}</p>}
                    {!p.topic.assessmentOnly && (
                      <p className="text-xs text-muted-foreground">
                        {STATUS_LABELS[p.status]}
                        {p.plannedLessons > 0 && ` · ${lessonsLine(p)}`}
                        {p.firstDate && ` · ${formatShort(p.firstDate)} → ${formatShort(p.lastDate!)}`}
                      </p>
                    )}
                  </button>
                  {(p.topic.assessments.length > 0 || prep > 0) && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.topic.assessments.map((a) => {
                        const at = placed.get(a.id)
                        return (
                          <AssessmentChip
                            key={a.id}
                            assessment={a}
                            at={at?.date}
                            done={at ? at.done : a.done}
                            onToggle={at ? undefined : () => apply(setAssessmentDone(p.topic.id, a.id, !a.done))}
                          />
                        )
                      })}
                      {prep > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warn/10 px-2 py-0.5 text-xs text-warn">
                          <PrepIcon className="size-3.5" /> {prep} da preparare
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-col">
                  <Button variant="ghost" size="icon-xs" aria-label="Sposta su" disabled={i === 0} onClick={() => applyWithUndo(moveTopic(p.topic.id, -1), 'Argomento spostato')}>
                    <ArrowUpIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Sposta giù"
                    disabled={i === progress.length - 1}
                    onClick={() => applyWithUndo(moveTopic(p.topic.id, 1), 'Argomento spostato')}
                  >
                    <ArrowDownIcon />
                  </Button>
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      <TopicDialog course={course} topic={editing} onClose={() => setEditing(null)} />
      <ImportDialog course={course} open={importing} onClose={() => setImporting(false)} />
    </div>
  )
}

/**
 * Una valutazione prevista. Se non è in calendario si spunta qui come fatta; se è in
 * calendario mostra la data, e si segna fatta dalla sua lezione.
 */
function AssessmentChip({
  assessment,
  at,
  done = false,
  onToggle,
}: {
  assessment: Pick<PlannedAssessment, 'type' | 'weight' | 'text'>
  at?: ISODate
  done?: boolean
  onToggle?: () => void
}) {
  const className = cn(
    // Da telefono un'etichetta lunga va a capo dentro il riquadro, a pezzi interi.
    'inline-flex max-w-full flex-wrap items-center gap-x-1 rounded-xl border px-2 py-0.5 text-left text-xs transition-colors',
    done ? 'border-done/40 bg-done/10 text-done' : 'border-pencil-red/30 text-pencil-red',
    onToggle && !done && 'hover:border-done/50 hover:text-done',
  )
  const content = (
    <>
      <span className="inline-flex items-center gap-1 whitespace-nowrap">
        {createElement(done ? DoneIcon : isMinor(assessment) ? MinorGradeIcon : GRADE_ICONS[assessment.type], { className: 'size-3.5' })}
        {assessmentLabel(assessment)}
      </span>
      {assessment.text && <span className="opacity-75">· {assessment.text}</span>}
      {at && <span className="whitespace-nowrap opacity-75">· {formatShort(at)}</span>}
    </>
  )
  if (!onToggle) return <span className={className}>{content}</span>
  return (
    <button type="button" aria-pressed={done} title={done ? 'Togli fatta' : 'Segna come fatta'} onClick={onToggle} className={className}>
      {content}
    </button>
  )
}

function TopicDialog({ course, topic, onClose }: { course: Course; topic: Topic | 'new' | null; onClose: () => void }) {
  return (
    <Dialog open={topic !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        {topic && <TopicForm course={course} topic={topic === 'new' ? undefined : topic} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function TopicForm({ course, topic, onClose }: { course: Course; topic?: Topic; onClose: () => void }) {
  const { data, apply, applyWithUndo } = useData()
  const periods = data.year!.periods
  const [id] = useState(() => topic?.id ?? newId())
  const [title, setTitle] = useState(topic?.title ?? '')
  const [assessmentOnly, setAssessmentOnly] = useState(Boolean(topic?.assessmentOnly))
  const [periodId, setPeriodId] = useState<string>(topic?.periodId ?? courseTopics(data, course.id).at(-1)?.periodId ?? periods[0].id)
  const [points, setPoints] = useState(topic?.points.join('\n') ?? '')
  const [assessments, setAssessments] = useState<PlannedAssessment[]>(topic?.assessments ?? [])
  const [prep, setPrep] = useState<PrepItem[]>(course.prep.filter((p) => p.topicId === id))
  const placed = placedAssessments(data, course.id)

  const setAssessment = (i: number, patch: Partial<PlannedAssessment>) => setAssessments(assessments.map((a, j) => (j === i ? { ...a, ...patch } : a)))

  const save = () => {
    apply((d) => {
      let next = saveTopic({
        id,
        courseId: course.id,
        title: title.trim(),
        ...(assessmentOnly && { assessmentOnly: true }),
        periodId: periodId === 'none' ? null : periodId,
        points: points
          .split('\n')
          .map((p) => p.trim())
          .filter(Boolean),
        assessments,
        // "Concluso" si segna dal cerchio nella lista: qui si tiene quello che c'è.
        completed: d.topics[id]?.completed ?? false,
        order: topic?.order ?? courseTopics(d, course.id).length,
      })(d)
      const others = course.prep.filter((p) => p.topicId !== id)
      const mine = prep.filter((p) => p.text.trim())
      if (JSON.stringify(mine) !== JSON.stringify(course.prep.filter((p) => p.topicId === id))) {
        next = saveCourse({ ...next.courses[course.id], prep: [...others, ...mine] })(next)
      }
      return next
    })
    onClose()
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (title.trim()) save()
      }}
    >
      <DialogHeader>
        <DialogTitle>{topic ? 'Argomento' : 'Nuovo argomento'}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-1.5">
        <Label htmlFor="topic-title">Titolo</Label>
        <Input id="topic-title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus={!topic} placeholder="Array e matrici" />
        <Toggle on={assessmentOnly} onClick={() => setAssessmentOnly(!assessmentOnly)} className="justify-self-start">
          Solo valutazione, niente da spiegare
        </Toggle>
      </div>
      <div className="grid gap-1.5">
        <Label>Periodo</Label>
        <Segmented value={periodId} onChange={setPeriodId} options={[...periods.map((p) => ({ value: p.id, label: p.name })), { value: 'none', label: 'Da decidere' }]} />
      </div>

      <div className="grid gap-2">
        <Label>Valutazioni previste alla fine</Label>
        {assessments.map((a, i) => (
          <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
            <Segmented<GradeType>
              value={a.type}
              onChange={(type) => setAssessment(i, { type })}
              options={(['scritto', 'teorico', 'pratico'] as const).map((t) => ({ value: t, label: GRADE_LABELS[t] }))}
            />
            <Toggle on={a.weight < 100} onClick={() => setAssessment(i, { weight: a.weight < 100 ? 100 : course.rules.minorWeight })}>
              {a.weight < 100 ? `Minore ${a.weight}%` : 'Voto pieno'}
            </Toggle>
            {a.weight < 100 && (
              <Input
                type="number"
                min={5}
                max={95}
                step={5}
                value={a.weight}
                onChange={(e) => setAssessment(i, { weight: Math.min(95, Math.max(5, Number(e.target.value) || 5)) })}
                className="h-7 w-16 text-center"
                aria-label="Peso in percentuale"
              />
            )}
            <Input value={a.text} onChange={(e) => setAssessment(i, { text: e.target.value })} placeholder="con orale, prova parallela…" className="h-7 min-w-32 flex-1" />
            {placed.has(a.id) ? (
              <span className="text-xs text-muted-foreground">in calendario {formatShort(placed.get(a.id)!.date)}</span>
            ) : (
              <Toggle on={a.done} onClick={() => setAssessment(i, { done: !a.done })}>
                Fatta
              </Toggle>
            )}
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Togli valutazione" onClick={() => setAssessments(assessments.filter((_, j) => j !== i))}>
              <TrashIcon />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-self-start"
          onClick={() => setAssessments([...assessments, { id: newId(), type: assessments.at(-1)?.type === 'scritto' ? 'pratico' : 'scritto', weight: 100, text: '', done: false }])}
        >
          <PlusIcon /> Valutazione
        </Button>
      </div>

      <div className="grid gap-2">
        <Label>Da preparare</Label>
        {prep.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={p.done}
              onChange={() => setPrep(prep.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}
              className="size-4 accent-[var(--done)]"
              aria-label="Pronto"
            />
            <Input value={p.text} onChange={(e) => setPrep(prep.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} className={cn('h-8', p.done && 'line-through opacity-60')} />
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Togli" onClick={() => setPrep(prep.filter((_, j) => j !== i))}>
              <TrashIcon />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="justify-self-start" onClick={() => setPrep([...prep, { id: newId(), text: '', topicId: id, done: false }])}>
          <PrepIcon /> Slide, esercizi, laboratorio…
        </Button>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="topic-points">Sotto-punti, uno per riga</Label>
        <Textarea id="topic-points" value={points} onChange={(e) => setPoints(e.target.value)} rows={3} />
      </div>
      <DialogFooter className="sm:justify-between">
        {topic ? (
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              applyWithUndo(deleteTopic(topic.id), 'Argomento eliminato')
              onClose()
            }}
          >
            <TrashIcon /> Elimina
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={!title.trim()}>
          Salva
        </Button>
      </DialogFooter>
    </form>
  )
}

/**
 * Il periodo di ogni argomento: quello scritto nella nota (1️⃣, 2️⃣), altrimenti quello della
 * riga prima; se la nota non ne indica nessuno, gli argomenti si dividono in parti uguali.
 */
function assignPeriods(parsed: ParsedTopic[], count: number): number[] {
  if (parsed.some((t) => t.period !== null)) return parsed.map((t) => Math.min(count, t.period ?? 1) - 1)
  return parsed.map((_, i) => Math.min(count - 1, Math.floor((i / Math.max(parsed.length, 1)) * count)))
}

function ImportDialog({ course, open, onClose }: { course: Course; open: boolean; onClose: () => void }) {
  const { data, applyWithUndo } = useData()
  const [text, setText] = useState('')
  const periods = data.year!.periods
  const parsed = parseProgram(text)
  const periodIndex = assignPeriods(parsed, periods.length)
  const existing = courseTopics(data, course.id)

  const toTopic = (t: ParsedTopic, i: number): Omit<Topic, 'updatedAt'> => ({
    id: newId(),
    courseId: course.id,
    title: t.title,
    ...(t.hours === 0 && { assessmentOnly: true }),
    points: t.points,
    periodId: periods[periodIndex[i]].id,
    assessments: t.assessments.map((a) => ({ id: newId(), type: a.type, weight: a.weight ?? (a.minor ? course.rules.minorWeight : 100), text: a.text, done: t.completed })),
    completed: t.completed,
    order: existing.length + i,
  })

  const importAll = () => {
    const topics = parsed.map(toTopic)
    applyWithUndo(saveTopics(topics), `${topics.length} argomenti importati`)
    setText('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Incolla il programma</DialogTitle>
          <DialogDescription>
            Va bene quasi tutto: un elenco di argomenti (le righe rientrate diventano sotto-punti), l'elenco dei
            voti come "Reti (orale, 30%)", con i numeri di Keep per il quadrimestre, o la lista dei prossimi passi con i simboli di Keep per le verifiche
            e la freccia dove sei arrivato.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          autoFocus
          placeholder={'Architettura dei calcolatori\n  CPU e memoria\nProgetto computer (pratico, 30%)\nSistemi di numerazione (scritto)'}
          className="font-mono text-xs"
        />
        {parsed.length > 0 && (
          <div className="space-y-1 rounded-lg bg-muted p-3 text-sm">
            <p className="text-xs font-medium text-muted-foreground">
              Anteprima: {parsed.length} argomenti, {parsed.reduce((s, t) => s + t.assessments.length, 0)} valutazioni.
            </p>
            <ol className="list-decimal space-y-1.5 pl-5">
              {parsed.map((t, i) => (
                <li key={i}>
                  <span className={cn(t.completed && 'text-muted-foreground line-through')}>{t.title}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    · {t.hours === 0 && 'solo valutazione · '}
                    {periods[periodIndex[i]].name}
                  </span>
                  {t.points.length > 0 && <span className="block text-xs text-muted-foreground">{t.points.join(' · ')}</span>}
                  {t.assessments.length > 0 && (
                    <span className="mt-1 flex flex-wrap gap-1">
                      {t.assessments.map((a, j) => (
                        <AssessmentChip key={j} assessment={{ type: a.type, weight: a.weight ?? (a.minor ? course.rules.minorWeight : 100), text: a.text }} />
                      ))}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Annulla
          </Button>
          <Button disabled={parsed.length === 0} onClick={importAll}>
            Importa {parsed.length || ''} argomenti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** "3 fatte su 5 in calendario" */
function lessonsLine(p: TopicProgress): string {
  const n = (x: number) => (x === 1 ? 'una lezione' : `${x} lezioni`)
  if (p.doneLessons === 0) return `${n(p.plannedLessons)} in calendario`
  if (p.doneLessons >= p.plannedLessons) return `${n(p.doneLessons)} ${p.doneLessons === 1 ? 'fatta' : 'fatte'}`
  return `${p.doneLessons} ${p.doneLessons === 1 ? 'fatta' : 'fatte'} su ${p.plannedLessons} in calendario`
}
