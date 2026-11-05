// Il materiale da preparare con la sua scadenza: la prima lezione, da oggi, in cui compare
// l'argomento a cui serve. È quello che una lista di Keep non può sapere.

import { courseSlots, sortedCourses } from './calendar'
import type { ISODate } from './dates'
import type { Course, PrepItem, ProfclickData } from './model'

export interface PrepDue {
  course: Course
  item: PrepItem
  /** Quando serve; null se l'argomento non è ancora in calendario (o manca). */
  due: ISODate | null
}

/** Tutte le voci di una classe, fatte o no, con quando servono. */
export function coursePrep(data: ProfclickData, course: Course, today: ISODate): PrepDue[] {
  const items = course.prep.filter((p) => p.text.trim())
  if (items.length === 0) return []
  const slots = courseSlots(data, course, today).filter((s) => !s.lesson?.cancelled)
  return items.map((item) => {
    const slot = item.topicId ? slots.find((s) => s.lesson?.activities.some((a) => a.topicIds.includes(item.topicId!))) : undefined
    return { course, item, due: slot?.date ?? null }
  })
}

export function openPrep(data: ProfclickData, today: ISODate): PrepDue[] {
  const result = sortedCourses(data).flatMap((course) => coursePrep(data, course, today).filter((p) => !p.item.done))
  // Prima quello che serve prima; senza data in fondo, nell'ordine delle classi.
  return result.sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))
}
