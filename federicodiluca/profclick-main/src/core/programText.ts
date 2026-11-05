// Il programma come testo da incollare nei documenti della scuola: il programma svolto a
// fine anno, dagli argomenti fatti, o il piano di lavoro a inizio anno, da quelli previsti.
// Niente modelli per scuola: un testo pulito si incolla in qualsiasi modello.

import type { ArchivedTopic, Period } from './model'
import type { TopicProgress } from './progress'

export type ProgramTextKind = 'svolto' | 'piano'

export const PROGRAM_TEXT_LABELS: Record<ProgramTextKind, string> = {
  svolto: 'Programma svolto',
  piano: 'Piano di lavoro',
}

export interface ProgramTextInput {
  /** "3A · Informatica" */
  courseLabel: string
  yearLabel: string
  periods: Period[]
  topics: { topic: ArchivedTopic; status: TopicProgress['status'] }[]
}

/** Una voce che è solo una valutazione (es. prova parallela) non è programma. */
function isContent(topic: ArchivedTopic): boolean {
  return !topic.assessmentOnly
}

function block(entry: ProgramTextInput['topics'][number], kind: ProgramTextKind): string[] {
  const { topic, status } = entry
  const extra = kind === 'svolto' && status !== 'fatto' ? ' (svolto in parte)' : ''
  return [`${topic.title}${extra}`, ...topic.points.map((p) => `- ${p}`)]
}

export function programText(input: ProgramTextInput, kind: ProgramTextKind, byPeriod: boolean): string {
  const topics = [...input.topics]
    .filter((t) => isContent(t.topic))
    .filter((t) => kind === 'piano' || t.status === 'fatto' || t.status === 'in-corso')
    .sort((a, b) => a.topic.order - b.topic.order)
  const header = `${PROGRAM_TEXT_LABELS[kind]} · ${input.courseLabel} · a.s. ${input.yearLabel}`
  if (topics.length === 0) return header

  const sections: string[][] = []
  if (byPeriod && input.periods.length > 1) {
    for (const period of input.periods) {
      const inPeriod = topics.filter((t) => t.topic.periodId === period.id)
      if (inPeriod.length) sections.push([period.name, ...inPeriod.flatMap((t) => [...block(t, kind), ''])])
    }
    const other = topics.filter((t) => !input.periods.some((p) => p.id === t.topic.periodId))
    if (other.length) sections.push(['Senza periodo', ...other.flatMap((t) => [...block(t, kind), ''])])
  } else sections.push(topics.flatMap((t) => [...block(t, kind), '']))

  return [header, '', ...sections.flatMap((s) => [...s])].join('\n').trimEnd()
}
