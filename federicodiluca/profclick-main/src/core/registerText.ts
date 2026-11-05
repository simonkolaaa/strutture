// Gli argomenti delle lezioni come testo da incollare nel registro elettronico. Nessun
// collegamento al registro (non ci sono API pubbliche e servirebbero le credenziali della
// scuola): una riga per lezione, pronta per il campo "Argomento" o "Attività svolta".

import type { LessonSlot } from './calendar'
import { formatDay, formatLong, startOfWeek } from './dates'
import { type Activity, courseLabel, GRADE_LABELS, KIND_LABELS, type ProfclickData } from './model'

const ASSESSMENT_NAMES: Record<keyof typeof GRADE_LABELS, string> = {
  scritto: 'Verifica scritta',
  teorico: 'Interrogazione',
  pratico: 'Prova pratica',
}

/** "Spiegazione: Reti, modello ISO/OSI". Sul registro il peso dei voti minori non serve. */
function activityText(data: ProfclickData, activity: Activity): string {
  const a = activity.assessment
  const label =
    activity.kind === 'verifica' && a ? `${ASSESSMENT_NAMES[a.type]}${a.makeup ? ' di recupero' : a.continues ? ' (seconda parte)' : ''}` : KIND_LABELS[activity.kind]
  const topics = activity.topicIds.map((id) => data.topics[id]?.title).filter(Boolean)
  const detail = [topics.join(', '), activity.text.trim()].filter(Boolean).join(', ')
  return detail ? `${label}: ${detail}` : label
}

/** La riga del registro di una lezione, o '' se annullata o senza niente in programma. */
export function lessonRegisterText(data: ProfclickData, slot: Pick<LessonSlot, 'lesson'>): string {
  const lesson = slot.lesson
  if (!lesson || lesson.cancelled || lesson.activities.length === 0) return ''
  return `${lesson.activities.map((a) => activityText(data, a)).join('. ')}.`
}

export type RegisterGrouping = 'giorno' | 'classe'

/** Quando cade una lezione: il giorno, o "lezione 2 della settimana del 5 ottobre" se non ha un giorno fisso. */
function when(slot: LessonSlot): string {
  return slot.floating ? `Lezione ${slot.index} della settimana del ${formatDay(startOfWeek(slot.date))}` : formatLong(slot.date)
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Le lezioni indicate, raggruppate per giorno (come si compila il registro giorno per giorno)
 * o per classe (come chi recupera il registro di una classe). Restano fuori le lezioni
 * annullate o senza niente in programma.
 */
export function registerText(data: ProfclickData, slots: LessonSlot[], grouping: RegisterGrouping): string {
  const rows = slots
    .map((slot) => ({ slot, text: lessonRegisterText(data, slot), course: data.courses[slot.courseId] }))
    .filter((r) => r.text && r.course)
  // Per classe: le classi nel loro ordine, e in ognuna le lezioni per data.
  if (grouping === 'classe') rows.sort((x, y) => x.course.order - y.course.order || x.slot.date.localeCompare(y.slot.date))
  const groups = new Map<string, string[]>()
  for (const { slot, text, course } of rows) {
    const [title, line] = grouping === 'giorno' ? [capitalize(when(slot)), `${courseLabel(course)}: ${text}`] : [courseLabel(course), `${capitalize(when(slot))}: ${text}`]
    groups.set(title, [...(groups.get(title) ?? []), line])
  }
  return [...groups].map(([title, lines]) => [title, ...lines].join('\n')).join('\n\n')
}
