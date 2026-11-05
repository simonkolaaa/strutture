// Date del calendario scolastico come stringhe 'YYYY-MM-DD'. Niente orari e niente fusi:
// una lezione cade in un giorno, non in un istante. I calcoli passano da Date in UTC,
// così l'ora legale non sposta mai un giorno.

export type ISODate = string

const DAY_MS = 86_400_000

function toUtc(date: ISODate): number {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

function fromUtc(ms: number): ISODate {
  return new Date(ms).toISOString().slice(0, 10)
}

export function isoDate(year: number, month: number, day: number): ISODate {
  return fromUtc(Date.UTC(year, month - 1, day))
}

/** La data di oggi nel fuso del dispositivo: è quella che vede il docente. */
export function today(): ISODate {
  const now = new Date()
  return isoDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

/** L'ora di adesso, "HH:MM". */
export function nowTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export function addDays(date: ISODate, days: number): ISODate {
  return fromUtc(toUtc(date) + days * DAY_MS)
}

export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS)
}

/** 1 = lunedì … 7 = domenica. */
export function weekday(date: ISODate): number {
  return ((new Date(toUtc(date)).getUTCDay() + 6) % 7) + 1
}

/** Il lunedì della settimana che contiene la data. */
export function startOfWeek(date: ISODate): ISODate {
  return addDays(date, 1 - weekday(date))
}

export function eachDay(from: ISODate, to: ISODate): ISODate[] {
  const days: ISODate[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d)
  return days
}

export function inRange(date: ISODate, from: ISODate, to: ISODate): boolean {
  return date >= from && date <= to
}

/** Domenica di Pasqua (calendario gregoriano, algoritmo di Meeus/Jones/Butcher). */
export function easter(year: number): ISODate {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return isoDate(year, month, day)
}

// --- Formattazione in italiano ----------------------------------------------------------

const WEEKDAYS = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica']
const WEEKDAYS_SHORT = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom']
const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']

export function weekdayName(day: number, short = false): string {
  return (short ? WEEKDAYS_SHORT : WEEKDAYS)[day - 1]
}

function parts(date: ISODate) {
  const [y, m, d] = date.split('-').map(Number)
  return { y, m, d }
}

/** "lun 29 set" */
export function formatShort(date: ISODate): string {
  const { m, d } = parts(date)
  return `${WEEKDAYS_SHORT[weekday(date) - 1]} ${d} ${MONTHS[m - 1].slice(0, 3)}`
}

/** "lunedì 29 settembre" */
export function formatLong(date: ISODate): string {
  const { m, d } = parts(date)
  return `${WEEKDAYS[weekday(date) - 1]} ${d} ${MONTHS[m - 1]}`
}

/** "29 set 2026" */
export function formatDay(date: ISODate): string {
  const { y, m, d } = parts(date)
  return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`
}

/** "29 set – 4 ott" */
export function formatRange(from: ISODate, to: ISODate): string {
  const a = parts(from)
  const b = parts(to)
  const left = a.m === b.m ? `${a.d}` : `${a.d} ${MONTHS[a.m - 1].slice(0, 3)}`
  return `${left} – ${b.d} ${MONTHS[b.m - 1].slice(0, 3)}`
}
