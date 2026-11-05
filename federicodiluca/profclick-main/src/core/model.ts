// Il modello dei dati (ADR 0004). Tutto sta in un solo documento JSON, salvato sul
// dispositivo e sul Drive dell'utente. Ogni record porta updatedAt: quando due dispositivi
// hanno modificato i dati, l'unione (merge.ts) tiene per ogni record la versione più recente.

import { type ISODate, today } from './dates'

export interface Stamped {
  /** Millisecondi dell'ultima modifica: decide quale versione vince nell'unione. */
  updatedAt: number
}

// --- Anno scolastico --------------------------------------------------------------------

export interface Period {
  id: string
  /** "1° quadrimestre", "Trimestre", … */
  name: string
  start: ISODate
  end: ISODate
}

/** Giorni senza lezione: festività, vacanze, ponti, santo patrono. */
export interface Holiday {
  id: string
  name: string
  from: ISODate
  to: ISODate
}

export interface SchoolYear extends Stamped {
  /** "2026/27" */
  label: string
  start: ISODate
  end: ISODate
  periods: Period[]
  holidays: Holiday[]
}

// --- Classi -----------------------------------------------------------------------------

/** I tre tipi di voto (ADR 0005). */
export type GradeType = 'scritto' | 'teorico' | 'pratico'

export const GRADE_TYPES: GradeType[] = ['scritto', 'teorico', 'pratico']

export interface GradeRules {
  /** Voti pieni per periodo; null = automatico, uno per ogni ora settimanale. */
  perPeriod: number | null
  /** Tipi che devono comparire almeno una volta per periodo. */
  required: GradeType[]
  /** Peso proposto per i voti minori, in percentuale di un voto pieno. */
  minorWeight: number
}

/**
 * Una lezione della settimana tipo. Il giorno è facoltativo (ADR 0008): a chi non vuole
 * configurare l'orario basta dire quante lezioni ha e di quante ore, in ordine.
 */
export interface ScheduleSlot {
  /** 1 = lunedì … 6 = sabato; null = giorno non indicato. */
  day: number | null
  hours: number
  /** In laboratorio o in compresenza con l'ITP: il posto giusto per le prove pratiche. */
  lab: boolean
  /** A che ora di scuola inizia (1 = prima ora), se si vuole: serve solo a mettere in ordine la giornata. */
  start?: number
}

/** Un orario che valeva fino a un certo giorno: nelle prime settimane l'orario cambia spesso. */
export interface PastSchedule {
  /** Ultimo giorno in cui valeva. */
  until: ISODate
  schedule: ScheduleSlot[]
}

/** Qualcosa da preparare: slide, esercizi, un laboratorio. */
export interface PrepItem {
  id: string
  text: string
  /** L'argomento per cui serve: da lì si sa entro quando. */
  topicId: string | null
  done: boolean
}

/** Una classe con la sua materia: "3J · TPSIT". */
export interface Course extends Stamped {
  id: string
  className: string
  subject: string
  /** Indice nella tavolozza dei colori delle classi. */
  color: number
  /** L'orario in vigore, dal giorno dopo l'ultimo degli orari precedenti. */
  schedule: ScheduleSlot[]
  /** Gli orari precedenti, in ordine di data: le lezioni passate restano nei loro giorni. */
  pastSchedules: PastSchedule[]
  rules: GradeRules
  /** Ore di educazione civica da svolgere, per periodo. */
  civics: Record<string, number>
  /** Note per lo scrutinio, per periodo: recuperi, accordi, chi tenere d'occhio. */
  periodNotes: Record<string, string>
  prep: PrepItem[]
  order: number
}

/** Una valutazione prevista per un argomento, prima di avere una data. */
export interface PlannedAssessment {
  id: string
  type: GradeType
  /** Percentuale di un voto pieno: 100 = voto pieno, meno = voto minore. */
  weight: number
  /** "con orale", "prova parallela", "flipped classroom"… */
  text: string
  /** Segnata come fatta a mano, senza una lezione in calendario (es. prima di usare ProfClick). */
  done: boolean
}

/** Un macro-argomento del programma. */
export interface Topic extends Stamped {
  id: string
  courseId: string
  title: string
  /** Una voce che è solo una valutazione (es. prova parallela): niente da spiegare. */
  assessmentOnly?: boolean
  /** Il periodo in cui va svolto; null = non ancora deciso. */
  periodId: string | null
  /** Sotto-punti, come promemoria: non si pianificano uno per uno. */
  points: string[]
  /** Le valutazioni da fare alla fine dell'argomento, nell'ordine. */
  assessments: PlannedAssessment[]
  /** Segnato come concluso a mano (es. svolto prima di usare ProfClick). */
  completed: boolean
  order: number
}

// --- Lezioni ----------------------------------------------------------------------------

export type ActivityKind = 'spiegazione' | 'esercitazione' | 'laboratorio' | 'ripasso' | 'verifica' | 'civica' | 'altro'

export interface Assessment {
  type: GradeType
  /** Percentuale di un voto pieno: sotto 100 è un voto minore, che non conta nel minimo. */
  weight: number
  /**
   * Prosegue una valutazione iniziata in una lezione precedente: il giro di interrogazioni
   * su più lezioni, o il recupero per gli assenti. Non è un voto in più.
   */
  continues: boolean
  /** Recupero per chi era assente: sempre insieme a continues. */
  makeup?: boolean
  /** La valutazione prevista nel programma da cui nasce, se c'è. */
  plannedId?: string
}

/** Un passo di un'attività (ADR 0022): prima la si prepara, dopo si corregge e si mettono i voti. */
export type StepKey =
  | 'prova'
  | 'rivedere'
  | 'slide'
  | 'esercizi'
  | 'laboratorio'
  | 'materiale'
  | 'stampa'
  | 'correggi'
  | 'riconsegna'
  | 'registro'
  | 'recupero'
  | 'archivia'
  /** Un passo scritto a mano, da preparare o da fare dopo: dopo i due punti c'è il suo testo. */
  | `altro:${string}`
  | `dopo:${string}`

export interface ActivityStep {
  key: StepKey
  done: boolean
}

export interface Activity {
  id: string
  kind: ActivityKind
  topicIds: string[]
  /** Dettaglio libero: "esercizi pag. 42", "gruppo B". */
  text: string
  /** Presente solo per kind = 'verifica'. */
  assessment?: Assessment
  /** Il materiale è pronto: la spunta di prima dei passi, vale finché non si toccano i passi. */
  ready?: boolean
  /** I passi, prima e dopo, quando si sono toccati; senza, valgono quelli proposti (steps.ts). */
  steps?: ActivityStep[]
  /** Ripete un'attività di una lezione precedente (l'id di quella): ne segue tipo, argomenti e dettagli. */
  repeatOf?: string
}

/**
 * Quello che si fa in un giorno di lezione di una classe. Esiste solo per i giorni in cui
 * c'è qualcosa: i giorni di lezione si ricavano dall'orario (calendar.ts).
 */
export interface Lesson extends Stamped {
  courseId: string
  date: ISODate
  activities: Activity[]
  done: boolean
  /** Lezione saltata (gita, assemblea, sciopero): non conta tra quelle disponibili. */
  cancelled: boolean
  note: string
  /** Aggiunta a mano, fuori dall'orario: supplenza, recupero, ora scambiata (ADR 0018). */
  extra?: boolean
  /** Lezione dell'orario tolta, o spostata in un altro giorno: non si vede e non conta. */
  removed?: boolean
  /** Ore, ora d'inizio e ITP di questa lezione, quando non sono quelli dell'orario. */
  hours?: number
  start?: number
  lab?: boolean
}

/**
 * Fatta: segnata a mano, oppure già passata con qualcosa in programma e non saltata (ADR 0019).
 * Una lezione pianificata è quasi sempre una lezione fatta: non si chiede di confermarla.
 */
export function isDone(lesson: Lesson | undefined, now: ISODate = today()): boolean {
  if (!lesson || lesson.cancelled) return false
  return lesson.done || (lesson.date < now && lesson.activities.length > 0)
}

/** Fatta da sola perché passata: la spunta non si toglie, per cambiarla si salta o si sposta. */
export function isAutoDone(lesson: Lesson | undefined, now: ISODate = today()): boolean {
  return isDone(lesson, now) && Boolean(lesson && lesson.date < now && lesson.activities.length > 0)
}

export function lessonKey(courseId: string, date: ISODate): string {
  return `${courseId}@${date}`
}

export function isMinor(a: { weight: number }): boolean {
  return a.weight < 100
}

// --- Riunioni (ADR 0011) ----------------------------------------------------------------

export type MeetingKind = 'cdc' | 'scrutinio' | 'glo' | 'collegio' | 'dipartimento' | 'corso' | 'altro'

export const MEETING_KINDS: MeetingKind[] = ['cdc', 'scrutinio', 'glo', 'collegio', 'dipartimento', 'corso', 'altro']

/** Una cosa da preparare per una riunione, o da fare dopo (il verbale). */
export interface MeetingPrep {
  id: string
  text: string
  done: boolean
  /** Da fare dopo la riunione: resta tra le cose da fare finché non è fatta. */
  after?: boolean
}

/** Consiglio di classe, scrutinio, collegio, corso: gli impegni del pomeriggio. */
export interface Meeting extends Stamped {
  id: string
  kind: MeetingKind
  date: ISODate
  /** "15:00"; vuoto se l'ora non conta o non si sa ancora. */
  time: string
  /** Il nome della classe ("3J"), per consiglio, scrutinio e GLO; null per le altre. */
  className: string | null
  /** "Corso sulla sicurezza", "Collegio di inizio anno"; vuoto = il nome del tipo. */
  title: string
  /** Coordinatore di quella classe: aggiunge le sue cose da preparare. */
  coordinator: boolean
  /** Scrive il verbale (segretario, coordinatore, referente): aggiunge il verbale da fare dopo. */
  minutes?: boolean
  prep: MeetingPrep[]
  notes: string
}

// --- Note (ADR 0023) -------------------------------------------------------------------

/**
 * Una nota della bacheca, come su Keep: un titolo e un testo libero. Le righe che iniziano con
 * "[ ]" o "[x]" si spuntano, quelle con "-" sono un elenco (notes.ts).
 */
export interface Note extends Stamped {
  id: string
  title: string
  text: string
  /** Le classi di cui parla: la nota compare anche nei loro Appunti. Vuoto = nota generale. */
  courseIds: string[]
  /** Fissata in cima alla bacheca. */
  pinned: boolean
  /** Posizione nella bacheca: le nuove vanno in cima, con un numero più basso. */
  order: number
}

// --- Anni precedenti (ADR 0012) ---------------------------------------------------------

/** Un argomento di un anno concluso: lo stesso di prima, senza la classe e la data di modifica. */
export type ArchivedTopic = Omit<Topic, 'courseId' | 'updatedAt'>

/** Una classe di un anno concluso, con il suo programma: da qui si copia nelle classi nuove. */
export interface ArchivedCourse {
  id: string
  className: string
  subject: string
  color: number
  /** Gli argomenti in ordine; completed dice se a fine anno era svolto. */
  topics: ArchivedTopic[]
}

export interface ArchivedYear extends Stamped {
  /** "2026/27": è anche la chiave nell'archivio. */
  label: string
  /** I periodi di quell'anno: servono a rimettere gli argomenti nel periodo corrispondente. */
  periods: Period[]
  courses: ArchivedCourse[]
}

// --- Il documento -----------------------------------------------------------------------

export interface ProfclickData {
  schema: 1
  year: SchoolYear | null
  courses: Record<string, Course>
  topics: Record<string, Topic>
  lessons: Record<string, Lesson>
  meetings: Record<string, Meeting>
  notes: Record<string, Note>
  /** Gli anni conclusi, per etichetta. */
  archive: Record<string, ArchivedYear>
  /**
   * Record cancellati, come "collezione:chiave" → quando. Servono all'unione: senza, un
   * record cancellato qui tornerebbe dall'altro dispositivo che lo ha ancora.
   */
  deleted: Record<string, number>
}

export type Collection = 'courses' | 'topics' | 'lessons' | 'meetings' | 'notes' | 'archive'

export function emptyData(): ProfclickData {
  return { schema: 1, year: null, courses: {}, topics: {}, lessons: {}, meetings: {}, notes: {}, archive: {}, deleted: {} }
}

// --- Lettura tollerante -----------------------------------------------------------------

type Loose<T> = Partial<T> & Record<string, unknown>

/** L'orario delle prime versioni era un oggetto giorno → ore. */
function normalizeSchedule(raw: unknown): ScheduleSlot[] {
  if (Array.isArray(raw)) {
    return raw.map((s: Loose<ScheduleSlot>) => ({
      day: s.day ?? null,
      hours: Number(s.hours) || 0,
      lab: Boolean(s.lab),
      ...(Number(s.start) > 0 && { start: Number(s.start) }),
    }))
  }
  if (raw && typeof raw === 'object') {
    return Object.entries(raw as Record<string, number>)
      .filter(([, h]) => h)
      .map(([day, hours]) => ({ day: Number(day), hours, lab: false }))
  }
  return []
}

function normalizeCourse(raw: Loose<Course>): Course {
  // Gli appunti della classe ora sono una nota della bacheca (appuntiNotes).
  const { notes: _notes, ...c } = raw
  return {
    ...(c as Course),
    schedule: normalizeSchedule(c.schedule),
    pastSchedules: (c.pastSchedules ?? []).map((p) => ({ until: p.until, schedule: normalizeSchedule(p.schedule) })),
    civics: c.civics ?? {},
    periodNotes: c.periodNotes ?? {},
    prep: c.prep ?? [],
  }
}

/**
 * Prima di poter spuntare le valutazioni, un argomento concluso non ne aveva più da fare.
 * Le ore stimate non ci sono più (ADR 0020): 0 ore voleva dire solo una valutazione.
 */
function normalizeTopic<T extends ArchivedTopic>(t: Loose<T> & { hours?: unknown }): T {
  const { hours, ...rest } = t
  const assessments = (t.assessments ?? []).map((a) => ({ ...a, done: a.done ?? Boolean(t.completed) }))
  const assessmentOnly = t.assessmentOnly || hours === 0
  return { ...(rest as T), points: t.points ?? [], assessments, ...(assessmentOnly && { assessmentOnly: true }) }
}

function normalizeArchivedYear(y: Loose<ArchivedYear>): ArchivedYear {
  return { ...(y as ArchivedYear), courses: (y.courses ?? []).map((c) => ({ ...c, topics: (c.topics ?? []).map((t) => normalizeTopic<ArchivedTopic>(t as Loose<ArchivedTopic>)) })) }
}

/** Le prime versioni avevano minor: boolean al posto del peso. */
function normalizeAssessment(a: Loose<Assessment> & { minor?: boolean }): Assessment {
  const { minor, ...rest } = a
  return { ...(rest as Assessment), weight: a.weight ?? (minor ? 50 : 100), continues: a.continues ?? false }
}

function normalizeLesson(l: Loose<Lesson>): Lesson {
  return {
    ...(l as Lesson),
    activities: (l.activities ?? []).map((a) => (a.assessment ? { ...a, assessment: normalizeAssessment(a.assessment as Loose<Assessment>) } : a)),
  }
}

/** Le voci che prima stavano tra le cose da preparare e si fanno dopo la riunione. */
const OLD_AFTER = new Set(['Verbale', 'Verbale del GLO', 'Comunicazioni alle famiglie'])

function normalizeMeeting(m: Loose<Meeting>): Meeting {
  const prep = (m.prep ?? []).map((p) => (p.after === undefined && OLD_AFTER.has(p.text) ? { ...p, after: true } : p))
  const minutes = m.minutes ?? prep.some((p) => p.text.startsWith('Verbale'))
  return { ...(m as Meeting), time: m.time ?? '', className: m.className ?? null, title: m.title ?? '', coordinator: Boolean(m.coordinator), minutes, prep, notes: m.notes ?? '' }
}

function normalizeNote(n: Loose<Note>): Note {
  return { ...(n as Note), title: n.title ?? '', text: n.text ?? '', courseIds: n.courseIds ?? [], pinned: Boolean(n.pinned), order: n.order ?? 0 }
}

/**
 * Prima delle note (ADR 0023) ogni classe aveva i suoi appunti, un testo solo: diventano una
 * nota collegata alla classe. L'id viene dalla classe, così ogni dispositivo crea la stessa nota
 * e non un doppione; una volta cancellata, non torna.
 */
function appuntiNotes(courses: Record<string, Loose<Course>>, notes: Record<string, Note>, deleted: Record<string, number>): Record<string, Note> {
  const result = { ...notes }
  for (const [courseId, c] of Object.entries(courses)) {
    const text = typeof c.notes === 'string' ? c.notes.trim() : ''
    const id = `appunti-${courseId}`
    if (!text || result[id] || deleted[`notes:${id}`] !== undefined) continue
    result[id] = { id, title: `Appunti ${c.className ?? ''}`.trim(), text, courseIds: [courseId], pinned: false, order: 0, updatedAt: c.updatedAt ?? 0 }
  }
  return result
}

function mapValues<T, U>(record: Record<string, T> | undefined, fn: (value: T) => U): Record<string, U> {
  return Object.fromEntries(Object.entries(record ?? {}).map(([k, v]) => [k, fn(v)]))
}

/** Legge un documento salvato, tollerando campi mancanti di versioni precedenti. */
export function normalizeData(raw: unknown): ProfclickData {
  const value = (raw ?? {}) as Partial<ProfclickData>
  return {
    schema: 1,
    year: value.year ?? null,
    courses: mapValues(value.courses as Record<string, Loose<Course>>, normalizeCourse),
    topics: mapValues(value.topics as Record<string, Loose<Topic>>, (t) => normalizeTopic<Topic>(t)),
    lessons: mapValues(value.lessons as Record<string, Loose<Lesson>>, normalizeLesson),
    meetings: mapValues(value.meetings as Record<string, Loose<Meeting>>, normalizeMeeting),
    notes: appuntiNotes(
      (value.courses ?? {}) as Record<string, Loose<Course>>,
      mapValues(value.notes as Record<string, Loose<Note>>, normalizeNote),
      value.deleted ?? {},
    ),
    archive: mapValues(value.archive as Record<string, Loose<ArchivedYear>>, normalizeArchivedYear),
    deleted: value.deleted ?? {},
  }
}

export function isEmptyData(data: ProfclickData): boolean {
  return !data.year && Object.keys(data.courses).length === 0 && Object.keys(data.meetings).length === 0 && Object.keys(data.notes).length === 0 && Object.keys(data.archive).length === 0 && Object.keys(data.deleted).length === 0
}

// --- Etichette --------------------------------------------------------------------------

export const GRADE_LABELS: Record<GradeType, string> = {
  scritto: 'Scritto',
  teorico: 'Orale',
  pratico: 'Pratico',
}

const ASSESSMENT_LABELS: Record<GradeType, string> = {
  scritto: 'Verifica scritta',
  teorico: 'Interrogazione',
  pratico: 'Prova pratica',
}

export const KIND_LABELS: Record<ActivityKind, string> = {
  spiegazione: 'Spiegazione',
  esercitazione: 'Esercitazione',
  laboratorio: 'Laboratorio',
  ripasso: 'Ripasso',
  verifica: 'Valutazione',
  civica: 'Educazione civica',
  altro: 'Altro',
}

export function assessmentLabel(a: { type: GradeType; weight: number }): string {
  return isMinor(a) ? `${GRADE_LABELS[a.type]} ${a.weight}%` : ASSESSMENT_LABELS[a.type]
}

export function activityLabel(activity: Activity): string {
  const a = activity.assessment
  if (activity.kind !== 'verifica' || !a) return KIND_LABELS[activity.kind]
  if (a.makeup) return `${assessmentLabel(a)} (recupero)`
  return a.continues ? `${assessmentLabel(a)} (continua)` : assessmentLabel(a)
}

export const MEETING_LABELS: Record<MeetingKind, string> = {
  cdc: 'Consiglio di classe',
  scrutinio: 'Scrutinio',
  glo: 'GLO',
  collegio: 'Collegio docenti',
  dipartimento: 'Dipartimento',
  corso: 'Corso',
  altro: 'Riunione',
}

/** Le riunioni che riguardano una classe. */
export function isClassMeeting(kind: MeetingKind): boolean {
  return kind === 'cdc' || kind === 'scrutinio' || kind === 'glo'
}

/** "Scrutinio 3J", "Corso sulla sicurezza", "Collegio docenti". */
export function meetingLabel(m: Pick<Meeting, 'kind' | 'title' | 'className'>): string {
  const base = m.title.trim() || MEETING_LABELS[m.kind]
  return m.className && isClassMeeting(m.kind) ? `${base} ${m.className}` : base
}

export function courseLabel(course: Course): string {
  return course.subject ? `${course.className} · ${course.subject}` : course.className
}

export function weeklyHours(course: Course): number {
  return course.schedule.reduce((sum, s) => sum + s.hours, 0)
}

/** L'orario in vigore in un giorno. */
export function scheduleAt(course: Course, date: ISODate): ScheduleSlot[] {
  return course.pastSchedules.find((p) => date <= p.until)?.schedule ?? course.schedule
}

/** Stesse lezioni negli stessi giorni: l'ora d'inizio non conta, perché non sposta il piano. */
export function sameSchedule(a: ScheduleSlot[], b: ScheduleSlot[]): boolean {
  const key = (s: ScheduleSlot[]) => JSON.stringify(s.filter((x) => x.hours > 0).map((x) => [x.day, x.hours, x.lab]))
  return key(a) === key(b)
}
