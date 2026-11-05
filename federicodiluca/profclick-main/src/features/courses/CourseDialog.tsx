import { useState } from 'react'
import { Segmented, Toggle } from '@/components/bits'
import { LabHoursIcon, PlusIcon, TrashIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changeSchedule, saveCourse } from '@/core/actions'
import { formatDay, type ISODate, startOfWeek, today, weekdayName } from '@/core/dates'
import { targetGrades } from '@/core/grading'
import { type Course, GRADE_LABELS, GRADE_TYPES, type GradeType, sameSchedule, type ScheduleSlot, weeklyHours } from '@/core/model'
import { newId } from '@/lib/id'
import { COURSE_COLORS, courseColor } from '@/lib/ui'
import { cn } from '@/lib/utils'
import { useData } from '@/state/data'

type Draft = Omit<Course, 'updatedAt'>
type ScheduleMode = 'giorni' | 'lezioni'

const DAYS = [1, 2, 3, 4, 5, 6]
const START_HOURS = [1, 2, 3, 4, 5, 6, 7, 8]

function blank(order: number, color: number, minorWeight: number): Draft {
  return {
    id: newId(),
    className: '',
    subject: '',
    color,
    schedule: [],
    pastSchedules: [],
    rules: { perPeriod: null, required: [...GRADE_TYPES], minorWeight },
    civics: {},
    periodNotes: {},
    prep: [],
    order,
  }
}

/** Da giorni a lezioni in ordine e viceversa, senza perdere ore e laboratorio. */
function convert(schedule: ScheduleSlot[], to: ScheduleMode): ScheduleSlot[] {
  // Senza giorno, l'ora d'inizio non ha più senso.
  if (to === 'lezioni') return [...schedule].sort((a, b) => (a.day ?? 9) - (b.day ?? 9)).map((s) => ({ day: null, hours: s.hours, lab: s.lab }))
  return schedule.slice(0, 6).map((s, i) => ({ ...s, day: i + 1 }))
}

/** "lun 2 h · mer 1 h ITP", o "2 h · 1 h ITP" per le lezioni senza giorno. */
function describeSchedule(schedule: ScheduleSlot[]): string {
  return schedule.map((s) => `${s.day ? `${weekdayName(s.day, true)} ` : ''}${s.hours} h${s.lab ? ' ITP' : ''}`).join(' · ')
}

/** "Un voto per ora settimanale, almeno uno scritto, orale e pratico, minori al 30%" */
function rulesSummary(draft: Draft, autoTarget: number): string {
  const { perPeriod, required, minorWeight } = draft.rules
  const count = perPeriod === null ? `Un voto per ora settimanale (${autoTarget})` : `${perPeriod} voti per periodo`
  const types = required.map((t) => GRADE_LABELS[t].toLowerCase())
  const atLeast = types.length ? `, almeno uno ${types.length > 1 ? `${types.slice(0, -1).join(', ')} e ${types.at(-1)}` : types[0]}` : ''
  return `${count}${atLeast}, minori al ${minorWeight}%`
}

export function CourseDialog({
  open,
  course,
  onClose,
  onSaved,
}: {
  open: boolean
  /** La classe da modificare; senza, se ne crea una nuova. */
  course?: Course
  onClose: () => void
  onSaved?: (id: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        {open && <CourseForm course={course} onClose={onClose} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  )
}

function CourseForm({ course, onClose, onSaved }: { course?: Course; onClose: () => void; onSaved?: (id: string) => void }) {
  const { data, apply, applyWithUndo } = useData()
  const year = data.year
  const existing = Object.values(data.courses)
  const periods = data.year?.periods ?? []
  // Chi insegna più classi ritrova le sue abitudini: materia e peso dei voti minori dell'ultima.
  const last = existing.at(-1)
  const [draft, setDraft] = useState<Draft>(() => course ?? blank(existing.length, existing.length % COURSE_COLORS, last?.rules.minorWeight ?? 30))
  const [mode, setMode] = useState<ScheduleMode>(() => (course && course.schedule.length > 0 && course.schedule.every((s) => s.day === null) ? 'lezioni' : 'giorni'))
  // Una classe nuova parte dalle regole di default: si vedono in una riga, e si aprono se servono.
  const [details, setDetails] = useState(Boolean(course))
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))
  const setRules = (patch: Partial<Draft['rules']>) => set({ rules: { ...draft.rules, ...patch } })
  const toggleRequired = (t: GradeType) =>
    setRules({ required: draft.rules.required.includes(t) ? draft.rules.required.filter((x) => x !== t) : GRADE_TYPES.filter((x) => x === t || draft.rules.required.includes(x)) })

  // Con i giorni: una lezione per giorno, modificata in posto.
  const daySlot = (day: number) => draft.schedule.find((s) => s.day === day)
  const setDay = (day: number, patch: Partial<ScheduleSlot>) => {
    const current = daySlot(day) ?? { day, hours: 0, lab: false }
    const next = { ...current, ...patch }
    const others = draft.schedule.filter((s) => s.day !== day)
    set({ schedule: (next.hours > 0 ? [...others, next] : others).sort((a, b) => (a.day ?? 0) - (b.day ?? 0)) })
  }
  const setLesson = (i: number, patch: Partial<ScheduleSlot>) => set({ schedule: draft.schedule.map((s, j) => (j === i ? { ...s, ...patch } : s)) })

  // A anno iniziato, un orario nuovo vale da una data: prima le lezioni restano nei loro giorni.
  const thisWeek: ISODate = year && startOfWeek(today()) > year.start ? startOfWeek(today()) : (year?.start ?? today())
  const [from, setFrom] = useState(thisWeek)
  const scheduleChanged = Boolean(course) && !sameSchedule(course!.schedule, draft.schedule)
  const askFrom = scheduleChanged && year !== null && today() > year.start
  const fromStart = year !== null && from <= year.start

  const asCourse = { ...draft, updatedAt: 0 }
  const autoTarget = targetGrades({ ...asCourse, rules: { ...draft.rules, perPeriod: null } })
  const valid = draft.className.trim() !== '' && weeklyHours(asCourse) > 0

  const save = () => {
    const subject = draft.subject.trim() || (course ? '' : (last?.subject ?? ''))
    const saved = { ...draft, className: draft.className.trim(), subject, schedule: draft.schedule.filter((s) => s.hours > 0) }
    if (course && scheduleChanged && year) {
      // Il resto si salva com'è; l'orario passa da changeSchedule, che sposta anche il piano.
      const rest = saveCourse({ ...saved, schedule: course.schedule, pastSchedules: course.pastSchedules })
      applyWithUndo((d) => changeSchedule(course.id, saved.schedule, askFrom ? from : year.start)(rest(d)), 'Orario cambiato: il piano è passato sui nuovi giorni')
    } else apply(saveCourse(saved))
    onSaved?.(draft.id)
    onClose()
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) save()
      }}
    >
      <DialogHeader>
        <DialogTitle>{course ? 'Modifica classe' : 'Nuova classe'}</DialogTitle>
        <DialogDescription>Dall'orario si ricavano tutte le lezioni dell'anno, senza festività e vacanze.</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="class-name">Classe</Label>
          <Input id="class-name" placeholder="3A" value={draft.className} onChange={(e) => set({ className: e.target.value })} autoFocus />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="subject">Materia</Label>
          <Input id="subject" placeholder={last?.subject || 'Informatica'} value={draft.subject} onChange={(e) => set({ subject: e.target.value })} />
        </div>
      </div>

      <div className="grid gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>Orario</Label>
          <Segmented<ScheduleMode>
            value={mode}
            onChange={(m) => {
              setMode(m)
              set({ schedule: convert(draft.schedule, m) })
            }}
            options={[
              { value: 'giorni', label: 'Con i giorni' },
              { value: 'lezioni', label: 'Solo le lezioni' },
            ]}
          />
        </div>

        {mode === 'giorni' ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {DAYS.map((day) => {
              const slot = daySlot(day)
              return (
                <div key={day} className="grid gap-1 text-center">
                  <span className="text-xs text-muted-foreground capitalize">{weekdayName(day, true)}</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={8}
                    value={slot?.hours ?? ''}
                    placeholder="0"
                    onChange={(e) => setDay(day, { hours: Number(e.target.value) })}
                    className="text-center"
                    aria-label={`Ore di ${weekdayName(day)}`}
                  />
                  <select
                    value={slot?.start ?? ''}
                    disabled={!slot}
                    onChange={(e) => setDay(day, { start: Number(e.target.value) || undefined })}
                    className="h-7 rounded-md border border-input bg-transparent px-1 text-center text-xs text-muted-foreground disabled:opacity-40"
                    aria-label={`Ora d'inizio di ${weekdayName(day)}`}
                    title="Da che ora di scuola, se vuoi: le lezioni del giorno vanno in ordine"
                  >
                    <option value="">ora</option>
                    {START_HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}ª ora
                      </option>
                    ))}
                  </select>
                  <LabToggle on={slot?.lab ?? false} disabled={!slot} onClick={() => setDay(day, { lab: !slot?.lab })} />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {draft.schedule.map((slot, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-20 text-sm text-muted-foreground">Lezione {i + 1}</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={8}
                  value={slot.hours}
                  onChange={(e) => setLesson(i, { hours: Number(e.target.value) })}
                  className="w-16 text-center"
                  aria-label={`Ore della lezione ${i + 1}`}
                />
                <span className="text-sm text-muted-foreground">ore</span>
                <LabToggle on={slot.lab} onClick={() => setLesson(i, { lab: !slot.lab })} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="ml-auto"
                  aria-label={`Togli la lezione ${i + 1}`}
                  onClick={() => set({ schedule: draft.schedule.filter((_, j) => j !== i) })}
                >
                  <TrashIcon />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={draft.schedule.length >= 6}
              onClick={() => set({ schedule: [...draft.schedule, { day: null, hours: 1, lab: false }] })}
            >
              <PlusIcon /> Lezione
            </Button>
            <p className="text-xs text-muted-foreground">
              Le lezioni di ogni settimana, in ordine, con le loro ore: non serve sapere in che giorno cadono. Se c'è una festività in
              settimana, ProfClick toglie una lezione; se non era quella, la sistemi con <em>Lezione saltata</em>.
            </p>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {weeklyHours(asCourse)} ore a settimana. <strong>ITP</strong>: ore in laboratorio o in compresenza, dove vanno le prove pratiche.
          {mode === 'giorni' && " L'ora d'inizio è facoltativa: mette in ordine le lezioni della giornata."}
        </p>

        {askFrom && (
          <div className="grid gap-2 rounded-lg border border-primary/40 bg-primary/5 p-3">
            <Label htmlFor="schedule-from">Il nuovo orario vale dal</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="schedule-from"
                type="date"
                min={year.start}
                max={year.end}
                value={fromStart ? year.start : from}
                onChange={(e) => e.target.value && setFrom(e.target.value)}
                className="h-8 w-44"
              />
              <Toggle on={fromStart} onClick={() => setFrom(fromStart ? thisWeek : year.start)}>
                Dall'inizio dell'anno
              </Toggle>
            </div>
            <p className="text-xs text-muted-foreground">
              {fromStart
                ? "L'orario si corregge per tutto l'anno: anche le lezioni già passate vanno sui nuovi giorni."
                : 'Le lezioni prima di questa data restano nei loro giorni. Da qui in poi il piano passa sui nuovi giorni, nello stesso ordine, comprese quelle già fatte: va bene anche una data passata.'}
            </p>
          </div>
        )}
        {course && course.pastSchedules.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Orari precedenti</span>
            <ul>
              {course.pastSchedules.map((p) => (
                <li key={p.until}>
                  fino al {formatDay(p.until)}: {describeSchedule(p.schedule)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {!details ? (
        <button type="button" onClick={() => setDetails(true)} className="grid gap-0.5 rounded-lg border border-dashed p-3 text-left transition-colors hover:bg-muted/40">
          <span className="flex items-center gap-2 text-sm font-medium">
            <span className="size-3 shrink-0 rounded-full" style={{ background: courseColor(draft) }} />
            Colore, voti ed educazione civica
          </span>
          <span className="text-xs text-muted-foreground">{rulesSummary(draft, autoTarget)}. Tocca per cambiare.</span>
        </button>
      ) : (
        <>
          <div className="grid gap-2">
            <Label>Colore</Label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: COURSE_COLORS }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Colore ${i + 1}`}
                  aria-pressed={draft.color === i}
                  onClick={() => set({ color: i })}
                  className={cn('size-7 rounded-full ring-offset-2 ring-offset-background transition', draft.color === i && 'ring-2 ring-foreground')}
                  style={{ background: courseColor({ color: i }) }}
                />
              ))}
            </div>
          </div>

          <fieldset className="grid gap-3 rounded-lg border p-3">
            <legend className="px-1 text-sm font-medium">Voti per periodo</legend>
            <Segmented<'auto' | 'fixed'>
              value={draft.rules.perPeriod === null ? 'auto' : 'fixed'}
              onChange={(v) => setRules({ perPeriod: v === 'auto' ? null : autoTarget })}
              options={[
                { value: 'auto', label: `Uno per ora settimanale (${autoTarget})` },
                { value: 'fixed', label: 'Numero fisso' },
              ]}
            />
            {draft.rules.perPeriod !== null && (
              <Input
                type="number"
                min={1}
                max={20}
                value={draft.rules.perPeriod}
                onChange={(e) => setRules({ perPeriod: Math.max(1, Number(e.target.value)) })}
                className="w-24"
                aria-label="Voti per periodo"
              />
            )}
            <div className="grid gap-1.5">
              <span className="text-xs text-muted-foreground">Almeno uno per tipo:</span>
              <div className="flex flex-wrap gap-1.5">
                {GRADE_TYPES.map((t) => (
                  <Toggle key={t} on={draft.rules.required.includes(t)} onClick={() => toggleRequired(t)}>
                    {GRADE_LABELS[t]}
                  </Toggle>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              Peso proposto per i voti minori
              <Input
                type="number"
                min={5}
                max={95}
                step={5}
                value={draft.rules.minorWeight}
                onChange={(e) => setRules({ minorWeight: Number(e.target.value) })}
                className="w-20"
              />
              %
            </label>
          </fieldset>

          {periods.length > 0 && (
            <fieldset className="grid gap-2 rounded-lg border p-3">
              <legend className="px-1 text-sm font-medium">Educazione civica</legend>
              <p className="text-xs text-muted-foreground">Ore da svolgere in questa classe, se ne hai. Vengono contate e proposte nel piano.</p>
              <div className="flex flex-wrap gap-3">
                {periods.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    {p.name}
                    <Input
                      type="number"
                      min={0}
                      max={33}
                      value={draft.civics[p.id] ?? ''}
                      placeholder="0"
                      onChange={(e) => set({ civics: { ...draft.civics, [p.id]: Number(e.target.value) || 0 } })}
                      className="w-16 text-center"
                    />
                    ore
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </>
      )}

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Annulla
        </Button>
        <Button type="submit" disabled={!valid}>
          {course ? 'Salva' : 'Crea classe'}
        </Button>
      </DialogFooter>
    </form>
  )
}

function LabToggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      title="In laboratorio o con l'ITP"
      className={cn(
        'inline-flex items-center justify-center gap-1 rounded-md border px-1.5 py-0.5 text-[0.7rem] font-semibold transition-colors disabled:opacity-40',
        on ? 'border-pencil-blue bg-pencil-blue/10 text-pencil-blue' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <LabHoursIcon className="size-3.5" />
      ITP
    </button>
  )
}
