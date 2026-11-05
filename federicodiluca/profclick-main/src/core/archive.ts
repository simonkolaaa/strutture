// Gli anni conclusi (ADR 0012). A fine anno classi e programmi passano nell'archivio, senza
// lezioni né riunioni; da lì, come dalle classi di quest'anno, si copia il programma in una
// classe nuova. Un programma si scrive una volta e si riusa.

import { sortedCourses } from './calendar'
import { defaultSchoolYear, type PeriodPreset } from './schoolYear'
import type { ProgramTextInput } from './programText'
import { type ArchivedCourse, type ArchivedTopic, type ArchivedYear, type Course, courseLabel, type Period, type ProfclickData, type SchoolYear, type Topic } from './model'
import { courseTopics, topicProgress } from './progress'

/** Un argomento staccato dalla sua classe: si può archiviare o copiare in un'altra. */
function detached(topic: Topic): ArchivedTopic {
  const copy: ArchivedTopic & Partial<Pick<Topic, 'courseId' | 'updatedAt'>> = { ...topic }
  delete copy.courseId
  delete copy.updatedAt
  return copy
}

/** L'anno in corso fotografato per l'archivio: ogni argomento ricorda se era svolto. */
export function archivedYear(data: ProfclickData): Omit<ArchivedYear, 'updatedAt'> | null {
  if (!data.year) return null
  return {
    label: data.year.label,
    periods: data.year.periods,
    courses: sortedCourses(data).map((course) => ({
      id: course.id,
      className: course.className,
      subject: course.subject,
      color: course.color,
      topics: topicProgress(data, course).map(({ topic, status }) => ({ ...detached(topic), completed: status === 'fatto' })),
    })),
  }
}

/** L'anno dopo, con gli stessi periodi: quadrimestri o trimestre e pentamestre. */
export function nextSchoolYear(year: SchoolYear): SchoolYear {
  const startYear = Number(year.start.slice(0, 4)) + 1
  const preset: PeriodPreset = year.periods[0]?.end.slice(5, 7) === '12' ? 'trimestre-pentamestre' : 'quadrimestri'
  return defaultSchoolYear(startYear, preset)
}

/** Un programma da cui copiare: una classe di quest'anno o di un anno archiviato. */
export interface ProgramSource {
  key: string
  label: string
  subject: string
  /** null per quest'anno. */
  yearLabel: string | null
  periods: Period[]
  topics: ArchivedTopic[]
}

/** I programmi da cui copiare: prima la stessa materia, poi quest'anno prima degli anni passati. */
export function programSources(data: ProfclickData, targetCourseId: string): ProgramSource[] {
  const target = data.courses[targetCourseId]
  const current: ProgramSource[] = sortedCourses(data)
    .filter((c) => c.id !== targetCourseId)
    .map((c) => ({
      key: c.id,
      label: courseLabel(c),
      subject: c.subject,
      yearLabel: null,
      periods: data.year?.periods ?? [],
      topics: courseTopics(data, c.id).map(detached),
    }))
  const past: ProgramSource[] = Object.values(data.archive)
    .sort((a, b) => b.label.localeCompare(a.label))
    .flatMap((y) =>
      y.courses.map((c) => ({
        key: `${y.label}:${c.id}`,
        label: c.subject ? `${c.className} · ${c.subject}` : c.className,
        subject: c.subject,
        yearLabel: y.label,
        periods: y.periods,
        topics: c.topics,
      })),
    )
  const sameSubject = (s: ProgramSource) => (target && s.subject.trim().toLowerCase() === target.subject.trim().toLowerCase() ? 0 : 1)
  return [...current, ...past].filter((s) => s.topics.length > 0).sort((a, b) => sameSubject(a) - sameSubject(b))
}

/** Il periodo corrispondente: il primo nel primo, il secondo nel secondo, anche se cambiano le date. */
export function matchPeriod(periodId: string | null, from: Period[], to: Period[]): string | null {
  const index = from.findIndex((p) => p.id === periodId)
  if (index < 0 || to.length === 0) return null
  return to[Math.min(index, to.length - 1)].id
}

/** Gli argomenti di una classe di quest'anno con il loro stato, pronti per il testo del programma. */
export function currentProgram(data: ProfclickData, course: Course): ProgramTextInput {
  return {
    courseLabel: courseLabel(course),
    yearLabel: data.year?.label ?? '',
    periods: data.year?.periods ?? [],
    topics: topicProgress(data, course).map(({ topic, status }) => ({ topic: detached(topic), status })),
  }
}

/** Lo stesso per una classe archiviata: lo stato è quello di fine anno. */
export function archivedProgram(year: ArchivedYear, course: ArchivedCourse): ProgramTextInput {
  return {
    courseLabel: course.subject ? `${course.className} · ${course.subject}` : course.className,
    yearLabel: year.label,
    periods: year.periods,
    topics: course.topics.map((topic) => ({ topic, status: topic.completed ? 'fatto' : 'da-pianificare' })),
  }
}
