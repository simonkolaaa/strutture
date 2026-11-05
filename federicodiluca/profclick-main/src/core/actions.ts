// Le modifiche ai dati, come funzioni pure: ricevono il documento e ne restituiscono uno
// nuovo. Ogni record toccato riceve un updatedAt nuovo, che serve all'unione tra dispositivi.

import { archivedYear, matchPeriod, type ProgramSource } from './archive'
import { courseSlots, isAvailable } from './calendar'
import { addDays, type ISODate, weekday } from './dates'
import { COLLECTIONS, tombstone } from './merge'
import {
  type Activity,
  type Collection,
  type Course,
  courseLabel,
  isDone,
  type Lesson,
  lessonKey,
  type Meeting,
  type Note,
  type PastSchedule,
  type ProfclickData,
  sameSchedule,
  scheduleAt,
  type ScheduleSlot,
  type SchoolYear,
  type Stamped,
  type StepKey,
  type Topic,
} from './model'
import type { ProposedLesson } from './proposal'
import { isAfter, withStep } from './steps'

export type Change = (data: ProfclickData) => ProfclickData

/** Un istante sempre successivo all'ultima modifica e all'eventuale cancellazione del record. */
function stamp(data: ProfclickData, collection: Collection, key: string, previous?: { updatedAt: number }): number {
  return Math.max(Date.now(), (previous?.updatedAt ?? 0) + 1, (data.deleted[tombstone(collection, key)] ?? 0) + 1)
}

function put<C extends Collection>(data: ProfclickData, collection: C, key: string, value: ProfclickData[C][string]): ProfclickData {
  const previous = data[collection][key]
  const record = { ...value, updatedAt: stamp(data, collection, key, previous) }
  return { ...data, [collection]: { ...data[collection], [key]: record } }
}

function remove(data: ProfclickData, collection: Collection, keys: string[]): ProfclickData {
  if (keys.length === 0) return data
  const records = { ...data[collection] }
  const deleted = { ...data.deleted }
  const now = Date.now()
  for (const key of keys) {
    delete records[key]
    deleted[tombstone(collection, key)] = Math.max(now, (data[collection][key]?.updatedAt ?? 0) + 1)
  }
  return { ...data, [collection]: records, deleted }
}

// --- Anno -------------------------------------------------------------------------------

export function setYear(year: Omit<SchoolYear, 'updatedAt'>): Change {
  return (data) => ({ ...data, year: { ...year, updatedAt: Math.max(Date.now(), (data.year?.updatedAt ?? 0) + 1) } })
}

// --- Classi -----------------------------------------------------------------------------

export function saveCourse(course: Omit<Course, 'updatedAt'>): Change {
  return (data) => put(data, 'courses', course.id, { ...course, updatedAt: 0 })
}

/**
 * Un nuovo orario da una data in poi (ADR 0010). Prima di quella data resta l'orario di
 * prima, così le lezioni passate non cambiano giorno. Il piano da quella data passa sulle
 * nuove lezioni nello stesso ordine: la prima lezione col nuovo orario fa quello che faceva
 * la prima col vecchio, e così via. Le lezioni annullate restano nel loro giorno, se c'è
 * ancora. Una data all'inizio dell'anno, o prima, corregge l'orario per tutto l'anno.
 */
export function changeSchedule(courseId: string, schedule: ScheduleSlot[], from: ISODate): Change {
  return (data) => {
    const course = data.courses[courseId]
    if (!course || !data.year) return data

    let pastSchedules: PastSchedule[] = []
    if (from > data.year.start) {
      const until = addDays(from, -1)
      pastSchedules = [...course.pastSchedules.filter((p) => p.until < until), { until, schedule: scheduleAt(course, until) }]
    }
    // Due orari uguali di seguito sono uno solo.
    pastSchedules = pastSchedules.filter((p, i) => !sameSchedule(p.schedule, pastSchedules[i + 1]?.schedule ?? schedule))
    const updated = { ...course, schedule, pastSchedules }

    // Le lezioni in più restano nel loro giorno: non vengono dall'orario.
    const before = courseSlots(data, course, from).filter((s) => !s.extra)
    let next = put(data, 'courses', courseId, updated)
    const after = courseSlots(next, updated, from).filter((s) => !s.extra)

    const cancelled = new Map(before.filter((s) => s.lesson?.cancelled).map((s) => [s.date, s.lesson!]))
    const moving = before.filter((s) => !s.lesson?.cancelled).map((s) => s.lesson)
    const target = new Map<ISODate, Lesson>()
    let i = 0
    for (const slot of after) {
      const lesson = cancelled.get(slot.date) ?? moving[i++]
      if (lesson) target.set(slot.date, lesson.date === slot.date ? lesson : { ...lesson, date: slot.date })
    }
    // Con meno lezioni di prima, quello che esce dall'anno finisce nell'ultima, per non perderlo.
    const left = moving.slice(i).flatMap((l) => l?.activities ?? [])
    const last = after.filter((s) => !target.get(s.date)?.cancelled).at(-1)
    if (left.length > 0 && last) {
      const lesson = target.get(last.date) ?? emptyLesson(courseId, last.date)
      target.set(last.date, { ...lesson, activities: [...lesson.activities, ...left] })
    }

    const stale = Object.keys(next.lessons).filter((k) => {
      const l = next.lessons[k]
      return l.courseId === courseId && l.date >= from && !target.has(l.date) && !l.extra && !l.removed
    })
    next = remove(next, 'lessons', stale)
    for (const lesson of target.values()) if (next.lessons[lessonKey(courseId, lesson.date)] !== lesson) next = writeLesson(next, lesson)
    return next
  }
}

export function deleteCourse(courseId: string): Change {
  return (data) => {
    let next = remove(data, 'courses', [courseId])
    next = remove(next, 'topics', Object.keys(data.topics).filter((k) => data.topics[k].courseId === courseId))
    return remove(next, 'lessons', Object.keys(data.lessons).filter((k) => data.lessons[k].courseId === courseId))
  }
}

// --- Programma --------------------------------------------------------------------------

export function saveTopic(topic: Omit<Topic, 'updatedAt'>): Change {
  return (data) => put(data, 'topics', topic.id, { ...topic, updatedAt: 0 })
}

export function saveTopics(topics: Omit<Topic, 'updatedAt'>[]): Change {
  return (data) => topics.reduce((d, t) => saveTopic(t)(d), data)
}

/** Argomento concluso a mano, senza lezioni in calendario (es. svolto prima di usare ProfClick). */
export function setTopicCompleted(topicId: string, completed: boolean): Change {
  return (data) => {
    const topic = data.topics[topicId]
    return topic ? put(data, 'topics', topicId, { ...topic, completed }) : data
  }
}

/** Valutazione prevista segnata come fatta, senza metterla in calendario. */
export function setAssessmentDone(topicId: string, assessmentId: string, done: boolean): Change {
  return (data) => {
    const topic = data.topics[topicId]
    if (!topic) return data
    return put(data, 'topics', topicId, { ...topic, assessments: topic.assessments.map((a) => (a.id === assessmentId ? { ...a, done } : a)) })
  }
}

export function deleteTopic(topicId: string): Change {
  return (data) => remove(data, 'topics', [topicId])
}

/** Sposta un argomento di un posto in su o in giù, rinumerando l'ordine della classe. */
export function moveTopic(topicId: string, direction: -1 | 1): Change {
  return (data) => {
    const topic = data.topics[topicId]
    if (!topic) return data
    const list = Object.values(data.topics)
      .filter((t) => t.courseId === topic.courseId)
      .sort((a, b) => a.order - b.order)
    const from = list.findIndex((t) => t.id === topicId)
    const to = from + direction
    if (to < 0 || to >= list.length) return data
    ;[list[from], list[to]] = [list[to], list[from]]
    return list.reduce((d, t, i) => (t.order === i ? d : put(d, 'topics', t.id, { ...t, order: i })), data)
  }
}

// --- Lezioni ----------------------------------------------------------------------------

function emptyLesson(courseId: string, date: ISODate): Lesson {
  return { courseId, date, activities: [], done: false, cancelled: false, note: '', updatedAt: 0 }
}

function isBlank(lesson: Lesson): boolean {
  return (
    lesson.activities.length === 0 &&
    !lesson.done &&
    !lesson.cancelled &&
    !lesson.note.trim() &&
    !lesson.extra &&
    !lesson.removed &&
    lesson.hours === undefined &&
    lesson.start === undefined &&
    lesson.lab === undefined
  )
}

/** Scrive il piano di un giorno; se resta vuoto lo toglie, così il file non si riempie di niente. */
function writeLesson(data: ProfclickData, lesson: Lesson): ProfclickData {
  const key = lessonKey(lesson.courseId, lesson.date)
  if (isBlank(lesson)) return data.lessons[key] ? remove(data, 'lessons', [key]) : data
  return put(data, 'lessons', key, lesson)
}

export function updateLesson(courseId: string, date: ISODate, update: (lesson: Lesson) => Lesson): Change {
  return (data) => writeLesson(data, update(data.lessons[lessonKey(courseId, date)] ?? emptyLesson(courseId, date)))
}

export function addActivity(courseId: string, date: ISODate, activity: Activity): Change {
  return updateLesson(courseId, date, (l) => ({ ...l, activities: [...l.activities, activity] }))
}

export function replaceActivity(courseId: string, date: ISODate, activity: Activity): Change {
  return updateLesson(courseId, date, (l) => ({ ...l, activities: l.activities.map((a) => (a.id === activity.id ? activity : a)) }))
}

export function removeActivity(courseId: string, date: ISODate, activityId: string): Change {
  return updateLesson(courseId, date, (l) => ({ ...l, activities: l.activities.filter((a) => a.id !== activityId) }))
}

/** Le ripetizioni di un'attività nelle lezioni dopo, in ordine di data. */
export function activityRepeats(data: ProfclickData, courseId: string, activityId: string): { date: ISODate; activity: Activity }[] {
  return Object.values(data.lessons)
    .filter((l) => l.courseId === courseId && !l.cancelled)
    .flatMap((l) => l.activities.filter((a) => a.repeatOf === activityId).map((activity) => ({ date: l.date, activity })))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** La copia di un'attività per una lezione dopo: una valutazione ripetuta prosegue la stessa, è un voto solo. */
function repeatCopy(activity: Activity, id: string): Activity {
  const a = activity.assessment
  return {
    id,
    kind: activity.kind,
    topicIds: activity.topicIds,
    text: activity.text,
    repeatOf: activity.id,
    ...(a && { assessment: { type: a.type, weight: a.weight, continues: true } }),
  }
}

/**
 * Un'attività che prende più lezioni (il giro di interrogazioni, un laboratorio lungo): si
 * ripete nelle prossime `count` lezioni non saltate, accanto a quello che c'è già. Una lezione
 * è il blocco intero del giorno: due ore di fila sono una lezione. Alzando il numero si
 * aggiungono in coda, abbassandolo si tolgono le ultime.
 */
export function setRepeats(courseId: string, date: ISODate, activityId: string, count: number, newId: () => string): Change {
  return (data) => {
    const course = data.courses[courseId]
    const activity = data.lessons[lessonKey(courseId, date)]?.activities.find((a) => a.id === activityId)
    if (!course || !activity) return data
    const repeats = activityRepeats(data, courseId, activityId)
    if (count < repeats.length) return repeats.slice(count).reduce((d, r) => removeActivity(courseId, r.date, r.activity.id)(d), data)
    const after = repeats.at(-1)?.date ?? date
    return courseSlots(data, course, addDays(after, 1))
      .filter(isAvailable)
      .slice(0, count - repeats.length)
      .reduce((d, slot) => addActivity(courseId, slot.date, repeatCopy(activity, newId()))(d), data)
  }
}

/** Una lezione scelta a mano (lunedì e giovedì, non mercoledì): l'attività si ripete lì, o non più. */
export function toggleRepeat(courseId: string, date: ISODate, activityId: string, target: ISODate, newId: () => string): Change {
  return (data) => {
    const activity = data.lessons[lessonKey(courseId, date)]?.activities.find((a) => a.id === activityId)
    if (!activity || target <= date) return data
    const existing = activityRepeats(data, courseId, activityId).find((r) => r.date === target)
    return existing ? removeActivity(courseId, target, existing.activity.id)(data) : addActivity(courseId, target, repeatCopy(activity, newId()))(data)
  }
}

/** Cambiando tipo di attività o di valutazione, i passi salvati non valgono più: tornano quelli proposti. */
function keepSteps(before: Activity | undefined, after: Activity): Activity {
  const shape = (a: Activity) => JSON.stringify([a.kind, a.assessment?.type, Boolean(a.assessment?.continues), Boolean(a.assessment?.makeup)])
  if (!before || !after.steps || shape(before) === shape(after)) return after
  const { steps: _, ...rest } = after
  return rest
}

/** Cambia un'attività; le sue ripetizioni seguono tipo, argomenti e dettagli, e tengono i loro passi. */
export function updateActivity(courseId: string, date: ISODate, activity: Activity): Change {
  return (data) => {
    const find = (d: string, id: string) => data.lessons[lessonKey(courseId, d)]?.activities.find((a) => a.id === id)
    return activityRepeats(data, courseId, activity.id).reduce(
      (d, r) => {
        const copy: Activity = {
          ...repeatCopy(activity, r.activity.id),
          ...(r.activity.ready !== undefined && { ready: r.activity.ready }),
          ...(r.activity.steps && { steps: r.activity.steps }),
          assessment: r.activity.assessment && activity.assessment && { ...r.activity.assessment, type: activity.assessment.type, weight: activity.assessment.weight },
        }
        return replaceActivity(courseId, r.date, keepSteps(r.activity, copy))(d)
      },
      replaceActivity(courseId, date, keepSteps(find(date, activity.id), activity))(data),
    )
  }
}

/**
 * A posteriori, due valutazioni diventano un voto solo: questa prosegue quella prima (il giro
 * di interrogazioni, il recupero), di cui prende tipo e peso.
 */
export function mergeAssessment(courseId: string, date: ISODate, activityId: string, into: Activity): Change {
  return updateLesson(courseId, date, (l) => ({
    ...l,
    activities: l.activities.map((a) =>
      a.id === activityId && a.assessment && into.assessment
        ? { ...a, repeatOf: into.id, assessment: { type: into.assessment.type, weight: into.assessment.weight, continues: true, ...(a.assessment.makeup && { makeup: true }) } }
        : a,
    ),
  }))
}

/** Una prosecuzione torna a essere un voto a sé. */
export function separateAssessment(courseId: string, date: ISODate, activityId: string): Change {
  return updateLesson(courseId, date, (l) => ({
    ...l,
    activities: l.activities.map((a) => {
      if (a.id !== activityId || !a.assessment) return a
      const { repeatOf: _, ...rest } = a
      return { ...rest, assessment: { type: a.assessment.type, weight: a.assessment.weight, continues: false } }
    }),
  }))
}

export function setDone(courseId: string, date: ISODate, done: boolean): Change {
  return updateLesson(courseId, date, (l) => ({ ...l, done }))
}

/** Materiale pronto, o di nuovo da preparare: tutti i passi di prima insieme. */
export function setActivityReady(courseId: string, date: ISODate, activityId: string, ready: boolean): Change {
  return updateLesson(courseId, date, (l) => ({
    ...l,
    activities: l.activities.map((a) => (a.id !== activityId ? a : a.steps ? { ...a, steps: a.steps.map((s) => (isAfter(s.key) ? s : { ...s, done: ready })) } : { ...a, ready })),
  }))
}

/** Un passo di un'attività fatto o da fare, aggiunto o tolto (ADR 0022). */
export function setActivityStep(courseId: string, date: ISODate, activityId: string, key: StepKey, change: { done?: boolean; present?: boolean }): Change {
  return updateLesson(courseId, date, (l) => ({ ...l, activities: l.activities.map((a) => (a.id === activityId ? withStep(a, key, change) : a)) }))
}

export function setNote(courseId: string, date: ISODate, note: string): Change {
  return updateLesson(courseId, date, (l) => ({ ...l, note }))
}

/** Segna fatte in un colpo tutte le lezioni passate con qualcosa in programma. */
export function markDone(slots: { courseId: string; date: ISODate }[]): Change {
  return (data) => slots.reduce((d, s) => setDone(s.courseId, s.date, true)(d), data)
}

/**
 * Lezione persa (gita, assemblea, sciopero): il giorno si segna annullato e quello che
 * c'era in programma slitta, con tutto il resto del piano, alla lezione successiva.
 * Le lezioni già fatte non si toccano.
 */
export function cancelAndShift(courseId: string, date: ISODate): Change {
  return (data) => {
    const course = data.courses[courseId]
    if (!course) return data
    const slots = courseSlots(data, course, date).filter((s) => s.date === date || (isAvailable(s) && !isDone(s.lesson)))
    if (slots[0]?.date !== date) return data

    let carry = slots[0].lesson?.activities ?? []
    let next = updateLesson(courseId, date, (l) => ({ ...l, activities: [], cancelled: true, done: false }))(data)
    for (const slot of slots.slice(1)) {
      if (carry.length === 0) break
      const moving = carry
      carry = slot.lesson?.activities ?? []
      next = updateLesson(courseId, slot.date, (l) => ({ ...l, activities: moving }))(next)
    }
    // Quello che esce dall'anno scolastico finisce nell'ultima lezione, per non perderlo.
    if (carry.length > 0 && slots.length > 1) {
      const last = slots.at(-1)!.date
      next = updateLesson(courseId, last, (l) => ({ ...l, activities: [...l.activities, ...carry] }))(next)
    }
    return next
  }
}

export interface LessonTime {
  date: ISODate
  hours: number
  /** Ora di scuola d'inizio; undefined = non indicata. */
  start?: number
  lab: boolean
}

/** C'è già una lezione della classe in quel giorno (dall'orario o aggiunta a mano). */
export function hasLessonOn(data: ProfclickData, courseId: string, date: ISODate): boolean {
  const course = data.courses[courseId]
  return Boolean(course && courseSlots(data, course, date, date).length > 0)
}

/** Perché non si può mettere una lezione lì, o null se va bene. */
export function lessonTimeProblem(data: ProfclickData, courseId: string, time: LessonTime, from?: ISODate): string | null {
  const year = data.year
  if (year && (time.date < year.start || time.date > year.end)) return "Il giorno è fuori dall'anno scolastico."
  if (weekday(time.date) === 7) return 'È una domenica.'
  if (time.date !== from && hasLessonOn(data, courseId, time.date)) {
    const course = data.courses[courseId]
    return `${course ? courseLabel(course) : 'La classe'} ha già lezione quel giorno: aprila e cambiane ore o ora d'inizio.`
  }
  return null
}

/** Una lezione in più, fuori dall'orario: supplenza, recupero, ora scambiata con un collega. */
export function addExtraLesson(courseId: string, time: LessonTime): Change {
  return (data) =>
    hasLessonOn(data, courseId, time.date)
      ? data
      : writeLesson(data, { ...emptyLesson(courseId, time.date), extra: true, hours: time.hours, start: time.start, lab: time.lab })
}

/**
 * Una lezione cambia giorno, ora o durata, col suo piano. Nello stesso giorno restano solo
 * ore e ora d'inizio diverse dall'orario. In un altro giorno diventa una lezione in più, e
 * quella dell'orario si toglie: così un cambio d'ora non lascia un buco da segnalare.
 */
export function moveLesson(courseId: string, from: ISODate, time: LessonTime): Change {
  return (data) => {
    const course = data.courses[courseId]
    const slot = course && courseSlots(data, course, from, from)[0]
    if (!slot) return data
    const lesson = slot.lesson ?? emptyLesson(courseId, from)
    if (time.date === from) {
      // Rispetto all'orario si tiene solo quello che cambia; una lezione in più tiene tutto.
      const base = slot.extra ? undefined : courseSlots({ ...data, lessons: {} }, course, from, from)[0]
      const differ = <T,>(value: T, original: T | undefined) => (base && value === original ? undefined : value)
      return writeLesson(data, {
        ...lesson,
        hours: differ(time.hours, base?.hours),
        start: differ(time.start, base?.start),
        lab: differ(time.lab, base?.lab),
      })
    }
    if (hasLessonOn(data, courseId, time.date)) return data
    const moved: Lesson = { ...lesson, date: time.date, extra: true, removed: undefined, hours: time.hours, start: time.start, lab: time.lab }
    const next = slot.extra ? remove(data, 'lessons', [lessonKey(courseId, from)]) : writeLesson(data, { ...emptyLesson(courseId, from), removed: true })
    return writeLesson(next, moved)
  }
}

/**
 * La lezione non c'era: sparisce, col suo piano. Diversa da "saltata", che resta barrata e
 * fa slittare il piano: qui è l'orario che quel giorno era diverso.
 */
export function deleteLesson(courseId: string, date: ISODate): Change {
  return (data) => {
    const lesson = data.lessons[lessonKey(courseId, date)]
    if (lesson?.extra) return remove(data, 'lessons', [lessonKey(courseId, date)])
    return writeLesson(data, { ...emptyLesson(courseId, date), removed: true })
  }
}

/** Annulla solo il giorno, senza spostare niente (es. il piano era già vuoto). */
export function setCancelled(courseId: string, date: ISODate, cancelled: boolean): Change {
  return updateLesson(courseId, date, (l) => ({ ...l, cancelled, done: cancelled ? false : l.done }))
}

export function applyProposal(courseId: string, lessons: ProposedLesson[], newId: () => string): Change {
  return (data) => lessons.reduce((d, p) => addActivity(courseId, p.date, { ...p.activity, id: newId() })(d), data)
}

/**
 * Per "Annulla": i record cambiati da allora tornano com'erano. Ricevono un updatedAt nuovo,
 * così l'annullamento vince anche sugli altri dispositivi che hanno già la modifica.
 */
export function undoTo(before: ProfclickData): Change {
  return (current) => {
    let next = current
    for (const collection of COLLECTIONS) {
      const was = before[collection] as Record<string, Stamped>
      const is = current[collection] as Record<string, Stamped>
      for (const key of new Set([...Object.keys(was), ...Object.keys(is)])) {
        if (was[key] === is[key]) continue
        next = was[key] ? put(next, collection, key, was[key] as never) : remove(next, collection, [key])
      }
    }
    if (before.year && before.year !== current.year) next = setYear(before.year)(next)
    return next
  }
}

// --- Da preparare -----------------------------------------------------------------------

export function togglePrep(courseId: string, itemId: string): Change {
  return (data) => {
    const course = data.courses[courseId]
    if (!course) return data
    return put(data, 'courses', courseId, { ...course, prep: course.prep.map((p) => (p.id === itemId ? { ...p, done: !p.done } : p)) })
  }
}

// --- Riunioni ---------------------------------------------------------------------------

export function saveMeeting(meeting: Omit<Meeting, 'updatedAt'>): Change {
  return (data) => put(data, 'meetings', meeting.id, { ...meeting, updatedAt: 0 })
}

export function deleteMeeting(meetingId: string): Change {
  return (data) => remove(data, 'meetings', [meetingId])
}

export function toggleMeetingPrep(meetingId: string, itemId: string): Change {
  return (data) => {
    const meeting = data.meetings[meetingId]
    if (!meeting) return data
    return put(data, 'meetings', meetingId, { ...meeting, prep: meeting.prep.map((p) => (p.id === itemId ? { ...p, done: !p.done } : p)) })
  }
}

// --- Note -----------------------------------------------------------------------------

export function saveNote(note: Omit<Note, 'updatedAt'>): Change {
  return (data) => put(data, 'notes', note.id, { ...note, updatedAt: 0 })
}

export function deleteNote(noteId: string): Change {
  return (data) => remove(data, 'notes', [noteId])
}

// --- Anni precedenti --------------------------------------------------------------------

/**
 * Il programma di un'altra classe, di quest'anno o di un anno passato, copiato in coda a
 * quello della classe: argomenti, sotto-punti e valutazioni previste, tutto da fare.
 */
export function copyProgram(source: ProgramSource, courseId: string, newId: () => string): Change {
  return (data) => {
    if (!data.courses[courseId] || !data.year) return data
    const first = Math.max(-1, ...Object.values(data.topics).filter((t) => t.courseId === courseId).map((t) => t.order)) + 1
    const periods = data.year.periods
    return [...source.topics]
      .sort((a, b) => a.order - b.order)
      .reduce(
        (d, t, i) =>
          saveTopic({
            ...t,
            id: newId(),
            courseId,
            periodId: matchPeriod(t.periodId, source.periods, periods),
            assessments: t.assessments.map((a) => ({ ...a, id: newId(), done: false })),
            completed: false,
            order: first + i,
          })(d),
        data,
      )
  }
}

/**
 * Fine anno: classi e programmi vanno nell'archivio, lezioni, verifiche e riunioni si
 * tolgono, e si parte con l'anno nuovo. Le classi nuove si creano da capo (cambiano ogni
 * anno), copiando il programma da quelle archiviate. Le note restano, senza più le classi.
 */
export function startNewYear(year: Omit<SchoolYear, 'updatedAt'>): Change {
  return (data) => {
    const snapshot = archivedYear(data)
    let next = snapshot ? put(data, 'archive', snapshot.label, { ...snapshot, updatedAt: 0 }) : data
    for (const collection of ['courses', 'topics', 'lessons', 'meetings'] as const) next = remove(next, collection, Object.keys(next[collection]))
    for (const note of Object.values(next.notes)) if (note.courseIds.length) next = saveNote({ ...note, courseIds: [] })(next)
    return setYear(year)(next)
  }
}

export function deleteArchivedYear(label: string): Change {
  return (data) => remove(data, 'archive', [label])
}
