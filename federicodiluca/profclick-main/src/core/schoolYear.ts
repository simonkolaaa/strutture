// L'anno scolastico proposto alla prima apertura: date e festività nazionali già pronte,
// da ritoccare con il calendario della propria regione. Meglio correggere due date che
// inserirne venti.

import { addDays, easter, isoDate, weekday, type ISODate } from './dates'
import type { Holiday, Period, SchoolYear } from './model'

export type PeriodPreset = 'quadrimestri' | 'trimestre-pentamestre'

export const PERIOD_PRESETS: Record<PeriodPreset, string> = {
  quadrimestri: 'Due quadrimestri',
  'trimestre-pentamestre': 'Trimestre e pentamestre',
}

/** L'anno scolastico in corso a una data: da settembre si passa al successivo. */
export function schoolYearStart(date: ISODate): number {
  const [y, m] = date.split('-').map(Number)
  return m >= 8 ? y : y - 1
}

/** Il primo lunedì dal 12 settembre: la data di inizio più comune tra le regioni. */
function firstDay(year: number): ISODate {
  let d = isoDate(year, 9, 12)
  while (weekday(d) !== 1) d = addDays(d, 1)
  return d
}

export function presetPeriods(preset: PeriodPreset, start: ISODate, end: ISODate): Period[] {
  const y = Number(start.slice(0, 4))
  if (preset === 'quadrimestri') {
    return [
      { id: 'p1', name: '1° quadrimestre', start, end: isoDate(y + 1, 1, 31) },
      { id: 'p2', name: '2° quadrimestre', start: isoDate(y + 1, 2, 1), end },
    ]
  }
  return [
    { id: 'p1', name: 'Trimestre', start, end: isoDate(y, 12, 31) },
    { id: 'p2', name: 'Pentamestre', start: isoDate(y + 1, 1, 1), end },
  ]
}

/** Festività nazionali e vacanze più diffuse; quelle regionali si aggiungono a mano. */
export function nationalHolidays(startYear: number): Holiday[] {
  const y = startYear
  const e = easter(y + 1)
  const list: Omit<Holiday, 'id'>[] = [
    { name: 'Ognissanti', from: isoDate(y, 11, 1), to: isoDate(y, 11, 1) },
    { name: 'Immacolata', from: isoDate(y, 12, 8), to: isoDate(y, 12, 8) },
    { name: 'Vacanze di Natale', from: isoDate(y, 12, 23), to: isoDate(y + 1, 1, 6) },
    { name: 'Vacanze di Pasqua', from: addDays(e, -3), to: addDays(e, 2) },
    { name: 'Festa della Liberazione', from: isoDate(y + 1, 4, 25), to: isoDate(y + 1, 4, 25) },
    { name: 'Festa dei lavoratori', from: isoDate(y + 1, 5, 1), to: isoDate(y + 1, 5, 1) },
    { name: 'Festa della Repubblica', from: isoDate(y + 1, 6, 2), to: isoDate(y + 1, 6, 2) },
    // In fondo per non cambiare gli id delle altre: in pagina si ordinano per data.
    { name: 'Commemorazione dei defunti', from: isoDate(y, 11, 2), to: isoDate(y, 11, 2) },
    // Di nuovo festa nazionale dal 2026.
    ...(y >= 2026 ? [{ name: 'San Francesco', from: isoDate(y, 10, 4), to: isoDate(y, 10, 4) }] : []),
  ]
  return list.map((h, i) => ({ ...h, id: `h${i + 1}` }))
}

export function defaultSchoolYear(startYear: number, preset: PeriodPreset = 'quadrimestri'): SchoolYear {
  const start = firstDay(startYear)
  const end = isoDate(startYear + 1, 6, 8)
  return {
    label: `${startYear}/${String(startYear + 1).slice(2)}`,
    start,
    end,
    periods: presetPeriods(preset, start, end),
    holidays: nationalHolidays(startYear),
    updatedAt: 0,
  }
}
