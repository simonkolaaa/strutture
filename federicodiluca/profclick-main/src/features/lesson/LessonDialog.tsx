import { createElement, useState } from 'react'
import { toast } from 'sonner'
import { ActivityLine, CourseName, Segmented, Toggle } from '@/components/bits'
import { CalendarAddIcon, CancelledIcon, DoneIcon, EditIcon, type IconComponent, MinusIcon, NoteIcon, PlusIcon, RegisterIcon, ShiftIcon, TrashIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { activityRepeats, addActivity, cancelAndShift, deleteLesson, type LessonTime, lessonTimeProblem, moveLesson, removeActivity, setActivityStep, setCancelled, setDone, setNote, setRepeats, toggleRepeat, updateActivity } from '@/core/actions'
import { courseSlots, isAvailable } from '@/core/calendar'
import { assessmentEntry, googleCalendarLink } from '@/core/calendarExport'
import { addDays, formatDay, formatLong, formatShort, type ISODate, startOfWeek } from '@/core/dates'
import { type Activity, type ActivityKind, type Assessment, GRADE_LABELS, type GradeType, isAutoDone, isDone, lessonKey, type StepKey } from '@/core/model'
import { courseTopics, TEACHING_KINDS, topicAround, topicsSinceLastAssessment } from '@/core/progress'
import { lessonRegisterText } from '@/core/registerText'
import { activitySteps, customStep, isAfter, optionalSteps, stepLabel } from '@/core/steps'
import { activityIcon } from '@/lib/activityIcons'
import { newId } from '@/lib/id'
import { formatHours } from '@/lib/ui'
import { cn } from '@/lib/utils'
import { useAutosave } from '@/lib/useAutosave'
import { useData } from '@/state/data'
import { LessonTimeFields } from './LessonTime'

/** Peso segnaposto del voto minore: al momento di aggiungerlo diventa quello proposto dalla classe. */
const MINOR = -1

type QuickAdd = { label: string; kind: ActivityKind; assessment?: Assessment }

/**
 * I pulsanti per aggiungere un'attività: in vista le quattro di tutti i giorni, le altre a un
 * tocco. La verifica nasce scritta, o pratica nelle ore con l'ITP; il tipo si cambia dopo.
 */
const MAIN_ADD: QuickAdd[] = [
  { label: 'Spiegazione', kind: 'spiegazione' },
  { label: 'Esercitazione', kind: 'esercitazione' },
  { label: 'Laboratorio', kind: 'laboratorio' },
  { label: 'Verifica', kind: 'verifica', assessment: { type: 'scritto', weight: 100, continues: false } },
]
const MORE_ADD: QuickAdd[] = [
  { label: 'Ripasso', kind: 'ripasso' },
  { label: 'Voto minore', kind: 'verifica', assessment: { type: 'pratico', weight: MINOR, continues: false } },
  { label: 'Ed. civica', kind: 'civica' },
  { label: 'Altro', kind: 'altro' },
]

/** Con pochi argomenti si vedono tutti; con tanti, quelli vicini alla lezione. */
const ALL_TOPICS_UP_TO = 5

export function LessonDialog({ courseId, date, onClose }: { courseId: string; date: ISODate | null; onClose: () => void }) {
  // Spostata in un altro giorno, la finestra resta aperta e segue la lezione.
  const [moved, setMoved] = useState<{ from: ISODate; to: ISODate } | null>(null)
  const current = date && moved?.from === date ? moved.to : date
  const close = () => {
    setMoved(null)
    onClose()
  }
  return (
    <Dialog open={current !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        {current && <LessonEditor key={current} courseId={courseId} date={current} onClose={close} onMoved={(to) => date && setMoved({ from: date, to })} />}
      </DialogContent>
    </Dialog>
  )
}

function LessonEditor({ courseId, date, onClose, onMoved }: { courseId: string; date: ISODate; onClose: () => void; onMoved: (to: ISODate) => void }) {
  const { data, apply, applyWithUndo } = useData()
  const course = data.courses[courseId]
  const lesson = data.lessons[lessonKey(courseId, date)]
  const [noteOpen, setNoteOpen] = useState(Boolean(lesson?.note))
  const [moreOpen, setMoreOpen] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [timeEdit, setTimeEdit] = useState<LessonTime | null>(null)
  const note = useAutosave((value) => course && value !== (lesson?.note ?? '') && apply(setNote(courseId, date, value)))
  if (!course) return null

  const slot = courseSlots(data, course, date, date)[0]
  const activities = lesson?.activities ?? []
  const done = isDone(lesson)
  const cancelled = lesson?.cancelled ?? false
  // Una lezione senza giorno fisso non ha una data vera: si dice quale lezione è della settimana.
  const when = slot?.floating ? `Lezione ${slot.index} della settimana del ${formatDay(startOfWeek(date))}` : formatLong(date)

  const add = (item: QuickAdd) => {
    const teaching = TEACHING_KINDS.includes(item.kind)
    const assessment = item.assessment && {
      ...item.assessment,
      type: item.assessment.weight === MINOR || !slot?.lab ? item.assessment.type : ('pratico' as const),
      weight: item.assessment.weight === MINOR ? course.rules.minorWeight : item.assessment.weight,
    }
    const topicIds = teaching
      ? [topicAround(data, course, date)?.id].filter((id): id is string => Boolean(id))
      : assessment && assessment.weight >= 100
        ? topicsSinceLastAssessment(data, course, date)
        : []
    apply(addActivity(courseId, date, { id: newId(), kind: item.kind, topicIds, text: '', assessment }))
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex flex-wrap items-center gap-x-2 text-lg">
          <CourseName course={course} />
        </DialogTitle>
        <DialogDescription className="flex flex-wrap items-center gap-x-1">
          {when} · {slot?.start && `dalla ${slot.start}ª ora · `}
          {formatHours(slot?.hours ?? 0)}
          {slot?.lab && ' · con ITP'}
          {slot?.extra && ' · in più'}
          {slot && !timeEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-xs text-primary"
              onClick={() => setTimeEdit({ date, hours: slot.hours, start: slot.start, lab: slot.lab })}
            >
              <EditIcon className="size-3.5" /> Cambia
            </Button>
          )}
        </DialogDescription>
      </DialogHeader>

      {timeEdit && (
        <TimeEditor
          courseId={courseId}
          date={date}
          value={timeEdit}
          onChange={setTimeEdit}
          onDone={() => setTimeEdit(null)}
          onMoved={onMoved}
          onDeleted={onClose}
        />
      )}

      {cancelled ? (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3">
          <span className="flex items-center gap-2 text-muted-foreground">
            <CancelledIcon className="size-5" /> Lezione saltata
          </span>
          <Button variant="outline" size="sm" onClick={() => apply(setCancelled(courseId, date, false))}>
            Ripristina
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {activities.length === 0 && <p className="text-muted-foreground">Niente in programma. Scegli cosa fare:</p>}
            {activities.map((a) => (
              <ActivityEditor key={a.id} courseId={courseId} date={date} activity={a} />
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[...MAIN_ADD, ...(moreOpen ? MORE_ADD : [])].map((item) => (
              <Button key={item.label} variant="outline" size="sm" onClick={() => add(item)}>
                {createElement(activityIcon(item.assessment ? { ...item, assessment: { ...item.assessment, weight: item.assessment.weight === MINOR ? 50 : 100 } } : item), {
                  className: item.kind === 'verifica' ? 'text-pencil-red' : 'text-pencil-blue',
                })}
                {item.label}
              </Button>
            ))}
            {!moreOpen && (
              <Button variant="ghost" size="sm" onClick={() => setMoreOpen(true)}>
                Ripasso, voto minore, ed. civica…
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {!noteOpen && (
              <Button variant="ghost" size="sm" onClick={() => setNoteOpen(true)}>
                <NoteIcon /> Aggiungi un appunto
              </Button>
            )}
            {activities.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  navigator.clipboard.writeText(lessonRegisterText(data, { lesson })).then(
                    () => toast.success('Copiato: ora incollalo nel registro'),
                    () => toast.error('Copia non riuscita'),
                  )
                }
              >
                <RegisterIcon /> Copia per il registro
              </Button>
            )}
          </div>
          {noteOpen && (
            <Textarea
              placeholder="Appunti su questa lezione: cosa è rimasto indietro, chi era assente, cosa portare…"
              defaultValue={lesson?.note ?? ''}
              {...note}
              rows={3}
            />
          )}
        </>
      )}

      {skipping && !cancelled && (
        // Gita, sciopero, assemblea: le due strade spiegate per esteso, perché da telefono un suggerimento non si vede.
        <div className="space-y-2 rounded-lg border border-primary/40 bg-primary/5 p-3">
          <p className="text-sm font-medium">Lezione saltata. Quello che era previsto…</p>
          <SkipChoice
            icon={ShiftIcon}
            title="Slitta alla lezione dopo"
            detail="Tutto il piano da qui in avanti si sposta di una lezione."
            onClick={() => {
              applyWithUndo(cancelAndShift(courseId, date), 'Lezione saltata: il piano è slittato di una lezione')
              onClose()
            }}
          />
          <SkipChoice
            icon={CancelledIcon}
            title="Si toglie"
            detail="Il resto del piano resta dov'è."
            onClick={() => {
              applyWithUndo(
                (d) => setCancelled(courseId, date, true)(activities.reduce((x, a) => removeActivity(courseId, date, a.id)(x), d)),
                'Lezione saltata',
              )
              setSkipping(false)
            }}
          />
          <Button variant="ghost" size="sm" onClick={() => setSkipping(false)}>
            Indietro
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
        {!cancelled && !skipping && (
          <Button
            variant="ghost"
            size="sm"
            // Senza niente in programma non c'è niente da spostare: si salta e basta.
            onClick={() => (activities.length > 0 ? setSkipping(true) : apply(setCancelled(courseId, date, true)))}
          >
            <CancelledIcon /> Lezione saltata
          </Button>
        )}
        <span className="ml-auto flex flex-wrap items-center gap-2">
          {!cancelled && isAutoDone(lesson) ? (
            // Passata con qualcosa in programma: conta da sola come fatta.
            <span className="flex items-center gap-1.5 text-sm font-medium text-done">
              <DoneIcon className="size-4" /> Fatta
            </span>
          ) : (
            !cancelled && (
              <Button
                variant={done ? 'secondary' : 'outline'}
                onClick={() => {
                  apply(setDone(courseId, date, !done))
                  if (!done) {
                    toast.success('Lezione fatta')
                    onClose()
                  }
                }}
                className={cn(done && 'text-done')}
              >
                <DoneIcon />
                {done ? 'Fatta' : 'Segna come fatta'}
              </Button>
            )
          )}
          {/* Tutto si salva già mentre si scrive: il pulsante chiude soltanto, come nelle riunioni. */}
          <Button onClick={onClose}>Fatto</Button>
        </span>
      </div>
    </>
  )
}

/**
 * Giorno, ora e durata di una lezione, per un cambio d'orario, una sostituzione, un'ora
 * scambiata. Il piano segue la lezione. Eliminarla vuol dire che non c'era: sparisce, senza
 * restare barrata come una lezione saltata.
 */
function TimeEditor({
  courseId,
  date,
  value,
  onChange,
  onDone,
  onMoved,
  onDeleted,
}: {
  courseId: string
  date: ISODate
  value: LessonTime
  onChange: (value: LessonTime) => void
  onDone: () => void
  onMoved: (to: ISODate) => void
  onDeleted: () => void
}) {
  const { data, applyWithUndo } = useData()
  const problem = lessonTimeProblem(data, courseId, value, date)
  const hasPlan = (data.lessons[lessonKey(courseId, date)]?.activities.length ?? 0) > 0
  return (
    <div className="space-y-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
      <LessonTimeFields value={value} onChange={onChange} />
      {problem && <p className="text-sm text-warn">{problem}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-pencil-red"
          onClick={() => {
            applyWithUndo(deleteLesson(courseId, date), hasPlan ? 'Lezione eliminata, con quello che era previsto' : 'Lezione eliminata')
            onDeleted()
          }}
        >
          <TrashIcon /> Elimina lezione
        </Button>
        <span className="flex gap-1.5">
          <Button variant="ghost" size="sm" onClick={onDone}>
            Indietro
          </Button>
          <Button
            size="sm"
            disabled={Boolean(problem)}
            onClick={() => {
              applyWithUndo(moveLesson(courseId, date, value), value.date === date ? 'Lezione cambiata' : `Lezione spostata a ${formatLong(value.date)}`)
              onDone()
              if (value.date !== date) onMoved(value.date)
            }}
          >
            Salva
          </Button>
        </span>
      </div>
    </div>
  )
}

function SkipChoice({ icon: Icon, title, detail, onClick }: { icon: IconComponent; title: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/40">
      <Icon className="mt-0.5 size-5 shrink-0 text-pencil-blue" />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{detail}</span>
      </span>
    </button>
  )
}

type Part = 'nuovo' | 'continua' | 'recupero'

const PARTS: { value: Part; label: string }[] = [
  { value: 'nuovo', label: 'Voto nuovo' },
  { value: 'continua', label: 'Continua la precedente' },
  { value: 'recupero', label: 'Recupero assenti' },
]

/** Quante lezioni dopo si vedono da scegliere, prima di "Altre lezioni". */
const PICK_PAGE = 6

/**
 * Un'attività che prende più lezioni: il giro di interrogazioni, un laboratorio lungo, un
 * ripasso. Le prossime N di fila con − e +, oppure le lezioni scelte una per una. Una lezione è
 * il blocco intero del giorno, con tutte le sue ore. Tutto si salva subito; le ripetizioni
 * seguono tipo, argomenti e dettagli.
 */
function Repeats({ courseId, date, activity }: { courseId: string; date: ISODate; activity: Activity }) {
  const { data, apply } = useData()
  const [shown, setShown] = useState(PICK_PAGE)
  const course = data.courses[courseId]
  const repeats = activityRepeats(data, courseId, activity.id)
  const repeated = new Set(repeats.map((r) => r.date))
  const next = course ? courseSlots(data, course, addDays(date, 1)).filter(isAvailable) : []
  const last = repeats.at(-1)?.date ?? date
  const more = next.some((s) => s.date > last)
  // Si vedono sempre anche le lezioni già scelte, pure se lontane.
  const choices = next.filter((s, i) => i < Math.max(shown, repeats.length + 1) || repeated.has(s.date))
  const set = (count: number) => apply(setRepeats(courseId, date, activity.id, count, newId))
  return (
    <div className="space-y-1.5 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-1.5">
        Si ripete in
        <span className="inline-flex items-center rounded-md border">
          <Button variant="ghost" size="icon-sm" className="size-7" aria-label="Una lezione in meno" disabled={repeats.length === 0} onClick={() => set(repeats.length - 1)}>
            <MinusIcon />
          </Button>
          <span className="w-6 text-center font-medium text-foreground tabular-nums">{repeats.length}</span>
          <Button variant="ghost" size="icon-sm" className="size-7" aria-label="Una lezione in più" disabled={!more} onClick={() => set(repeats.length + 1)}>
            <PlusIcon />
          </Button>
        </span>
        {repeats.length === 1 ? 'altra lezione' : 'altre lezioni'}
        {activity.assessment && repeats.length > 0 && ' · un voto solo'}
      </div>
      {next.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Lezioni in cui si ripete">
          {choices.map((s) => (
            <Toggle key={s.date} on={repeated.has(s.date)} onClick={() => apply(toggleRepeat(courseId, date, activity.id, s.date, newId))}>
              {s.floating ? `${s.index}ª lez. sett. ${formatShort(startOfWeek(s.date))}` : formatShort(s.date)} · {formatHours(s.hours)}
            </Toggle>
          ))}
          {choices.length < next.length && (
            <button type="button" onClick={() => setShown(shown + PICK_PAGE)} className="px-1.5 font-medium text-primary hover:underline">
              Altre lezioni
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** In una ripetizione: da quale lezione viene. Tipo, argomenti e dettagli si cambiano là. */
function RepeatedFrom({ courseId, activityId }: { courseId: string; activityId: string }) {
  const { data } = useData()
  const from = Object.values(data.lessons).find((l) => l.courseId === courseId && l.activities.some((a) => a.id === activityId))
  if (!from) return null
  return <p className="text-xs text-muted-foreground">Ripete quella di {formatLong(from.date)}: cambiandola là, cambia anche qui.</p>
}

function ActivityEditor({ courseId, date, activity }: { courseId: string; date: ISODate; activity: Activity }) {
  const { data, apply } = useData()
  const course = data.courses[courseId]
  const topics = courseTopics(data, courseId)
  const update = (patch: Partial<Activity>) => apply(updateActivity(courseId, date, { ...activity, ...patch }))
  const text = useAutosave((value) => value !== activity.text && update({ text: value }))
  const a = activity.assessment
  const setAssessment = (patch: Partial<Assessment>) => a && update({ assessment: { ...a, ...patch } })
  const toggleTopic = (id: string) =>
    update({ topicIds: activity.topicIds.includes(id) ? activity.topicIds.filter((t) => t !== id) : [...activity.topicIds, id] })
  const [allTopics, setAllTopics] = useState(false)
  // Gli argomenti vicini: quelli scelti, quello in corso, il precedente e il successivo.
  const around = topics.findIndex((t) => t.id === topicAround(data, course, date)?.id)
  const near = new Set([...activity.topicIds, ...(around >= 0 ? topics.slice(Math.max(0, around - 1), around + 2).map((t) => t.id) : [])])
  const shownTopics = allTopics || topics.length <= ALL_TOPICS_UP_TO ? topics : topics.filter((t) => near.has(t.id))

  return (
    <div className="space-y-2.5 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <ActivityLine activity={{ ...activity, topicIds: [], text: '' }} data={data} />
        <Button variant="ghost" size="icon-sm" aria-label="Togli attività" onClick={() => apply(removeActivity(courseId, date, activity.id))}>
          <TrashIcon />
        </Button>
      </div>

      {a && (
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<GradeType>
            value={a.type}
            onChange={(type) => setAssessment({ type })}
            options={(['scritto', 'teorico', 'pratico'] as const).map((t) => ({ value: t, label: GRADE_LABELS[t] }))}
          />
          <Toggle on={a.weight < 100} onClick={() => setAssessment({ weight: a.weight < 100 ? 100 : course.rules.minorWeight })}>
            Voto minore
          </Toggle>
          {a.weight < 100 && (
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              peso
              <Input
                key={a.weight}
                type="number"
                min={5}
                max={95}
                step={5}
                defaultValue={a.weight}
                onBlur={(e) => Number(e.target.value) !== a.weight && setAssessment({ weight: Math.min(95, Math.max(5, Number(e.target.value) || 5)) })}
                className="h-7 w-16 text-center"
              />
              %
            </label>
          )}
        </div>
      )}

      {a && (
        // Interrogazioni su più lezioni e recupero degli assenti: lo stesso voto, non uno nuovo.
        <Segmented<Part>
          value={a.makeup ? 'recupero' : a.continues ? 'continua' : 'nuovo'}
          onChange={(part) =>
            update({
              // Tornata un voto a sé, non segue più quella da cui era ripetuta.
              repeatOf: part === 'nuovo' ? undefined : activity.repeatOf,
              assessment: { ...a, continues: part !== 'nuovo', makeup: part === 'recupero' || undefined, plannedId: part === 'nuovo' ? a.plannedId : undefined },
            })
          }
          options={PARTS}
        />
      )}
      {activity.repeatOf ? <RepeatedFrom courseId={courseId} activityId={activity.repeatOf} /> : <Repeats courseId={courseId} date={date} activity={activity} />}

      {topics.length > 0 && activity.kind !== 'civica' && (
        <div className="flex flex-wrap gap-1.5" aria-label="Argomenti">
          {shownTopics.map((t) => (
            <Toggle
              key={t.id}
              on={activity.topicIds.includes(t.id)}
              onClick={() => toggleTopic(t.id)}
              className={cn(!activity.topicIds.includes(t.id) && t.completed && 'opacity-60')}
            >
              {t.title}
            </Toggle>
          ))}
          {shownTopics.length < topics.length && (
            <button type="button" onClick={() => setAllTopics(true)} className="px-1.5 text-xs font-medium text-primary hover:underline">
              Tutti gli argomenti ({topics.length})
            </button>
          )}
        </div>
      )}

      <Input
        placeholder={
          activity.kind === 'verifica'
            ? 'Dettagli: con orale, gruppo, consegna…'
            : activity.kind === 'civica'
              ? 'Tema: Agenda 2030, cittadinanza digitale…'
              : 'Dettagli: esercizi, pagine, materiale…'
        }
        defaultValue={activity.text}
        {...text}
        className="h-8"
      />

      <Steps courseId={courseId} date={date} activity={activity} />

      {a && !a.continues && (
        <a
          href={googleCalendarLink(assessmentEntry(data, course, date, activity))}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <CalendarAddIcon className="size-4" /> Aggiungi a Google Calendar
        </a>
      )}
    </div>
  )
}

/**
 * I passi dell'attività (ADR 0022), le stesse spunte del Da fare: prima quello da preparare,
 * dopo, per le valutazioni, correzione, riconsegna e voti sul registro. Si tolgono e si aggiungono.
 */
function Steps({ courseId, date, activity }: { courseId: string; date: ISODate; activity: Activity }) {
  const { apply } = useData()
  const steps = activitySteps(activity)
  const extra = optionalSteps(activity)
  const set = (key: StepKey, change: { done?: boolean; present?: boolean }) => apply(setActivityStep(courseId, date, activity.id, key, change))
  const group = (title: string, list: typeof steps) =>
    list.length > 0 && (
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <ul className="space-y-0.5">
          {list.map((step) => (
            <li key={step.key} className="group flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={step.done}
                onChange={() => set(step.key, { done: !step.done })}
                className="size-4 shrink-0 accent-[var(--done)]"
                aria-label={stepLabel(step.key, activity)}
              />
              <span className={cn('min-w-0 flex-1', step.done && 'text-muted-foreground line-through')}>{stepLabel(step.key, activity)}</span>
              <button
                type="button"
                onClick={() => set(step.key, { present: false })}
                aria-label={`Togli ${stepLabel(step.key, activity)}`}
                className="rounded p-0.5 text-muted-foreground opacity-60 hover:opacity-100"
              >
                <TrashIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  return (
    <div className="space-y-2 rounded-md bg-muted/40 p-2">
      {group('Da preparare', steps.filter((s) => !isAfter(s.key)))}
      {group('Dopo', steps.filter((s) => isAfter(s.key)))}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Aggiungi:</span>
        {extra.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => set(key, { present: true })}
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground"
          >
            <PlusIcon className="size-3" /> {stepLabel(key, activity)}
          </button>
        ))}
        <CustomStep placeholder="Altro prima…" label="Aggiungi un passo da preparare" onAdd={(text) => set(customStep(text), { present: true })} />
        <CustomStep placeholder="Altro dopo…" label="Aggiungi un passo da fare dopo" onAdd={(text) => set(customStep(text, true), { present: true })} />
      </div>
    </div>
  )
}

/** Un passo scritto a mano: si scrive e si aggiunge con Invio o con il più. */
function CustomStep({ placeholder, label, onAdd }: { placeholder: string; label: string; onAdd: (text: string) => void }) {
  const [text, setText] = useState('')
  return (
    <form
      className="inline-flex items-center"
      onSubmit={(e) => {
        e.preventDefault()
        if (!text.trim()) return
        onAdd(text)
        setText('')
      }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="w-32 rounded-full border border-dashed bg-transparent px-2 py-0.5 text-xs outline-none placeholder:text-muted-foreground focus:w-48 focus:border-solid focus:border-foreground/30"
      />
      {text.trim() && (
        <button type="submit" aria-label="Aggiungi" className="ml-1 rounded-full border p-0.5 text-muted-foreground hover:text-foreground">
          <PlusIcon className="size-3" />
        </button>
      )}
    </form>
  )
}
