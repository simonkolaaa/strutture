// Tutto quello da fare, in un posto solo (ADR 0017). Ogni attività in programma porta con sé
// i suoi passi (ADR 0022): prima il materiale da preparare, dopo, per le valutazioni, la
// correzione, la riconsegna e i voti sul registro. Si aggiungono le voci scritte nelle classi
// e quelle delle riunioni.

import { type Change, setActivityStep, toggleMeetingPrep, togglePrep } from './actions'
import { courseSlots, sortedCourses } from './calendar'
import { type ISODate, startOfWeek } from './dates'
import { sortedMeetings } from './meetings'
import type { Activity, ActivityStep, Course, Meeting, MeetingPrep, PrepItem, ProfclickData } from './model'
import { coursePrep } from './prep'
import { activitySteps, defaultSteps, isAfter, STEPS_SINCE } from './steps'

export type TodoSource =
  | { kind: 'activity'; course: Course; activity: Activity; step: ActivityStep; floating: boolean; index: number; hours: number; start?: number }
  | { kind: 'prep'; course: Course; item: PrepItem }
  | { kind: 'meeting'; meeting: Meeting; item: MeetingPrep }

export interface Todo {
  id: string
  /** Quando serve; null per una voce della classe con l'argomento non ancora in calendario. */
  due: ISODate | null
  done: boolean
  source: TodoSource
}

/**
 * Un'interrogazione, o la seconda parte di una valutazione già iniziata, non chiede
 * materiale: il resto sì, dalla spiegazione alla verifica scritta. Il recupero di uno
 * scritto o di una prova pratica vuole una prova nuova.
 */
export function needsPrep(activity: Activity): boolean {
  return defaultSteps(activity).some((k) => !isAfter(k))
}

/**
 * Le cose da preparare per le lezioni e le riunioni da oggi fino a `until`, comprese quelle
 * già pronte (restano spuntate finché la lezione non passa), quelle da chiudere dopo lezioni e
 * riunioni passate, più le voci delle classi ancora senza data. In ordine di scadenza; nello
 * stesso giorno, nell'ordine delle classi.
 */
export function todos(data: ProfclickData, today: ISODate, until: ISODate): Todo[] {
  const result: Todo[] = []
  const week = startOfWeek(today)
  for (const course of sortedCourses(data)) {
    for (const slot of courseSlots(data, course, undefined, until)) {
      const lesson = slot.lesson
      if (!lesson || lesson.cancelled) continue
      const steps = lesson.activities.flatMap((activity) =>
        activitySteps(activity)
          // Prima: finché la lezione non è fatta; quello che serviva, è servito.
          // Dopo: le valutazioni di prima dei passi non li chiedono.
          .filter((step) => (isAfter(step.key) ? Boolean(activity.steps) || slot.date >= STEPS_SINCE : slot.date >= today && !lesson.done))
          .map((step) => ({ activity, step })),
      )
      // Quello dopo una lezione passata resta tutto, spuntato compreso, finché non è chiuso
      // del tutto ed è di una settimana prima: così si vede cosa si è fatto, e si toglie la spunta.
      const keepAfter = slot.date >= week || steps.some(({ step }) => isAfter(step.key) && !step.done)
      for (const { activity, step } of steps) {
        if (isAfter(step.key) && !keepAfter) continue
        result.push({
          id: `${activity.id}:${step.key}`,
          due: slot.date,
          done: step.done,
          source: { kind: 'activity', course, activity, step, floating: slot.floating, index: slot.index, hours: slot.hours, start: slot.start },
        })
      }
    }
  }
  for (const course of sortedCourses(data)) {
    for (const { item, due } of coursePrep(data, course, today)) {
      if (due ? due <= until : !item.done) result.push({ id: item.id, due, done: item.done, source: { kind: 'prep', course, item } })
    }
  }
  // Le cose da fare dopo una riunione (il verbale) restano finché non sono fatte, anche passata la riunione.
  for (const meeting of sortedMeetings(data).filter((m) => m.date <= until)) {
    // Come per le lezioni: da preparare finché la riunione non c'è stata; dopo, tutto finché
    // non è chiuso del tutto ed è di una settimana prima.
    const keepAfter = meeting.date >= week || meeting.prep.some((p) => p.after && p.text.trim() && !p.done)
    const show = (p: MeetingPrep) => (p.after ? keepAfter : meeting.date >= today)
    for (const item of meeting.prep.filter((p) => p.text.trim() && show(p))) {
      result.push({ id: item.id, due: meeting.date, done: item.done, source: { kind: 'meeting', meeting, item } })
    }
  }
  return result.sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999') || dayOrder(a) - dayOrder(b))
}

/** Una cosa da fare dopo (correggere, il registro, il verbale), non da preparare. */
export function isFollowUp(todo: Todo): boolean {
  const s = todo.source
  return s.kind === 'activity' ? isAfter(s.step.key) : s.kind === 'meeting' && Boolean(s.item.after)
}

/** Nel filtro della settimana le riunioni si spengono come una classe, con questa chiave. */
export const MEETINGS = 'riunioni'

/**
 * Da fare dopo una lezione o una riunione che deve ancora venire: si vede per tempo, a cose
 * fatte, ma non è ancora da fare e non conta tra le cose in sospeso.
 */
export function isLater(todo: Todo, today: ISODate): boolean {
  return isFollowUp(todo) && todo.due !== null && todo.due > today
}

/** La chiave nel filtro della settimana: la classe, o le riunioni. */
export function todoFilterKey(todo: Todo): string {
  return todo.source.kind === 'meeting' ? MEETINGS : todo.source.course.id
}

/**
 * Nello stesso giorno, l'ordine della giornata: le lezioni per ora d'inizio, come nella
 * settimana (senza ora, dopo, nell'ordine delle classi), poi le voci delle classi, poi le
 * riunioni del pomeriggio per orario.
 */
function dayOrder(todo: Todo): number {
  const s = todo.source
  if (s.kind === 'activity') return s.start ?? 99
  if (s.kind === 'prep') return 100
  const [h, m] = s.meeting.time.split(':').map(Number)
  return 200 + (s.meeting.time ? h * 60 + m : 24 * 60)
}

/** La classe a cui serve, se è una voce di classe: per il filtro delle classi. */
export function todoCourse(todo: Todo): Course | null {
  return todo.source.kind === 'meeting' ? null : todo.source.course
}

/** Pronto, o di nuovo da preparare: una voce cambia stato. */
export function toggleTodo(todo: Todo): Change {
  const s = todo.source
  if (s.kind === 'activity') return setActivityStep(s.course.id, todo.due!, s.activity.id, s.step.key, { done: !todo.done })
  if (s.kind === 'prep') return togglePrep(s.course.id, s.item.id)
  return toggleMeetingPrep(s.meeting.id, s.item.id)
}

/** Tante voci insieme, tutte pronte o tutte da preparare: si toccano solo quelle da cambiare. */
export function setTodosDone(list: Todo[], done: boolean): Change {
  return (data) => list.filter((t) => t.done !== done).reduce((d, t) => toggleTodo(t)(d), data)
}
