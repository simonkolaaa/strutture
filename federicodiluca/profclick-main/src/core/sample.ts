// Dati di esempio: due classi di informatica con il loro programma, le valutazioni previste,
// un piano già proposto e due riunioni. Servono a provare ProfClick senza inserire niente e per gli
// screenshot.

import { applyProposal, markDone, saveCourse, saveMeeting, saveNote, saveTopics, setActivityStep, setYear } from './actions'
import { courseSlots } from './calendar'
import { addDays, type ISODate, startOfWeek } from './dates'
import { defaultPrep } from './meetings'
import { type Course, emptyData, type GradeType, type MeetingKind, type ProfclickData } from './model'
import { proposeWeeks } from './proposal'
import { defaultSchoolYear, schoolYearStart } from './schoolYear'
import { activitySteps } from './steps'

/** [titolo, periodo, sotto-punti, valutazioni previste come [tipo, peso, dettaglio]] */
type SampleTopic = [string, 1 | 2, string[], [GradeType, number, string?][]]

const rules = { perPeriod: null, required: ['scritto', 'teorico', 'pratico'] as GradeType[], minorWeight: 30 }

const PROGRAMS: { course: Omit<Course, 'updatedAt'>; topics: SampleTopic[] }[] = [
  {
    course: {
      id: 'demo-3a',
      className: '3A',
      subject: 'Informatica',
      color: 0,
      schedule: [
        { day: 1, hours: 2, lab: false },
        { day: 3, hours: 1, lab: false },
        { day: 5, hours: 2, lab: true },
      ],
      pastSchedules: [],
      rules,
      civics: { p1: 3 },
      periodNotes: { p1: 'Rossi deve recuperare l\'orale di settembre.' },
      prep: [
        { id: 'demo-3a-p1', text: 'Esercizi di laboratorio su selezione e cicli', topicId: 'demo-3a-t2', done: false },
        { id: 'demo-3a-p2', text: 'Slide sugli array', topicId: 'demo-3a-t3', done: false },
      ],
      order: 0,
    },
    topics: [
      ['Algoritmi e diagrammi di flusso', 1, ['Problemi e algoritmi', 'Flowgorithm'], [['pratico', 100, 'Flowgorithm']]],
      ['Linguaggio C: variabili e tipi', 1, ['Compilazione', 'printf e scanf'], [['scritto', 100]]],
      ['Selezione e iterazione', 1, ['if / switch', 'while, do-while, for'], [['pratico', 30, 'esercizi in laboratorio'], ['teorico', 100]]],
      ['Array', 1, ['Ricerca e ordinamento'], [['scritto', 100]]],
      ['Funzioni', 2, ['Parametri per valore e per indirizzo'], [['scritto', 100], ['pratico', 100]]],
      ['Stringhe', 2, [], [['teorico', 100]]],
      ['Struct e file', 2, [], [['pratico', 100, 'con orale']]],
      ['Prova parallela', 2, [], [['scritto', 100, 'prova parallela']]],
    ],
  },
  {
    course: {
      id: 'demo-4b',
      className: '4B',
      subject: 'Informatica',
      color: 2,
      schedule: [
        { day: 2, hours: 2, lab: true },
        { day: 4, hours: 2, lab: false },
        { day: 6, hours: 2, lab: true },
      ],
      pastSchedules: [],
      rules,
      civics: { p2: 4 },
      periodNotes: {},
      prep: [],
      order: 1,
    },
    topics: [
      ['Classi e oggetti in Java', 1, ['Incapsulamento', 'Costruttori'], [['scritto', 100], ['pratico', 100]]],
      ['Ereditarietà e polimorfismo', 1, [], [['teorico', 100]]],
      ['Collezioni', 1, ['ArrayList', 'HashMap'], [['pratico', 30, 'flipped classroom']]],
      ['Eccezioni e file', 2, [], [['scritto', 100]]],
      ['Interfacce grafiche', 2, ['Swing / JavaFX'], [['pratico', 75, 'progetto con orale']]],
    ],
  },
]

export function sampleData(today: ISODate): ProfclickData {
  const year = defaultSchoolYear(schoolYearStart(today))
  let data = setYear(year)(emptyData())
  for (const { course, topics } of PROGRAMS) {
    data = saveCourse(course)(data)
    data = saveTopics(
      topics.map(([title, period, points, assessments], i) => ({
        id: `${course.id}-t${i}`,
        courseId: course.id,
        title,
        ...(points.length === 0 && /^prova/i.test(title) && { assessmentOnly: true }),
        points,
        periodId: `p${period}`,
        assessments: assessments.map(([type, weight, text], j) => ({ id: `${course.id}-t${i}-a${j}`, type, weight, text: text ?? '', done: false })),
        completed: false,
        order: i,
      })),
    )(data)
  }

  // Il piano si fa come lo farebbe il docente (ADR 0020): un argomento alla volta, su due o tre
  // settimane, dall'inizio dell'anno fino a tre settimane da oggi. Il resto è da pianificare.
  let n = 0
  const horizon = addDays(today, 21)
  for (const { course } of PROGRAMS) {
    const topics = Object.values(data.topics)
      .filter((t) => t.courseId === course.id)
      .sort((a, b) => a.order - b.order)
    for (const period of data.year!.periods) {
      for (const topic of topics.filter((t) => t.periodId === period.id)) {
        const proposal = proposeWeeks(data, data.courses[course.id], period, [topic.id], topic.points.length > 1 ? 3 : 2, period.start)
        if (proposal.lessons.length === 0 || proposal.from > horizon) break
        data = applyProposal(course.id, proposal.lessons, () => `demo-a${n++}`)(data)
      }
    }
    const past = courseSlots(data, data.courses[course.id], undefined, today).filter((s) => s.date < today && s.lesson)
    data = markDone(past)(data)
    // Quello che c'era da fare dopo le lezioni di più di una settimana fa è fatto; resta quello recente.
    for (const slot of past.filter((s) => s.date < addDays(today, -7))) {
      for (const activity of slot.lesson!.activities) {
        for (const step of activitySteps(activity)) data = setActivityStep(course.id, slot.date, activity.id, step.key, { done: true })(data)
      }
    }
  }

  // Riunioni di tutti i tipi: una passata, alcune nelle prossime settimane, lo scrutinio
  // a fine periodo. Le voci sono quelle proposte per tipo e ruolo (coordinatore, verbale).
  const monday = startOfWeek(today)
  const scrutinio = addDays(startOfWeek(data.year!.periods[0].end), 7)
  const meetings: [MeetingKind, ISODate, string, string | null, string, { coordinator: boolean; minutes: boolean }, string][] = [
    ['dipartimento', addDays(monday, -5), '14:30', null, '', { coordinator: false, minutes: true }, 'Prove parallele: scritto comune per le terze a fine gennaio.'],
    ['glo', addDays(monday, 10), '14:00', '4B', '', { coordinator: false, minutes: false }, ''],
    ['cdc', addDays(monday, 15), '15:00', '3A', '', { coordinator: true, minutes: false }, ''],
    ['cdc', addDays(monday, 15), '16:00', '4B', '', { coordinator: false, minutes: true }, ''],
    ['collegio', addDays(monday, 17), '16:30', null, '', { coordinator: false, minutes: false }, ''],
    ['corso', addDays(monday, 24), '15:00', null, 'Corso sulla sicurezza', { coordinator: false, minutes: false }, ''],
    ['scrutinio', scrutinio, '15:00', '3A', '', { coordinator: true, minutes: false }, ''],
    ['scrutinio', scrutinio, '16:00', '4B', '', { coordinator: false, minutes: true }, ''],
  ]
  meetings.forEach(([kind, date, time, className, title, roles, notes], i) => {
    const id = `demo-m${i + 1}`
    // Quella passata è stata preparata; il verbale è ancora da scrivere.
    const prep = defaultPrep(kind, roles, ((j) => () => `${id}-p${j++}`)(0)).map((p) => ({ ...p, done: date < today && !p.after }))
    data = saveMeeting({ id, kind, date, time, className, title, ...roles, prep, notes })(data)
  })

  // Due note in bacheca: gli appunti della 3A e una generale, fissata in cima.
  data = saveNote({
    id: 'demo-n1',
    title: 'Appunti 3A',
    text: "Laboratorio il venerdì con l'ITP.\nDue ragazzi con PDP: verifiche con mappa concettuale.",
    courseIds: ['demo-3a'],
    pinned: false,
    order: 0,
  })(data)
  data = saveNote({
    id: 'demo-n2',
    title: 'Slide e laboratori',
    text: '[x] Slide sugli algoritmi\n[ ] Laboratorio su Arduino\n[ ] Rivedere i progetti di gruppo\n\nPer il prossimo anno:\n- un laboratorio sui database',
    courseIds: [],
    pinned: true,
    order: -1,
  })(data)
  return data
}
