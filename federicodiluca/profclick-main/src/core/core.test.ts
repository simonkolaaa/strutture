import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addActivity, addExtraLesson, activityRepeats, cancelAndShift, mergeAssessment, separateAssessment, setRepeats, toggleRepeat, updateActivity, deleteLesson, moveLesson, setCancelled, changeSchedule, copyProgram, deleteArchivedYear, deleteCourse, deleteMeeting, deleteNote, saveCourse, saveMeeting, saveNote, saveTopics, setActivityReady, setActivityStep, setDone, setTopicCompleted, setYear, startNewYear, toggleMeetingPrep, undoTo } from './actions'
import { archivedProgram, currentProgram, nextSchoolYear, programSources } from './archive'
import { programText } from './programText'
import { registerText } from './registerText'
import { cellKey, timetable } from './timetable'
import { courseSlots, floatingSlotsOfWeek, schoolWeeks, slotsOn, weekToShow } from './calendar'
import { easter, startOfWeek, weekday } from './dates'
import { nextGrades, periodGrades, placedAssessments, programAssessments, targetGrades } from './grading'
import { parseProgram } from './importText'
import { classSummary, defaultPrep, meetingPeriod, openMeetingPrep, pendingAfter, summaryText, updateDefaultPrep, wasCoordinator, wroteMinutes } from './meetings'
import { mergeData, sameData } from './merge'
import { inlineParts, noteChecks, noteCourses, noteLines, sortedNotes, toggleNoteLine, topOrder } from './notes'
import { type Course, emptyData, isDone, lessonKey, type Meeting, meetingLabel, normalizeData, type ProfclickData, sameSchedule, type Topic } from './model'
import { topicProgress } from './progress'
import { isFollowUp, isLater, needsPrep, setTodosDone, todos } from './todo'
import { activitySteps, customStep, defaultSteps, isAfter, stepLabel } from './steps'
import { assessmentTypes, proposeWeeks, shareLessons } from './proposal'
import { sampleData } from './sample'
import { defaultSchoolYear } from './schoolYear'

const course: Omit<Course, 'updatedAt'> = {
  id: 'c1',
  className: '3A',
  subject: 'Informatica',
  color: 0,
  schedule: [
    { day: 1, hours: 2, lab: false },
    { day: 3, hours: 1, lab: false },
    { day: 5, hours: 2, lab: true },
  ],
  pastSchedules: [],
  rules: { perPeriod: null, required: ['scritto', 'teorico', 'pratico'], minorWeight: 50 },
  civics: {},
  periodNotes: {},
  prep: [],
  order: 0,
}

const topic = (id: string, title: string, extra: Partial<Topic> = {}): Omit<Topic, 'updatedAt'> => ({
  id,
  courseId: 'c1',
  title,
  periodId: 'p1',
  points: [],
  assessments: [],
  completed: false,
  order: Number(id.slice(1)),
  ...extra,
})

function base(c: Omit<Course, 'updatedAt'> = course): ProfclickData {
  let data = setYear(defaultSchoolYear(2026))(emptyData())
  data = saveCourse(c)(data)
  return saveTopics([topic('t1', 'Algoritmi'), topic('t2', 'Array')])(data)
}

const verifica = (id: string, type: 'scritto' | 'teorico' | 'pratico', weight = 100, continues = false) => ({
  id,
  kind: 'verifica' as const,
  topicIds: [],
  text: '',
  assessment: { type, weight, continues },
})

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-29T10:00:00Z'))
})
afterEach(() => vi.useRealTimers())

describe('date', () => {
  it('calcola la Pasqua', () => {
    expect(easter(2027)).toBe('2027-03-28')
    expect(easter(2026)).toBe('2026-04-05')
  })
  it('giorni della settimana e lunedì', () => {
    expect(weekday('2026-09-28')).toBe(1)
    expect(weekday('2026-10-04')).toBe(7)
    expect(startOfWeek('2026-10-03')).toBe('2026-09-28')
  })
})

describe('anno scolastico e lezioni', () => {
  it('propone quadrimestri e salta le festività', () => {
    const year = defaultSchoolYear(2026)
    expect(year.start).toBe('2026-09-14')
    expect(year.periods.map((p) => p.end)).toEqual(['2027-01-31', '2027-06-08'])
    const data = base()
    const slots = courseSlots(data, data.courses.c1, '2026-12-21', '2027-01-10')
    // Lun 21, mer 23 è vacanza: restano lun 21 e poi niente fino all'8 gennaio (venerdì).
    expect(slots.map((s) => s.date)).toEqual(['2026-12-21', '2027-01-08'])
    expect(slots[1].lab).toBe(true)
  })

  it('senza giorni: le lezioni si mettono in ordine nella settimana', () => {
    const data = base({
      ...course,
      schedule: [
        { day: null, hours: 2, lab: true },
        { day: null, hours: 1, lab: false },
      ],
    })
    const week = floatingSlotsOfWeek(data, '2026-09-28')
    expect(week.map((s) => [s.index, s.hours, s.lab])).toEqual([
      [1, 2, true],
      [2, 1, false],
    ])
    // Una festività in settimana toglie una lezione: l'8 dicembre è martedì, la seconda.
    expect(floatingSlotsOfWeek(data, '2026-12-07').map((s) => s.index)).toEqual([1])
  })

  it("con l'ora d'inizio la giornata va in ordine, e cambiarla non sposta il piano", () => {
    let data = base()
    data = saveCourse({ ...course, id: 'c2', className: '4B', order: 1, schedule: [{ day: 1, hours: 1, lab: false, start: 1 }] })(data)
    // La classe senza ora va dopo quella che ce l'ha.
    expect(slotsOn(data, '2026-09-28').map((s) => s.courseId)).toEqual(['c2', 'c1'])
    data = saveCourse({ ...course, schedule: [{ day: 1, hours: 2, lab: false, start: 3 }, ...course.schedule.slice(1)] })(data)
    data = saveCourse({ ...course, id: 'c2', className: '4B', order: 1, schedule: [{ day: 1, hours: 1, lab: false, start: 5 }] })(data)
    expect(slotsOn(data, '2026-09-28').map((s) => [s.courseId, s.start])).toEqual([
      ['c1', 3],
      ['c2', 5],
    ])
    expect(sameSchedule(course.schedule, data.courses.c1.schedule)).toBe(true)
    expect(normalizeData(data).courses.c1.schedule[0]).toEqual({ day: 1, hours: 2, lab: false, start: 3 })
  })

  it('legge i dati delle prime versioni', () => {
    const old = { courses: { c: { id: 'c', schedule: { 1: 2, 4: 1 }, rules: {} } }, lessons: { x: { activities: [{ id: 'a', kind: 'verifica', assessment: { type: 'scritto', minor: true } }] } } }
    const data = normalizeData(old)
    expect(data.courses.c.schedule).toEqual([
      { day: 1, hours: 2, lab: false },
      { day: 4, hours: 1, lab: false },
    ])
    expect(data.lessons.x.activities[0].assessment).toEqual({ type: 'scritto', weight: 50, continues: false })
  })
})

describe('voti', () => {
  it('uno per ogni ora settimanale, almeno quanti i tipi richiesti', () => {
    expect(targetGrades({ ...course, updatedAt: 0 })).toBe(5)
    expect(targetGrades({ ...course, schedule: [{ day: 1, hours: 2, lab: false }], updatedAt: 0 })).toBe(3)
    expect(targetGrades({ ...course, rules: { ...course.rules, perPeriod: 4 }, updatedAt: 0 })).toBe(4)
  })

  it('conta le valutazioni piene, esclude minori e prosecuzioni', () => {
    let data = base()
    data = addActivity('c1', '2026-10-05', verifica('a', 'scritto'))(data)
    data = addActivity('c1', '2026-10-07', verifica('b', 'teorico'))(data)
    data = addActivity('c1', '2026-10-09', verifica('c', 'teorico', 100, true))(data)
    data = addActivity('c1', '2026-10-12', verifica('d', 'scritto', 30))(data)
    data = setDone('c1', '2026-10-05', true)(data)
    const g = periodGrades(data, data.courses.c1, data.year!.periods[0], '2026-09-29')
    expect(g.full).toHaveLength(2)
    expect(g.minor).toHaveLength(1)
    expect(g.done).toBe(1)
    expect(g.missing).toBe(3)
    expect(g.missingTypes).toEqual(['pratico'])
  })

  it('il giro di interrogazioni su più lezioni e il recupero contano un voto solo', () => {
    let data = base()
    data = addActivity('c1', '2026-10-05', verifica('a', 'teorico'))(data)
    data = setCancelled('c1', '2026-10-07', true)(data)
    let n = 0
    const id = () => `k${n++}`
    data = setRepeats('c1', '2026-10-05', 'a', 3, id)(data)
    expect(activityRepeats(data, 'c1', 'a').map((r) => r.date)).toEqual(['2026-10-09', '2026-10-12', '2026-10-14'])
    expect(data.lessons[lessonKey('c1', '2026-10-09')].activities[0].assessment).toEqual({ type: 'teorico', weight: 100, continues: true })
    data = addActivity('c1', '2026-10-19', { ...verifica('r', 'teorico', 100, true), assessment: { type: 'teorico', weight: 100, continues: true, makeup: true } })(data)
    let g = periodGrades(data, data.courses.c1, data.year!.periods[0], '2026-09-29')
    expect(g.full).toHaveLength(1)
    expect(g.full[0].parts.map((p) => p.date)).toEqual(['2026-10-09', '2026-10-12', '2026-10-14', '2026-10-19'])

    // Meno ripetizioni: si tolgono le ultime.
    data = setRepeats('c1', '2026-10-05', 'a', 1, id)(data)
    expect(activityRepeats(data, 'c1', 'a').map((r) => r.date)).toEqual(['2026-10-09'])
    // Le ripetizioni seguono le modifiche.
    data = updateActivity('c1', '2026-10-05', { ...verifica('a', 'pratico'), text: 'gruppo A' })(data)
    expect(data.lessons[lessonKey('c1', '2026-10-09')].activities[0]).toMatchObject({ text: 'gruppo A', assessment: { type: 'pratico', continues: true } })
    g = periodGrades(data, data.courses.c1, data.year!.periods[0], '2026-09-29')
    expect(g.full[0].parts).toHaveLength(2)
  })

  it('si ripete anche una lezione qualsiasi', () => {
    let data = base()
    data = addActivity('c1', '2026-10-05', { id: 'l', kind: 'laboratorio', topicIds: ['t1'], text: 'socket' })(data)
    data = setRepeats('c1', '2026-10-05', 'l', 2, () => Math.random().toString())(data)
    expect(data.lessons[lessonKey('c1', '2026-10-07')].activities[0]).toMatchObject({ kind: 'laboratorio', topicIds: ['t1'], text: 'socket', repeatOf: 'l' })
    expect(data.lessons[lessonKey('c1', '2026-10-09')].activities[0].assessment).toBeUndefined()
  })

  it('si ripete nelle lezioni scelte, a blocco intero', () => {
    let data = base()
    data = addActivity('c1', '2026-10-05', verifica('a', 'teorico'))(data)
    const id = () => Math.random().toString()
    // Lunedì e venerdì, non mercoledì; le due ore del venerdì sono una lezione sola.
    data = toggleRepeat('c1', '2026-10-05', 'a', '2026-10-09', id)(data)
    data = toggleRepeat('c1', '2026-10-05', 'a', '2026-10-12', id)(data)
    expect(activityRepeats(data, 'c1', 'a').map((r) => r.date)).toEqual(['2026-10-09', '2026-10-12'])
    data = toggleRepeat('c1', '2026-10-05', 'a', '2026-10-09', id)(data)
    expect(activityRepeats(data, 'c1', 'a').map((r) => r.date)).toEqual(['2026-10-12'])
    // Il + aggiunge dopo l'ultima scelta.
    data = setRepeats('c1', '2026-10-05', 'a', 2, id)(data)
    expect(activityRepeats(data, 'c1', 'a').map((r) => r.date)).toEqual(['2026-10-12', '2026-10-14'])
  })

  it('unisce e separa due valutazioni a posteriori', () => {
    let data = base()
    data = addActivity('c1', '2026-10-05', verifica('a', 'teorico'))(data)
    data = addActivity('c1', '2026-10-07', verifica('b', 'scritto'))(data)
    const period = data.year!.periods[0]
    expect(periodGrades(data, data.courses.c1, period, '2026-09-29').full).toHaveLength(2)
    data = mergeAssessment('c1', '2026-10-07', 'b', data.lessons[lessonKey('c1', '2026-10-05')].activities[0])(data)
    let g = periodGrades(data, data.courses.c1, period, '2026-09-29')
    expect(g.full).toHaveLength(1)
    expect(g.full[0].parts[0].activity.assessment?.type).toBe('teorico')
    data = separateAssessment('c1', '2026-10-07', 'b')(data)
    g = periodGrades(data, data.courses.c1, period, '2026-09-29')
    expect(g.full).toHaveLength(2)
  })

  it('il recupero di uno scritto va preparato, il seguito di un orale no', () => {
    expect(needsPrep({ ...verifica('a', 'scritto', 100, true), assessment: { type: 'scritto', weight: 100, continues: true, makeup: true } })).toBe(true)
    expect(needsPrep(verifica('b', 'scritto', 100, true))).toBe(false)
    expect(needsPrep({ ...verifica('c', 'teorico', 100, true), assessment: { type: 'teorico', weight: 100, continues: true, makeup: true } })).toBe(false)
  })

  it('conta le ore di educazione civica', () => {
    let data = base({ ...course, civics: { p1: 3 } })
    data = addActivity('c1', '2026-10-05', { id: 'x', kind: 'civica', topicIds: [], text: '' })(data)
    const g = periodGrades(data, data.courses.c1, data.year!.periods[0], '2026-09-29')
    expect(g.civics).toEqual({ target: 3, planned: 2, done: 0 })
  })

  it('sceglie prima i tipi mancanti, poi a rotazione', () => {
    expect(assessmentTypes({ ...course, updatedAt: 0 }, ['scritto'], 4)).toEqual(['teorico', 'pratico', 'scritto', 'teorico'])
  })
})

describe('proposta di piano', () => {
  // Oggi è martedì 29 settembre: lezioni libere mer 30, ven 2 (ITP), lun 5, mer 7, ven 9 (ITP).
  const pratico = { id: 'v1', type: 'pratico' as const, weight: 100, text: 'Flowgorithm', done: false }
  const kinds = (p: ReturnType<typeof proposeWeeks>) => p.lessons.map((l) => [l.date, l.activity.kind, l.activity.topicIds.join()])

  it('divide le lezioni secondo i sotto-punti, almeno una per argomento', () => {
    const t = (n: number) => ({ ...topic('t', 'x'), points: Array.from({ length: n }, () => '·'), updatedAt: 0 })
    expect(shareLessons([t(3), t(1), t(0)], 7)).toEqual([3, 2, 2])
    expect(shareLessons([t(0), t(0)], 2)).toEqual([1, 1])
  })

  it("riempie le settimane scelte con l'argomento e poi la sua valutazione, il pratico in laboratorio", () => {
    const data = saveTopics([topic('t1', 'Algoritmi', { points: ['a', 'b'], assessments: [pratico] }), topic('t2', 'Array')])(base())
    const p = proposeWeeks(data, data.courses.c1, data.year!.periods[0], ['t1'], 2, '2026-09-29')
    expect(kinds(p)).toEqual([
      ['2026-09-30', 'spiegazione', 't1'],
      ['2026-10-02', 'spiegazione', 't1'],
      ['2026-10-05', 'spiegazione', 't1'],
      ['2026-10-07', 'spiegazione', 't1'],
      ['2026-10-09', 'verifica', 't1'],
    ])
    expect(p.lessons.at(-1)!.activity.assessment!.plannedId).toBe('v1')
    expect([p.from, p.to, p.overflowTopics.length, p.spareLessons]).toEqual(['2026-09-28', '2026-10-11', 0, 0])
  })

  it('dice quali argomenti non ci stanno', () => {
    const data = saveTopics([topic('t1', 'Algoritmi', { assessments: [pratico] })])(base())
    const p = proposeWeeks(data, data.courses.c1, data.year!.periods[0], ['t1', 't2'], 1, '2026-09-29')
    expect(kinds(p)).toEqual([
      ['2026-09-30', 'spiegazione', 't1'],
      ['2026-10-02', 'verifica', 't1'],
    ])
    expect(p.overflowTopics.map((t) => t.id)).toEqual(['t2'])
  })

  it('aspetta il laboratorio con un ripasso, togliendo una lezione dopo', () => {
    const data = saveTopics([topic('t1', 'Algoritmi', { assessments: [pratico] }), topic('t2', 'Array', { points: ['a', 'b', 'c'] })])(base())
    const p = proposeWeeks(data, data.courses.c1, data.year!.periods[0], ['t1', 't2'], 2, '2026-09-29')
    expect(kinds(p).slice(0, 3)).toEqual([
      ['2026-09-30', 'spiegazione', 't1'],
      ['2026-10-02', 'spiegazione', 't1'],
      ['2026-10-05', 'ripasso', 't1'],
    ])
    expect(p.lessons.find((l) => l.activity.kind === 'verifica')!.date).toBe('2026-10-09')
  })

  it("mentre il pratico aspetta il laboratorio, fa prima un'altra valutazione", () => {
    const orale = { id: 'v2', type: 'teorico' as const, weight: 100, text: '', done: false }
    const data = saveTopics([topic('t1', 'Algoritmi', { assessments: [pratico, orale] })])(base())
    const p = proposeWeeks(data, data.courses.c1, data.year!.periods[0], ['t1'], 2, '2026-09-29')
    expect(p.lessons.slice(-2).map((l) => [l.date, l.activity.assessment?.plannedId])).toEqual([
      ['2026-10-07', 'v2'],
      ['2026-10-09', 'v1'],
    ])
    expect(p.overflowAssessments).toBe(0)
  })

  it('non tocca le lezioni già pianificate', () => {
    const data = addActivity('c1', '2026-09-30', { id: 'x', kind: 'laboratorio', topicIds: ['t1'], text: '' })(base())
    const p = proposeWeeks(data, data.courses.c1, data.year!.periods[0], ['t1'], 1, '2026-09-29')
    expect(kinds(p)).toEqual([['2026-10-02', 'spiegazione', 't1']])
  })
})

describe('prossimi voti', () => {
  it('prima quelli in calendario, poi quelli del programma, poi quelli che mancano al minimo', () => {
    let data = saveTopics([topic('t1', 'Algoritmi', { assessments: [{ id: 'v1', type: 'scritto', weight: 100, text: '', done: false }] })])(base())
    data = addActivity('c1', '2026-10-05', { ...verifica('a', 'teorico'), topicIds: ['t2'] })(data)
    const period = data.year!.periods[0]
    const grades = periodGrades(data, data.courses.c1, period, '2026-09-29')
    const next = nextGrades(data, data.courses.c1, grades)
    expect(next.map((g) => [g.source, g.type, g.about, g.date])).toEqual([
      ['calendario', 'teorico', 'Array', '2026-10-05'],
      ['programma', 'scritto', 'Algoritmi', null],
      ['minimo', 'pratico', '', null],
      ['minimo', 'scritto', '', null],
      ['minimo', 'teorico', '', null],
    ])
    expect(programAssessments(data, data.courses.c1, period, grades)).toEqual({ total: 1, unplaced: 1 })
  })

  it('una verifica messa a mano nella lezione prende il posto di quella prevista per il suo argomento', () => {
    const orale = { id: 'v1', type: 'teorico' as const, weight: 100, text: '', done: false }
    const minore = { id: 'v2', type: 'pratico' as const, weight: 40, text: '', done: false }
    let data = saveTopics([topic('t1', 'Algoritmi', { assessments: [orale, minore] })])(base())
    data = addActivity('c1', '2026-10-05', { ...verifica('a', 'teorico'), topicIds: ['t1'] })(data)
    // Un pratico pieno senza un pratico pieno previsto si abbina comunque al pratico minore.
    data = addActivity('c1', '2026-10-09', { ...verifica('b', 'pratico'), topicIds: ['t1'] })(data)
    data = addActivity('c1', '2026-10-12', { ...verifica('c', 'teorico'), topicIds: ['t1'] })(data)
    expect([...placedAssessments(data, 'c1')].map(([id, at]) => [id, at.date])).toEqual([
      ['v1', '2026-10-05'],
      ['v2', '2026-10-09'],
    ])
    const grades = periodGrades(data, data.courses.c1, data.year!.periods[0], '2026-09-29')
    expect(grades.unplaced).toEqual([])
    expect(nextGrades(data, data.courses.c1, grades).filter((g) => g.source !== 'minimo').map((g) => [g.type, g.date])).toEqual([
      ['teorico', '2026-10-05'],
      ['pratico', '2026-10-09'],
      ['teorico', '2026-10-12'],
    ])
  })

  it("finita la scuola della settimana si mostra quella dopo; il sabato solo se c'è lezione", () => {
    // L'orario di prova ha lezione lunedì, mercoledì e venerdì: il sabato 3 ottobre è già fine settimana.
    expect(weekToShow(base(), '2026-10-03')).toBe('2026-10-05')
    expect(weekToShow(base(), '2026-10-02')).toBe('2026-09-28')
    const withSaturday = base({ ...course, schedule: [...course.schedule, { day: 6, hours: 1, lab: false }] })
    expect(weekToShow(withSaturday, '2026-10-03')).toBe('2026-09-28')
    expect(weekToShow(withSaturday, '2026-10-04')).toBe('2026-10-05')
  })

  it("con un'ora, la settimana dopo arriva la sera dell'ultimo giorno di scuola", () => {
    const evening = { time: '19:00' }
    expect(weekToShow(base(), '2026-10-02', '18:59', evening)).toBe('2026-09-28')
    expect(weekToShow(base(), '2026-10-02', '19:00', evening)).toBe('2026-10-05')
    // Un giorno forzato vale anche contro l'orario.
    expect(weekToShow(base(), '2026-10-01', '19:00', { day: 4, time: '19:00' })).toBe('2026-10-05')
  })

  it('le settimane di scuola non contano quelle tutte di vacanza', () => {
    const year = defaultSchoolYear(2026)
    const weeks = schoolWeeks(year, year.periods[0])
    expect(weeks).toContain('2026-12-21')
    expect(weeks).not.toContain('2026-12-28')
  })
})

describe('avanzamento', () => {
  it('somma le ore e le lezioni pianificate e fatte per argomento', () => {
    let data = base()
    data = addActivity('c1', '2026-10-05', { id: 'x', kind: 'spiegazione', topicIds: ['t1'], text: '' })(data)
    data = addActivity('c1', '2026-10-07', { id: 'y', kind: 'laboratorio', topicIds: ['t1'], text: '' })(data)
    data = setDone('c1', '2026-10-05', true)(data)
    const [t1, t2] = topicProgress(data, data.courses.c1)
    expect(t1.plannedHours).toBe(3)
    expect(t1.doneHours).toBe(2)
    expect(t1.status).toBe('in-corso')
    expect(t2.status).toBe('da-pianificare')
  })

  it("senza ore stimate, un argomento è fatto quando si è passati al successivo", () => {
    let data = addActivity('c1', '2026-09-21', { id: 'x', kind: 'spiegazione', topicIds: ['t1'], text: '' })(base())
    expect(topicProgress(data, data.courses.c1)[0].status).toBe('in-corso')
    data = addActivity('c1', '2026-09-23', { id: 'y', kind: 'spiegazione', topicIds: ['t2'], text: '' })(data)
    const [t1, t2] = topicProgress(data, data.courses.c1)
    expect([t1.status, t2.status, t1.doneLessons, t1.plannedLessons]).toEqual(['fatto', 'in-corso', 1, 1])
  })

  it('nei dati di prima, le ore stimate spariscono e 0 ore vuol dire solo valutazione', () => {
    const data = normalizeData({ topics: { a: { id: 'a', hours: 0 }, b: { id: 'b', hours: 8 } } })
    expect([data.topics.a.assessmentOnly, 'hours' in data.topics.a, data.topics.b.assessmentOnly]).toEqual([true, false, undefined])
  })
})

describe('lezione persa', () => {
  it('annulla il giorno e fa slittare il piano', () => {
    let data = base()
    data = addActivity('c1', '2026-10-05', { id: 'a', kind: 'spiegazione', topicIds: ['t1'], text: '' })(data)
    data = addActivity('c1', '2026-10-07', { id: 'b', kind: 'spiegazione', topicIds: ['t2'], text: '' })(data)
    data = addActivity('c1', '2026-10-09', { id: 'c', kind: 'laboratorio', topicIds: ['t2'], text: '' })(data)
    data = cancelAndShift('c1', '2026-10-05')(data)
    expect(data.lessons[lessonKey('c1', '2026-10-05')].cancelled).toBe(true)
    expect(data.lessons[lessonKey('c1', '2026-10-07')].activities[0].id).toBe('a')
    expect(data.lessons[lessonKey('c1', '2026-10-09')].activities[0].id).toBe('b')
    expect(data.lessons[lessonKey('c1', '2026-10-12')].activities[0].id).toBe('c')
  })
})

describe('lezioni cambiate a mano', () => {
  const spiegazione = (id: string) => ({ id, kind: 'spiegazione' as const, topicIds: ['t1'], text: '' })
  const dates = (data: ProfclickData) => courseSlots(data, data.courses.c1, '2026-10-05', '2026-10-11').map((s) => [s.date, s.hours, s.extra ?? false])

  it('una lezione in più compare nel suo giorno, anche fuori orario, e conta', () => {
    let data = addExtraLesson('c1', { date: '2026-10-06', hours: 1, start: 3, lab: false })(base())
    expect(dates(data)).toEqual([
      ['2026-10-05', 2, false],
      ['2026-10-06', 1, true],
      ['2026-10-07', 1, false],
      ['2026-10-09', 2, false],
    ])
    expect(slotsOn(data, '2026-10-06')[0].start).toBe(3)
    // Non due lezioni della stessa classe nello stesso giorno.
    data = addExtraLesson('c1', { date: '2026-10-05', hours: 1, lab: false })(data)
    expect(data.lessons[lessonKey('c1', '2026-10-05')]).toBeUndefined()
  })

  it('spostata in un altro giorno porta con sé il piano, e il giorno di prima sparisce', () => {
    let data = addActivity('c1', '2026-10-05', spiegazione('a'))(base())
    data = moveLesson('c1', '2026-10-05', { date: '2026-10-06', hours: 2, lab: false })(data)
    expect(dates(data)).toEqual([
      ['2026-10-06', 2, true],
      ['2026-10-07', 1, false],
      ['2026-10-09', 2, false],
    ])
    expect(data.lessons[lessonKey('c1', '2026-10-06')].activities[0].id).toBe('a')
    // Una lezione in più spostata di nuovo non lascia segni.
    data = moveLesson('c1', '2026-10-06', { date: '2026-10-08', hours: 2, lab: false })(data)
    expect(data.lessons[lessonKey('c1', '2026-10-06')]).toBeUndefined()
    expect(data.lessons[lessonKey('c1', '2026-10-08')].activities[0].id).toBe('a')
  })

  it("nello stesso giorno tiene solo quello che cambia rispetto all'orario", () => {
    let data = moveLesson('c1', '2026-10-05', { date: '2026-10-05', hours: 1, lab: false })(base())
    expect(data.lessons[lessonKey('c1', '2026-10-05')].hours).toBe(1)
    data = moveLesson('c1', '2026-10-05', { date: '2026-10-05', hours: 2, lab: false })(data)
    expect(data.lessons[lessonKey('c1', '2026-10-05')]).toBeUndefined()
  })

  it('eliminata sparisce; le lezioni in più restano col cambio di orario', () => {
    let data = deleteLesson('c1', '2026-10-07')(addActivity('c1', '2026-10-07', spiegazione('a'))(base()))
    data = addExtraLesson('c1', { date: '2026-10-10', hours: 1, lab: false })(data)
    expect(dates(data).map((d) => d[0])).toEqual(['2026-10-05', '2026-10-09', '2026-10-10'])
    data = changeSchedule('c1', [{ day: 2, hours: 2, lab: false }], '2026-10-05')(data)
    expect(dates(data).map((d) => d[0])).toEqual(['2026-10-06', '2026-10-10'])
    data = deleteLesson('c1', '2026-10-10')(data)
    expect(data.lessons[lessonKey('c1', '2026-10-10')]).toBeUndefined()
  })
})

describe('lezioni fatte', () => {
  it('passata con qualcosa in programma conta da sola come fatta; vuota, saltata o futura no', () => {
    // Oggi è il 29 settembre.
    let data = addActivity('c1', '2026-09-28', { id: 'a', kind: 'spiegazione', topicIds: ['t1'], text: '' })(base())
    data = addActivity('c1', '2026-09-30', { id: 'b', kind: 'spiegazione', topicIds: ['t1'], text: '' })(data)
    data = addActivity('c1', '2026-09-25', { id: 'c', kind: 'spiegazione', topicIds: ['t1'], text: '' })(data)
    data = setCancelled('c1', '2026-09-25', true)(data)
    const lesson = (date: string) => data.lessons[lessonKey('c1', date)]
    expect(isDone(lesson('2026-09-28'))).toBe(true)
    expect(isDone(lesson('2026-09-30'))).toBe(false)
    expect(isDone(lesson('2026-09-25'))).toBe(false)
    expect(isDone(lesson('2026-09-23'))).toBe(false)
    expect(topicProgress(data, data.courses.c1)[0].doneHours).toBe(2)
  })
})

describe('cambio di orario', () => {
  const spiegazione = (id: string) => ({ id, kind: 'spiegazione' as const, topicIds: ['t1'], text: '' })
  const tueThu = [
    { day: 2, hours: 2, lab: false },
    { day: 4, hours: 3, lab: true },
  ]

  it('le lezioni passate restano, il piano passa sui nuovi giorni in ordine', () => {
    let data = base()
    data = setDone('c1', '2026-09-28', true)(addActivity('c1', '2026-09-28', spiegazione('old'))(data))
    data = addActivity('c1', '2026-10-05', spiegazione('a'))(data)
    data = addActivity('c1', '2026-10-07', spiegazione('b'))(data)
    data = addActivity('c1', '2026-10-09', spiegazione('c'))(data)
    data = changeSchedule('c1', tueThu, '2026-10-05')(data)

    const c = data.courses.c1
    expect(c.pastSchedules).toEqual([{ until: '2026-10-04', schedule: course.schedule }])
    expect(courseSlots(data, c, '2026-09-28', '2026-10-04').map((s) => s.date)).toEqual(['2026-09-28', '2026-09-30', '2026-10-02'])
    expect(data.lessons[lessonKey('c1', '2026-09-28')].activities[0].id).toBe('old')
    expect(courseSlots(data, c, '2026-10-05', '2026-10-13').map((s) => [s.date, s.lesson?.activities[0]?.id])).toEqual([
      ['2026-10-06', 'a'],
      ['2026-10-08', 'b'],
      ['2026-10-13', 'c'],
    ])
    expect(data.lessons[lessonKey('c1', '2026-10-05')]).toBeUndefined()
  })

  it("dall'inizio dell'anno corregge tutto, e due orari uguali di seguito sono uno", () => {
    let data = changeSchedule('c1', tueThu, '2026-10-05')(base())
    data = changeSchedule('c1', tueThu, '2026-09-21')(data)
    expect(data.courses.c1.pastSchedules.map((p) => p.until)).toEqual(['2026-09-20'])
    data = changeSchedule('c1', course.schedule, data.year!.start)(data)
    expect(data.courses.c1.pastSchedules).toEqual([])
  })
})

describe('spuntato nel programma', () => {
  it('una valutazione fatta senza lezione conta; quelle degli argomenti conclusi restano da collocare', () => {
    let data = base()
    data = saveTopics([
      topic('t1', 'Algoritmi', { assessments: [{ id: 'v1', type: 'scritto', weight: 100, text: '', done: true }] }),
      topic('t2', 'Array', { completed: true, assessments: [{ id: 'v2', type: 'pratico', weight: 100, text: '', done: false }] }),
    ])(data)
    const g = periodGrades(data, data.courses.c1, data.year!.periods[0], '2026-09-29')
    expect(g.full.map((e) => [e.date, e.type, e.done])).toEqual([[null, 'scritto', true]])
    expect(g.done).toBe(1)
    expect(g.missingTypes).not.toContain('scritto')
    expect(g.unplaced.map((u) => u.planned.id)).toEqual(['v2'])
    const p = proposeWeeks(data, data.courses.c1, data.year!.periods[0], ['t1', 't2'], 2, '2026-09-29')
    expect(p.lessons.some((l) => l.activity.assessment?.plannedId === 'v2')).toBe(true)
    expect(p.lessons.some((l) => l.activity.kind === 'spiegazione' && l.activity.topicIds.includes('t2'))).toBe(false)
  })

  it('nei dati di prima, le valutazioni di un argomento concluso sono fatte', () => {
    const data = normalizeData({ topics: { t: { id: 't', completed: true, assessments: [{ id: 'v', type: 'scritto', weight: 100, text: '' }] } } })
    expect(data.topics.t.assessments[0].done).toBe(true)
    expect(normalizeData({ courses: { c: { id: 'c', schedule: [] } } }).courses.c.pastSchedules).toEqual([])
  })
})

describe('unione tra dispositivi', () => {
  it('tiene la modifica più recente di ogni record', () => {
    const start = base()
    vi.setSystemTime(new Date('2026-09-29T11:00:00Z'))
    const phone = addActivity('c1', '2026-10-05', { id: 'p', kind: 'spiegazione', topicIds: ['t1'], text: '' })(start)
    vi.setSystemTime(new Date('2026-09-29T12:00:00Z'))
    const pc = addActivity('c1', '2026-10-07', { id: 'q', kind: 'ripasso', topicIds: [], text: '' })(start)
    const merged = mergeData(phone, pc)
    expect(Object.keys(merged.lessons).sort()).toEqual([lessonKey('c1', '2026-10-05'), lessonKey('c1', '2026-10-07')])
    expect(sameData(merged, mergeData(pc, phone))).toBe(true)
  })

  it('una cancellazione più recente vince', () => {
    const start = base()
    vi.setSystemTime(new Date('2026-09-29T11:00:00Z'))
    const removed = deleteCourse('c1')(start)
    const merged = mergeData(start, removed)
    expect(merged.courses.c1).toBeUndefined()
    expect(Object.keys(merged.topics)).toHaveLength(0)
  })
})

describe('annulla', () => {
  it('rimette i record com erano, anche quelli cancellati', () => {
    const before = base()
    vi.setSystemTime(new Date('2026-09-29T11:00:00Z'))
    let data = deleteCourse('c1')(before)
    data = addActivity('c2', '2026-10-05', { id: 'z', kind: 'altro', topicIds: [], text: '' })(data)
    vi.setSystemTime(new Date('2026-09-29T11:00:01Z'))
    const undone = undoTo(before)(data)
    expect(undone.courses.c1.className).toBe('3A')
    expect(Object.keys(undone.topics)).toHaveLength(2)
    expect(Object.keys(undone.lessons)).toHaveLength(0)
    expect(mergeData(data, undone).courses.c1).toBeDefined()
  })
})

describe('importazione del programma', () => {
  it('legge argomenti, sotto-punti, ore e caselle', () => {
    const text = ['☑ Algoritmi (10h)', '  ☐ Flowgorithm', '☐ Array - 12 ore', '   ricerca e ordinamento', '☐ Funzioni'].join('\n')
    expect(parseProgram(text).map((t) => [t.title, t.hours, t.points, t.completed])).toEqual([
      ['Algoritmi', 10, ['Flowgorithm'], true],
      ['Array', 12, ['ricerca e ordinamento'], false],
      ['Funzioni', null, [], false],
    ])
  })

  it('con elenchi misti, il trattino indica un sotto-punto', () => {
    expect(parseProgram('Reti\n- ISO/OSI\n- TCP/IP\nDatabase: 20h').map((t) => [t.title, t.points, t.hours])).toEqual([
      ['Reti', ['ISO/OSI', 'TCP/IP'], null],
      ['Database', [], 20],
    ])
  })

  it("legge l'elenco dei voti di Keep: periodi, pesi, tipi, argomenti ripetuti", () => {
    const note = [
      'VOTI',
      '1️⃣ Codifica delle informazioni (orale) ⬅️',
      '1️⃣ Codifica delle informazioni (pratico)',
      '1️⃣ Trasmissione delle informazioni (scritto)',
      '',
      '2️⃣ Sistemi operativi (scritto)',
      '✳️ Flipped Classroom (orale, 30%)',
      '2️⃣ Progetto (pratico con orale, 75%)',
      '❌ C e C++',
      '2️⃣ Socket (?)',
      '2️⃣ Prova parallela (scritto)',
    ].join('\n')
    const topics = parseProgram(note)
    expect(topics.map((t) => [t.title, t.period, t.hours])).toEqual([
      ['Codifica delle informazioni', 1, null],
      ['Trasmissione delle informazioni', 1, null],
      ['Sistemi operativi', 2, null],
      ['Flipped Classroom', 2, null],
      ['Progetto', 2, null],
      ['C e C++', 2, null],
      ['Socket', 2, null],
      ['Prova parallela', 2, 0],
    ])
    expect(topics[0].assessments.map((a) => a.type)).toEqual(['teorico', 'pratico'])
    expect(topics[3].assessments[0]).toEqual({ type: 'teorico', weight: 30, minor: true, text: '' })
    expect(topics[4].assessments[0]).toEqual({ type: 'pratico', weight: 75, minor: true, text: 'con orale' })
    // ❌ è un vecchio segno, non vuol dire "tolto": la riga resta.
    expect(topics[5].assessments[0].type).toBe('scritto')
    expect(topics[6].assessments[0].type).toBe('scritto')
    expect(topics.every((t) => !t.completed)).toBe(true)
  })

  it('legge la lista NEXT: valutazioni sugli argomenti sopra, ⬅️ come punto raggiunto', () => {
    const note = [
      '- Lunedì (2h): HTML',
      '- Martedì (1h): -',
      '',
      'NEXT:',
      '⚠️ Scritto ❓',
      '- HTML e CSS',
      '⚠️ Pratico con orale',
      '- Sistemi posizionali ⬅️',
      '- Conversioni di numeri reali e tra basi',
      '- Attività ❓',
      '- Immagini suoni e video',
      '⚠️ Scritto ❓',
      '',
      '- Codici pesati',
      '...',
    ].join('\n')
    const topics = parseProgram(note)
    expect(topics.map((t) => [t.title, t.completed, t.assessments.map((a) => `${a.type}${a.minor ? '*' : ''}${a.text ? ` ${a.text}` : ''}`)])).toEqual([
      ['Verifica', true, ['scritto']],
      ['HTML e CSS', true, ['pratico con orale']],
      ['Sistemi posizionali', false, []],
      ['Conversioni di numeri reali e tra basi', false, ['pratico*']],
      ['Immagini suoni e video', false, ['scritto']],
      ['Codici pesati', false, []],
    ])
  })
})

describe('dati di esempio', () => {
  it('si generano con un piano e lezioni passate fatte', () => {
    const data = sampleData('2026-11-10')
    expect(Object.keys(data.courses)).toHaveLength(2)
    expect(new Set(Object.values(data.meetings).map((m) => m.kind))).toEqual(new Set(['dipartimento', 'glo', 'cdc', 'collegio', 'corso', 'scrutinio']))
    const lessons = Object.values(data.lessons)
    expect(lessons.some((l) => l.done)).toBe(true)
    expect(lessons.some((l) => !l.done)).toBe(true)
    // Pianificato un argomento alla volta fino a qualche settimana da oggi: dopo, lezioni libere.
    for (const c of Object.values(data.courses)) {
      const g = periodGrades(data, c, data.year!.periods[0], '2026-11-10')
      expect(g.full.some((e) => e.activity.assessment?.plannedId)).toBe(true)
      expect(g.freeLessons).toBeGreaterThan(0)
    }
  })
})

describe('calendario', () => {
  it('collegamento a Google Calendar e file ics', async () => {
    const { allAssessments, googleCalendarLink, toIcs } = await import('./calendarExport')
    let data = base()
    data = addActivity('c1', '2026-10-05', { ...verifica('v', 'scritto'), topicIds: ['t1'] })(data)
    const [entry] = allAssessments(data)
    expect(entry.title).toBe('Verifica scritta 3A: Algoritmi')
    expect(googleCalendarLink(entry)).toContain('dates=20261005%2F20261006')
    const ics = toIcs([entry], new Date('2026-09-29T10:00:00Z'))
    expect(ics).toContain('DTSTART;VALUE=DATE:20261005')
    expect(ics).toContain('UID:v@profclick.federicodiluca.com')
  })
})

describe('importazione: blocchi', () => {
  it('un voto minore a inizio blocco prende il periodo del blocco', () => {
    const note = ['1️⃣ Aziende e Mercati (orale) ⬅️', '✳️ Marketing (pratico, 20%)', '1️⃣ Organizzazione Aziendale (scritto)', '', '✳️ Intro PM (orale, 30%)', '2️⃣ PM nei Progetti Informatici (scritto)'].join('\n')
    expect(parseProgram(note).map((t) => [t.title, t.period])).toEqual([
      ['Aziende e Mercati', 1],
      ['Marketing', 1],
      ['Organizzazione Aziendale', 1],
      ['Intro PM', 2],
      ['PM nei Progetti Informatici', 2],
    ])
  })
})

describe('importazione: dettagli', () => {
  it('tiene quello che resta tra parentesi', () => {
    const [a, b, c] = parseProgram('✳️ Stima Costi (orale, 70% con domande)\n2️⃣ Progetto (pratico con orale, 75%)\n2️⃣ Reti (scritto)').map((t) => t.assessments[0])
    expect([a.type, a.weight, a.text]).toEqual(['teorico', 70, 'con domande'])
    expect([b.type, b.weight, b.text]).toEqual(['pratico', 75, 'con orale'])
    expect(c.text).toBe('')
  })
})

const meeting = (id: string, extra: Partial<Meeting> = {}): Omit<Meeting, 'updatedAt'> => ({
  id,
  kind: 'cdc',
  date: '2026-10-20',
  time: '15:00',
  className: '3A',
  title: '',
  coordinator: false,
  prep: [],
  notes: '',
  ...extra,
})

describe('riunioni', () => {
  it('nomi, cose da preparare proposte e coordinatore', () => {
    let n = 0
    const id = () => `x${n++}`
    expect(meetingLabel(meeting('m'))).toBe('Consiglio di classe 3A')
    expect(meetingLabel(meeting('m', { kind: 'corso', title: 'Corso sicurezza', className: null }))).toBe('Corso sicurezza')
    const prep = defaultPrep('scrutinio', { coordinator: false }, id)
    expect(prep.map((p) => p.text)).toEqual(['Proposte di voto sul registro', 'Argomenti da recuperare per le insufficienze'])
    // Diventando coordinatore si aggiungono le sue voci, prima e dopo; quelle scritte a mano restano.
    const mine = [...prep, { id: 'mia', text: 'Mia', done: false }]
    const coord = updateDefaultPrep(mine, { kind: 'scrutinio', coordinator: false }, { kind: 'scrutinio', coordinator: true }, id)
    expect(coord.filter((p) => !p.after).map((p) => p.text)).toContain('Giudizi')
    expect(coord.filter((p) => p.after).map((p) => p.text)).toEqual(['Comunicazioni alle famiglie'])
    expect(coord.map((p) => p.text)).toContain('Mia')
    // Chi scrive il verbale lo trova tra le cose da fare dopo.
    const minutes = updateDefaultPrep(coord, { kind: 'scrutinio', coordinator: true }, { kind: 'scrutinio', coordinator: true, minutes: true }, id)
    expect(minutes.filter((p) => p.after).map((p) => p.text).sort()).toEqual(['Comunicazioni alle famiglie', 'Verbale dello scrutinio'])
    const back = updateDefaultPrep(minutes, { kind: 'scrutinio', coordinator: true, minutes: true }, { kind: 'collegio', coordinator: false }, id)
    expect(back.map((p) => p.text)).toEqual(['Leggere i documenti della convocazione', 'Mia'])

    let data = saveMeeting(meeting('a', { coordinator: true, date: '2026-10-20' }))(base())
    data = saveMeeting(meeting('b', { kind: 'collegio', className: null, date: '2026-11-20' }))(data)
    expect(wasCoordinator(data, '3A')).toBe(true)
    expect(wasCoordinator(data, '4B')).toBe(false)
  })

  it('le cose da preparare scadono il giorno della riunione', () => {
    let data = saveMeeting(meeting('a', { prep: [{ id: 'p', text: 'Verbale', done: false }] }))(base())
    data = saveMeeting(meeting('old', { date: '2026-09-20', prep: [{ id: 'q', text: 'Vecchia', done: false }] }))(data)
    expect(openMeetingPrep(data, '2026-09-29').map((p) => [p.item.text, p.due])).toEqual([['Verbale', '2026-10-20']])
    data = toggleMeetingPrep('a', 'p')(data)
    expect(openMeetingPrep(data, '2026-09-29')).toEqual([])
  })

  it('quelle da fare dopo (il verbale) restano anche passata la riunione, finché non sono fatte', () => {
    const prep = [
      { id: 'p', text: 'Punti', done: false },
      { id: 'v', text: 'Verbale del dipartimento', done: false, after: true },
    ]
    let data = saveMeeting(meeting('old', { kind: 'dipartimento', className: null, date: '2026-09-22', minutes: true, prep }))(base())
    expect(openMeetingPrep(data, '2026-09-29').map((p) => p.item.id)).toEqual(['v'])
    expect(todos(data, '2026-09-29', '2026-10-04').map((t) => [t.id, t.due])).toEqual([['v', '2026-09-22']])
    expect(pendingAfter(data.meetings.old).map((p) => p.id)).toEqual(['v'])
    data = toggleMeetingPrep('old', 'v')(data)
    expect(openMeetingPrep(data, '2026-09-29')).toEqual([])
    expect(todos(data, '2026-09-29', '2026-10-04')).toEqual([])
    // Nei dati di prima il verbale stava tra le cose da preparare.
    const before = normalizeData({ meetings: { m: { id: 'm', prep: [{ id: 'x', text: 'Verbale', done: false }, { id: 'y', text: 'Punti', done: false }] } } })
    expect([before.meetings.m.prep.map((p) => Boolean(p.after)), before.meetings.m.minutes]).toEqual([[true, false], true])
    expect(wroteMinutes(saveMeeting(meeting('n', { minutes: true }))(base()), 'cdc', '3A')).toBe(true)
  })

  it('lo scrutinio guarda il periodo appena finito', () => {
    const year = defaultSchoolYear(2026)
    expect(meetingPeriod(year, 'scrutinio', '2027-02-05')?.id).toBe('p1')
    expect(meetingPeriod(year, 'cdc', '2027-02-05')?.id).toBe('p2')
    expect(meetingPeriod(year, 'scrutinio', '2027-06-15')?.id).toBe('p2')
  })

  it('riepilogo della classe dai dati', () => {
    let data = addActivity('c1', '2026-10-05', { ...verifica('v', 'scritto'), topicIds: ['t1'] })(base())
    data = setDone('c1', '2026-10-05', true)(data)
    data = addActivity('c1', '2026-10-07', verifica('w', 'pratico'))(data)
    const summary = classSummary(data, meeting('m', { kind: 'scrutinio', date: '2027-02-05' }))!
    expect(summary.period.id).toBe('p1')
    const [s] = summary.courses
    expect(s.gradesDone).toBe(1)
    expect(s.typesWithoutGrade).toEqual(['teorico', 'pratico'])
    expect(s.topicsLeft).toEqual(['Algoritmi', 'Array'])
    const text = summaryText(meeting('m', { kind: 'scrutinio', date: '2027-02-05' }), summary)
    expect(text).toContain('Scrutinio 3A del 5 feb 2027 · 1° quadrimestre')
    expect(text).toContain('3A · Informatica: 1 voto fatto su 5; senza voto: orale, pratico; 0 argomenti svolti su 2 (non svolti: Algoritmi, Array).')
    // Collegio e classi che non ho: nessun riepilogo.
    expect(classSummary(data, meeting('m', { kind: 'collegio' }))).toBeNull()
    expect(classSummary(data, meeting('m', { className: '5C' }))).toBeNull()
  })

  it('si uniscono tra dispositivi, si annullano e vanno sul calendario con l ora', async () => {
    const { googleCalendarLink, meetingEntry, toIcs } = await import('./calendarExport')
    const start = saveMeeting(meeting('a'))(base())
    vi.setSystemTime(new Date('2026-09-29T11:00:00Z'))
    const phone = saveMeeting(meeting('b', { kind: 'collegio', className: null }))(start)
    const pc = deleteMeeting('a')(start)
    const merged = mergeData(phone, pc)
    expect(Object.keys(merged.meetings)).toEqual(['b'])
    vi.setSystemTime(new Date('2026-09-29T11:00:01Z'))
    expect(Object.keys(undoTo(start)(merged).meetings)).toEqual(['a'])
    expect(normalizeData(JSON.parse(JSON.stringify({ ...merged, meetings: undefined }))).meetings).toEqual({})

    const entry = meetingEntry({ ...meeting('a', { prep: [{ id: 'p', text: 'Verbale', done: false }] }), updatedAt: 0 })
    expect(googleCalendarLink(entry)).toContain('dates=20261020T150000%2F20261020T170000')
    const ics = toIcs([entry], new Date('2026-09-29T10:00:00Z'))
    expect(ics).toContain('DTSTART:20261020T150000')
    expect(ics).toContain('DESCRIPTION:- Verbale')
    expect(ics).toContain('TRANSP:OPAQUE')
  })
})

describe('da fare', () => {
  // Un'esercitazione chiede gli esercizi; una spiegazione, di base, niente.
  const spiega = (id: string, topicId: string) => ({ id, kind: 'esercitazione' as const, topicIds: [topicId], text: '' })
  // Quello da chiudere e da preparare; quello a cose fatte (dopo eventi che devono venire) a parte.
  const list = (data: ProfclickData) => todos(data, '2026-09-29', '2026-10-11').filter((t) => !isLater(t, '2026-09-29')).map((t) => [t.id, t.due, t.done])
  const later = (data: ProfclickData) => todos(data, '2026-09-29', '2026-10-11').filter((t) => isLater(t, '2026-09-29')).map((t) => t.id)

  it('ogni attività in programma è una cosa da preparare, con le voci delle classi e delle riunioni', () => {
    let data = addActivity('c1', '2026-09-28', spiega('ieri', 't1'))(base())
    data = addActivity('c1', '2026-09-30', spiega('s1', 't1'))(data)
    data = addActivity('c1', '2026-09-30', verifica('orale', 'teorico'))(data)
    data = addActivity('c1', '2026-10-02', spiega('s2', 't2'))(data)
    data = addActivity('c1', '2026-10-02', verifica('v', 'scritto'))(data)
    data = addActivity('c1', '2026-10-02', verifica('v2', 'scritto', 100, true))(data)
    data = addActivity('c1', '2026-10-30', spiega('lontana', 't2'))(data)
    data = saveCourse({
      ...course,
      prep: [
        { id: 'slide', text: 'Slide sugli array', topicId: 't2', done: false },
        { id: 'libro', text: 'Libro di testo', topicId: null, done: false },
        { id: 'fatta', text: 'Già fatta', topicId: null, done: true },
      ],
    })(data)
    data = saveMeeting(meeting('m', { date: '2026-10-05', prep: [{ id: 'mp', text: 'Verbale', done: false }] }))(data)
    // Niente lezioni passate, interrogazioni, seconde parti, né quello oltre l'orizzonte.
    expect(list(data)).toEqual([
      ['s1:esercizi', '2026-09-30', false],
      ['s2:esercizi', '2026-10-02', false],
      ['v:prova', '2026-10-02', false],
      ['slide', '2026-10-02', false],
      ['mp', '2026-10-05', false],
      ['libro', null, false],
    ])
    expect(later(data)).toEqual(['orale:registro', 'v:correggi', 'v:riconsegna', 'v:registro', 'v:recupero', 'v:archivia'])
  })

  it('pronto resta pronto anche se la lezione slitta; a lezione fatta sparisce', () => {
    let data = addActivity('c1', '2026-09-30', spiega('s1', 't1'))(base())
    data = addActivity('c1', '2026-10-02', spiega('s2', 't2'))(data)
    data = setActivityReady('c1', '2026-10-02', 's2', true)(data)
    expect(list(data)).toEqual([
      ['s1:esercizi', '2026-09-30', false],
      ['s2:esercizi', '2026-10-02', true],
    ])
    data = cancelAndShift('c1', '2026-09-30')(data)
    expect(list(data)).toEqual([
      ['s1:esercizi', '2026-10-02', false],
      ['s2:esercizi', '2026-10-05', true],
    ])
    data = setDone('c1', '2026-10-02', true)(data)
    expect(list(data)).toEqual([['s2:esercizi', '2026-10-05', true]])
    expect(normalizeData(JSON.parse(JSON.stringify(data))).lessons[lessonKey('c1', '2026-10-05')].activities[0].ready).toBe(true)
  })

  it('dopo una verifica: correggere, riconsegnare, voti sul registro, finché non sono fatti', () => {
    // Oggi è il 29 settembre: lo scritto di ieri chiede i passi dopo; l'orale di prima dei passi no.
    let data = addActivity('c1', '2026-09-28', { ...verifica('v', 'scritto'), topicIds: ['t1'] })(base())
    data = addActivity('c1', '2026-09-21', verifica('o', 'teorico'))(data)
    data = addActivity('c1', '2026-10-02', verifica('p', 'pratico'))(data)
    expect(list(data)).toEqual([
      ['v:correggi', '2026-09-28', false],
      ['v:riconsegna', '2026-09-28', false],
      ['v:registro', '2026-09-28', false],
      ['v:recupero', '2026-09-28', false],
      ['v:archivia', '2026-09-28', false],
      ['p:prova', '2026-10-02', false],
    ])
    // Quello che verrà dopo il pratico di venerdì si vede già, a parte.
    expect(later(data)).toEqual(['p:correggi', 'p:riconsegna', 'p:registro', 'p:recupero', 'p:archivia'])
    // "Tutte pronte" è per quello da preparare: il registro resta da spuntare a mano.
    data = setTodosDone(todos(data, '2026-09-29', '2026-10-11').filter((t) => !isFollowUp(t)), true)(data)
    data = setActivityStep('c1', '2026-09-28', 'v', 'registro', { done: true })(data)
    // Spuntato resta, barrato: la lezione sparisce solo chiusa del tutto e in una settimana passata.
    expect(list(data)).toEqual([
      ['v:correggi', '2026-09-28', false],
      ['v:riconsegna', '2026-09-28', false],
      ['v:registro', '2026-09-28', true],
      ['v:recupero', '2026-09-28', false],
      ['v:archivia', '2026-09-28', false],
      ['p:prova', '2026-10-02', true],
    ])
    const closed = (['correggi', 'riconsegna', 'recupero', 'archivia'] as const).reduce((d, key) => setActivityStep('c1', '2026-09-28', 'v', key, { done: true })(d), data)
    expect(list(closed).map(([id]) => id)).toEqual(['v:correggi', 'v:riconsegna', 'v:registro', 'v:recupero', 'v:archivia', 'p:prova'])
    expect(todos(closed, '2026-10-05', '2026-10-11').filter((t) => t.due === '2026-09-28')).toEqual([])
    expect(todos(data, '2026-10-05', '2026-10-11').filter((t) => t.due === '2026-09-28').map((t) => [t.id, t.done])).toEqual([
      ['v:correggi', false],
      ['v:riconsegna', false],
      ['v:registro', true],
      ['v:recupero', false],
      ['v:archivia', false],
    ])
    // La stampa si aggiunge quando serve; cambiando tipo tornano i passi proposti.
    data = setActivityStep('c1', '2026-10-02', 'p', 'stampa', { present: true })(data)
    expect(activitySteps(data.lessons[lessonKey('c1', '2026-10-02')].activities[0]).map((x) => x.key)).toEqual(['prova', 'stampa', 'correggi', 'riconsegna', 'registro', 'recupero', 'archivia'])
    // Un passo scritto a mano va tra quelli da preparare, prima della stampa.
    data = setActivityStep('c1', '2026-10-02', 'p', customStep(' Prenotare l’aula '), { present: true })(data)
    const withCustom = data.lessons[lessonKey('c1', '2026-10-02')].activities[0]
    expect(activitySteps(withCustom).map((x) => stepLabel(x.key, withCustom))).toEqual([
      'Preparare la prova e le sue versioni',
      'Prenotare l’aula',
      'Stampare le copie',
      'Correggere',
      'Riconsegnare',
      'Voti sul registro',
      'Recupero assenti',
      'Archiviazione',
    ])
    expect(list(data)).toContainEqual(['p:altro:Prenotare l’aula', '2026-10-02', false])
    data = setActivityStep('c1', '2026-10-02', 'p', customStep('Prenotare l’aula'), { present: false })(data)
    // Uno scritto a mano per dopo va in fondo, tra quelli dopo.
    data = setActivityStep('c1', '2026-10-02', 'p', customStep('Avvisare i genitori', true), { present: true })(data)
    const withAfter = data.lessons[lessonKey('c1', '2026-10-02')].activities[0]
    expect(activitySteps(withAfter).map((x) => x.key)).toEqual(['prova', 'stampa', 'correggi', 'riconsegna', 'registro', 'recupero', 'archivia', 'dopo:Avvisare i genitori'])
    expect(isAfter('dopo:Avvisare i genitori')).toBe(true)
    expect(stepLabel('dopo:Avvisare i genitori', withAfter)).toBe('Avvisare i genitori')
    const p =data.lessons[lessonKey('c1', '2026-10-02')].activities[0]
    data = updateActivity('c1', '2026-10-02', { ...p, assessment: { ...p.assessment!, type: 'teorico' } })(data)
    expect(activitySteps(data.lessons[lessonKey('c1', '2026-10-02')].activities[0]).map((x) => x.key)).toEqual(['registro'])
    expect(defaultSteps({ id: 'e', kind: 'esercitazione', topicIds: [], text: '' })).toEqual(['esercizi'])
    expect(defaultSteps({ id: 's', kind: 'spiegazione', topicIds: [], text: '' })).toEqual(['rivedere'])
  })

  it("nello stesso giorno, l'ordine della giornata: lezioni per ora d'inizio, poi le riunioni", () => {
    // 3A alla terza ora, 4B (che viene dopo tra le classi) alla prima.
    let data = saveCourse({ ...course, schedule: [{ day: 1, hours: 2, lab: false, start: 3 }] })(base())
    data = saveCourse({ ...course, id: 'c2', className: '4B', order: 1, schedule: [{ day: 1, hours: 1, lab: false, start: 1 }] })(data)
    data = addActivity('c1', '2026-10-05', spiega('tardi', 't1'))(data)
    data = addActivity('c2', '2026-10-05', spiega('presto', 't1'))(data)
    data = saveMeeting(meeting('m', { date: '2026-10-05', time: '15:00', prep: [{ id: 'mp', text: 'Punti', done: false }] }))(data)
    expect(list(data).map(([id]) => id)).toEqual(['presto:esercizi', 'tardi:esercizi', 'mp'])
  })

  it('tante voci insieme: si cambiano solo quelle da cambiare', () => {
    let data = addActivity('c1', '2026-09-30', spiega('s1', 't1'))(base())
    data = addActivity('c1', '2026-10-02', spiega('s2', 't2'))(data)
    data = setActivityReady('c1', '2026-10-02', 's2', true)(data)
    data = saveCourse({ ...course, prep: [{ id: 'p', text: 'Fotocopie', topicId: null, done: false }] })(data)
    data = saveMeeting(meeting('m', { date: '2026-10-05', prep: [{ id: 'mp', text: 'Verbale', done: false }] }))(data)
    data = setTodosDone(todos(data, '2026-09-29', '2026-10-11'), true)(data)
    expect(list(data).every(([, , done]) => done)).toBe(true)
    data = setTodosDone(todos(data, '2026-09-29', '2026-10-11'), false)(data)
    expect(list(data).every(([, , done]) => !done)).toBe(true)
  })
})

describe('anni precedenti', () => {
  let n = 0
  const id = () => `n${n++}`
  const withAssessment = () => saveTopics([topic('t3', 'Grafi', { periodId: 'p2', assessments: [{ id: 'a', type: 'scritto', weight: 100, text: '', done: true }] })])(base())

  it('copia il programma di un altra classe, tutto da fare, in coda', () => {
    let data = saveCourse({ ...course, id: 'c2', className: '3B', order: 1 })(withAssessment())
    data = saveTopics([{ ...topic('t9', 'Già qui'), courseId: 'c2' }])(data)
    data = setTopicCompleted('t1', true)(data)
    const [source] = programSources(data, 'c2')
    expect(source.label).toBe('3A · Informatica')
    data = copyProgram(source, 'c2', id)(data)
    const copied = Object.values(data.topics)
      .filter((t) => t.courseId === 'c2')
      .sort((a, b) => a.order - b.order)
    expect(copied.map((t) => [t.title, t.periodId, t.completed, t.order])).toEqual([
      ['Già qui', 'p1', false, 9],
      ['Algoritmi', 'p1', false, 10],
      ['Array', 'p1', false, 11],
      ['Grafi', 'p2', false, 12],
    ])
    expect(copied[3].assessments[0].done).toBe(false)
    expect(copied[3].assessments[0].id).not.toBe('a')
  })

  it('il nuovo anno archivia classi e programmi e toglie il resto', () => {
    let data = addActivity('c1', '2026-10-05', { id: 'x', kind: 'spiegazione', topicIds: ['t1'], text: '' })(withAssessment())
    data = setDone('c1', '2026-10-05', true)(data)
    data = setTopicCompleted('t2', true)(data)
    data = saveMeeting(meeting('m'))(data)
    const next = nextSchoolYear(data.year!)
    expect(next.label).toBe('2027/28')
    vi.setSystemTime(new Date('2027-06-20T10:00:00Z'))
    const after = startNewYear(next)(data)
    expect(after.year!.label).toBe('2027/28')
    expect([after.courses, after.topics, after.lessons, after.meetings].map((r) => Object.keys(r).length)).toEqual([0, 0, 0, 0])
    const archived = after.archive['2026/27']
    expect(archived.courses[0].topics.map((t) => [t.title, t.completed])).toEqual([
      ['Algoritmi', false],
      ['Array', true],
      ['Grafi', false],
    ])
    // Un dispositivo rimasto all'anno prima non riporta indietro niente.
    expect(Object.keys(mergeData(data, after).courses)).toEqual([])
    // Nella classe nuova si copia dall'archivio, con i periodi corrispondenti.
    let fresh = saveCourse({ ...course, id: 'c9', className: '4A' })(after)
    const [source] = programSources(fresh, 'c9')
    expect(source.yearLabel).toBe('2026/27')
    fresh = copyProgram(source, 'c9', id)(fresh)
    expect(Object.values(fresh.topics).map((t) => t.periodId).sort()).toEqual(['p1', 'p1', 'p2'])
    // Si può annullare, e un anno archiviato si può togliere.
    vi.setSystemTime(new Date('2027-06-20T10:00:01Z'))
    const undone = undoTo(data)(after)
    expect(undone.year!.label).toBe('2026/27')
    expect(Object.keys(undone.courses)).toEqual(['c1'])
    expect(Object.keys(undone.archive)).toEqual([])
    expect(deleteArchivedYear('2026/27')(after).archive).toEqual({})
  })

  it('trimestre e pentamestre restano tali', () => {
    expect(nextSchoolYear(defaultSchoolYear(2026, 'trimestre-pentamestre')).periods[0].name).toBe('Trimestre')
  })
})

describe('testo del programma', () => {
  it('svolto: argomenti fatti e in parte, senza le voci che sono solo valutazioni', () => {
    let data = saveTopics([
      topic('t1', 'Algoritmi', { points: ['Flowgorithm', 'Pseudocodice'] }),
      topic('t3', 'Grafi', { periodId: 'p2' }),
      topic('t4', 'Prova parallela', { periodId: 'p2', assessmentOnly: true }),
    ])(base())
    data = setTopicCompleted('t1', true)(data)
    data = setTopicCompleted('t4', true)(data)
    data = addActivity('c1', '2026-10-05', { id: 'x', kind: 'spiegazione', topicIds: ['t2'], text: '' })(data)
    data = setDone('c1', '2026-10-05', true)(data)
    const input = currentProgram(data, data.courses.c1)
    expect(programText(input, 'svolto', false)).toBe(
      ['Programma svolto · 3A · Informatica · a.s. 2026/27', '', 'Algoritmi', '- Flowgorithm', '- Pseudocodice', '', 'Array (svolto in parte)'].join('\n'),
    )
    expect(programText(input, 'piano', true)).toBe(
      [
        'Piano di lavoro · 3A · Informatica · a.s. 2026/27',
        '',
        '1° quadrimestre',
        'Algoritmi',
        '- Flowgorithm',
        '- Pseudocodice',
        '',
        'Array',
        '',
        '2° quadrimestre',
        'Grafi',
      ].join('\n'),
    )
    // Dall'archivio: lo stato è quello di fine anno.
    vi.setSystemTime(new Date('2027-06-20T10:00:00Z'))
    const after = startNewYear(nextSchoolYear(data.year!))(data)
    const year = after.archive['2026/27']
    expect(programText(archivedProgram(year, year.courses[0]), 'svolto', false)).toBe(
      ['Programma svolto · 3A · Informatica · a.s. 2026/27', '', 'Algoritmi', '- Flowgorithm', '- Pseudocodice'].join('\n'),
    )
  })
})

describe('testo per il registro', () => {
  it('una riga per lezione, per giorno o per classe, senza annullate e vuote', () => {
    let data = saveCourse({ ...course, id: 'c2', className: '4B', order: 1 })(base())
    data = addActivity('c1', '2026-10-05', { id: 'a', kind: 'spiegazione', topicIds: ['t1'], text: 'diagrammi di flusso' })(data)
    data = addActivity('c1', '2026-10-05', { id: 'b', kind: 'esercitazione', topicIds: [], text: '' })(data)
    data = addActivity('c2', '2026-10-05', { ...verifica('c', 'pratico', 30), topicIds: ['t2'] })(data)
    data = addActivity('c1', '2026-10-07', verifica('d', 'scritto', 100, true))(data)
    data = addActivity('c2', '2026-10-07', { id: 'e', kind: 'ripasso', topicIds: [], text: '' })(data)
    data = setCancelled('c2', '2026-10-07', true)(data)
    const slots = slotsOn(data, '2026-10-05').concat(slotsOn(data, '2026-10-07'), slotsOn(data, '2026-10-09'))
    expect(registerText(data, slots, 'giorno')).toBe(
      [
        'Lunedì 5 ottobre',
        '3A · Informatica: Spiegazione: Algoritmi, diagrammi di flusso. Esercitazione.',
        '4B · Informatica: Prova pratica: Array.',
        '',
        'Mercoledì 7 ottobre',
        '3A · Informatica: Verifica scritta (seconda parte).',
      ].join('\n'),
    )
    expect(registerText(data, slots, 'classe')).toBe(
      [
        '3A · Informatica',
        'Lunedì 5 ottobre: Spiegazione: Algoritmi, diagrammi di flusso. Esercitazione.',
        'Mercoledì 7 ottobre: Verifica scritta (seconda parte).',
        '',
        '4B · Informatica',
        'Lunedì 5 ottobre: Prova pratica: Array.',
      ].join('\n'),
    )
  })
})

describe('orario stampabile', () => {
  it('le lezioni con l ora nella griglia, le altre a parte', () => {
    let data = saveCourse({
      ...course,
      schedule: [
        { day: 1, hours: 2, lab: false, start: 3 },
        { day: 3, hours: 1, lab: true },
        { day: 6, hours: 1, lab: false, start: 1 },
      ],
    })(base())
    data = saveCourse({ ...course, id: 'c2', className: '4B', order: 1, schedule: [{ day: 1, hours: 1, lab: false, start: 4 }, { day: null, hours: 2, lab: false }] })(data)
    const t = timetable(data, '2026-10-05')
    expect(t.days).toEqual([1, 2, 3, 4, 5, 6])
    expect(t.rows).toBe(4)
    expect(t.cells.get(cellKey(1, 3))?.hours).toBe(2)
    expect(t.cells.get(cellKey(6, 1))?.course.id).toBe('c1')
    // Alla 4ª ora del lunedì c'è ancora la 3A: la 4B, sovrapposta, va tra quelle senza ora.
    expect(t.unplaced.get(1)?.map((e) => e.course.id)).toEqual(['c2'])
    expect(t.unplaced.get(3)?.[0].lab).toBe(true)
    expect(t.floating.map((e) => e.course.className)).toEqual(['4B'])
  })

  it("segue i cambi d'orario e le lezioni cambiate a mano di quella settimana", () => {
    let data = saveCourse({ ...course, schedule: [{ day: 1, hours: 2, lab: false, start: 1 }] })(base())
    data = changeSchedule('c1', [{ day: 2, hours: 1, lab: false, start: 3 }], '2026-10-12')(data)
    expect(timetable(data, '2026-10-07').cells.get(cellKey(1, 1))?.hours).toBe(2)
    expect(timetable(data, '2026-10-14').cells.get(cellKey(2, 3))?.course.id).toBe('c1')
    expect(timetable(data, '2026-10-14').cells.has(cellKey(1, 1))).toBe(false)
    // La lezione di martedì 13 cambiata a mano alla 5a ora.
    data = moveLesson('c1', '2026-10-13', { date: '2026-10-13', hours: 1, start: 5, lab: false })(data)
    const t = timetable(data, '2026-10-13')
    expect(t.cells.get(cellKey(2, 5))?.date).toBe('2026-10-13')
    expect(t.cells.has(cellKey(2, 3))).toBe(false)
  })
})

describe('note', () => {
  const note = { id: 'n1', title: 'Slide', text: '', courseIds: [], pinned: false, order: 0 }

  it('legge caselle, elenchi, grassetto e link', () => {
    const lines = noteLines('Prossimi:\n- [ ] Arduino\n[x] Reti\n- C# concorrenza\n\n**ARGO** su https://www.portaleargo.it.')
    expect(lines.map((l) => l.kind)).toEqual(['text', 'check', 'check', 'bullet', 'blank', 'text'])
    expect(lines[1]).toEqual({ kind: 'check', done: false, text: 'Arduino' })
    expect(lines[2]).toEqual({ kind: 'check', done: true, text: 'Reti' })
    expect(inlineParts((lines[5] as { text: string }).text)).toEqual([
      { kind: 'bold', text: 'ARGO' },
      { kind: 'text', text: ' su ' },
      { kind: 'link', text: 'https://www.portaleargo.it' },
      { kind: 'text', text: '.' },
    ])
  })

  it('spunta una riga e conta le caselle', () => {
    const text = 'Titolo\n[ ] uno\n- [x] due'
    expect(toggleNoteLine(text, 1)).toBe('Titolo\n[x] uno\n- [x] due')
    expect(toggleNoteLine(text, 2)).toBe('Titolo\n[ ] uno\n- [ ] due')
    expect(toggleNoteLine(text, 0)).toBe(text)
    expect(noteChecks(text)).toEqual({ done: 1, total: 2 })
  })

  it('fissate in cima, nuove sopra; si uniscono e restano al nuovo anno senza classi', () => {
    let data = saveNote({ ...note, courseIds: ['c1', 'sparita'] })(base())
    data = saveNote({ ...note, id: 'n2', order: topOrder(data) })(data)
    data = saveNote({ ...note, id: 'n3', order: topOrder(data), pinned: true })(data)
    expect(sortedNotes(data).map((n) => n.id)).toEqual(['n3', 'n2', 'n1'])
    expect(noteCourses(data, data.notes.n1).map((c) => c.id)).toEqual(['c1'])

    const other = deleteNote('n2')(data)
    expect(Object.keys(mergeData(data, other).notes).sort()).toEqual(['n1', 'n3'])
    expect(normalizeData(JSON.parse(JSON.stringify({ ...data, notes: undefined }))).notes).toEqual({})

    const next = startNewYear(nextSchoolYear(data.year!))(data)
    expect(Object.keys(next.notes).sort()).toEqual(['n1', 'n2', 'n3'])
    expect(next.notes.n1.courseIds).toEqual([])
  })
})

describe('appunti delle classi diventati note', () => {
  it('una nota per classe, la stessa su ogni dispositivo, che non torna se cancellata', () => {
    const raw = JSON.parse(JSON.stringify(base()))
    raw.courses.c1.notes = 'Due ragazzi con PDP'
    const data = normalizeData(raw)
    expect(data.notes['appunti-c1']).toMatchObject({ title: 'Appunti 3A', text: 'Due ragazzi con PDP', courseIds: ['c1'] })
    expect('notes' in data.courses.c1).toBe(false)
    expect(sameData(data, normalizeData(raw))).toBe(true)

    const removed = deleteNote('appunti-c1')(data)
    expect(normalizeData(JSON.parse(JSON.stringify({ ...removed, courses: raw.courses }))).notes).toEqual({})
    // Senza appunti, nessuna nota.
    expect(normalizeData(JSON.parse(JSON.stringify(base()))).notes).toEqual({})
  })
})
