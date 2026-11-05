import { type CSSProperties, useState } from 'react'
import { Link } from 'wouter'
import { ChevronLeftIcon, ChevronRightIcon, PrintIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { addDays, formatRange, weekdayName } from '@/core/dates'
import { cellKey, type TimetableEntry, timetable } from '@/core/timetable'
import { LessonDialog } from '@/features/lesson/LessonDialog'
import { courseColor, formatHours } from '@/lib/ui'
import { cn } from '@/lib/utils'
import { currentWeek } from '@/lib/week'
import { useData } from '@/state/data'

/**
 * L'orario di tutte le classi in una settimana, in una griglia, da stampare (anche in PDF) o
 * tenere sul telefono. È quello della Settimana: con i cambi d'orario e le lezioni cambiate a mano.
 */
export default function TimetablePage() {
  const { data } = useData()
  const [monday, setMonday] = useState(() => currentWeek(data))
  const [open, setOpen] = useState<TimetableEntry | null>(null)
  const thisWeek = monday === currentWeek(data)
  const t = timetable(data, monday)
  const hours = Array.from({ length: t.rows }, (_, i) => i + 1)
  const hasUnplaced = t.unplaced.size > 0
  const empty = t.rows === 0 && !hasUnplaced && t.floating.length === 0 && t.holidays.size === 0
  const columns = { gridTemplateColumns: `${t.rows > 0 ? '2.25rem ' : ''}repeat(${t.days.length}, minmax(0, 1fr))` }
  // Le righe della griglia: i giorni, le ore di scuola e, se servono, le lezioni senza ora.
  const lastRow = t.rows + 2

  return (
    <div className="timetable space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <Link to="/classi" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeftIcon className="size-4" /> Classi
          </Link>
          <h1 className="font-heading text-2xl font-bold">Orario</h1>
          <p className="text-muted-foreground">
            {thisWeek ? 'Questa settimana, ' : 'Settimana '}
            {formatRange(monday, addDays(monday, t.days.length - 1))}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {!empty && (
            <Button variant="outline" onClick={() => window.print()} aria-label="Stampa o salva in PDF">
              <PrintIcon /> <span className="hidden sm:inline">Stampa o salva in PDF</span>
            </Button>
          )}
          <Button variant="outline" size="icon" aria-label="Settimana precedente" onClick={() => setMonday(addDays(monday, -7))}>
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" onClick={() => setMonday(currentWeek(data))} disabled={thisWeek}>
            Oggi
          </Button>
          <Button variant="outline" size="icon" aria-label="Settimana successiva" onClick={() => setMonday(addDays(monday, 7))}>
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
      <h1 className="hidden font-heading text-xl font-bold print:block">
        Orario · settimana {formatRange(monday, addDays(monday, t.days.length - 1))}
      </h1>

      {empty ? (
        <p className="text-muted-foreground">Ancora nessuna classe con l'orario.</p>
      ) : (
        <>
          <div className="grid gap-1 text-sm" style={columns}>
            {t.rows > 0 && <span />}
            {t.days.map((day, i) => (
              <span key={day} className="pb-1 text-center text-xs font-semibold capitalize" style={{ gridColumn: i + (t.rows > 0 ? 2 : 1), gridRow: 1 }}>
                <span className="sm:hidden">{weekdayName(day, true)}</span>
                <span className="hidden sm:inline">{weekdayName(day)}</span>
                {t.holidays.has(day) && <span className="block truncate font-normal normal-case text-muted-foreground">{t.holidays.get(day)}</span>}
              </span>
            ))}

            {hours.map((hour) => (
              <span key={hour} className="grid place-items-center text-xs text-muted-foreground tabular-nums" style={{ gridColumn: 1, gridRow: hour + 1 }}>
                {hour}ª
              </span>
            ))}
            {/* Prima le caselle vuote, poi le lezioni sopra: una lezione di due ore occupa due caselle. */}
            {hours.flatMap((hour) =>
              t.days.map((day, i) => (
                <span key={`${day}-${hour}`} className="min-h-12 rounded-lg border border-dashed" style={{ gridColumn: i + 2, gridRow: hour + 1 }} />
              )),
            )}
            {hours.flatMap((hour) =>
              t.days.map((day, i) => {
                const entry = t.cells.get(cellKey(day, hour))
                return (
                  entry && (
                    <Cell key={`c${day}-${hour}`} entry={entry} onOpen={setOpen} style={{ gridColumn: i + 2, gridRow: `${hour + 1} / span ${Math.ceil(entry.hours)}` }} />
                  )
                )
              }),
            )}

            {hasUnplaced && (
              <>
                {t.rows > 0 && (
                  <span className="pt-2 text-[0.65rem] leading-tight text-muted-foreground" style={{ gridColumn: 1, gridRow: lastRow }}>
                    senza ora
                  </span>
                )}
                {t.days.map((day, i) => (
                  <div key={`u${day}`} className={cn('space-y-1', t.rows > 0 && 'pt-2')} style={{ gridColumn: i + (t.rows > 0 ? 2 : 1), gridRow: lastRow }}>
                    {(t.unplaced.get(day) ?? []).map((entry, j) => (
                      <Cell key={j} entry={entry} showHours onOpen={setOpen} />
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>

          {t.floating.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold">Senza giorno fisso</h2>
              <div className="flex flex-wrap gap-1">
                {t.floating.map((entry, i) => (
                  <Cell key={i} entry={entry} showHours onOpen={setOpen} className="w-32" />
                ))}
              </div>
            </section>
          )}

          {t.rows > 0 && hasUnplaced && (
            <p className="text-xs text-muted-foreground print:hidden">
              Per mettere nella griglia le lezioni senza ora, indica l'ora d'inizio in <em>Orario e regole</em> di ogni classe.
            </p>
          )}
        </>
      )}
      <LessonDialog courseId={open?.course.id ?? ''} date={open?.date ?? null} onClose={() => setOpen(null)} />
    </div>
  )
}

function Cell({
  entry,
  showHours,
  style,
  className,
  onOpen,
}: {
  entry: TimetableEntry
  showHours?: boolean
  style?: CSSProperties
  className?: string
  onOpen: (entry: TimetableEntry) => void
}) {
  const color = courseColor(entry.course)
  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      title={entry.cancelled ? 'Lezione saltata' : undefined}
      className={cn(
        'flex min-w-0 flex-col justify-center rounded-lg border-l-4 px-1.5 py-1 text-left leading-tight transition-opacity hover:opacity-80 sm:px-2',
        entry.cancelled && 'line-through opacity-50',
        className,
      )}
      style={{ ...style, borderColor: color, background: `color-mix(in oklab, ${color} 16%, var(--card))` }}
    >
      <span className="truncate font-semibold">{entry.course.className}</span>
      {entry.course.subject && <span className="hidden truncate text-xs text-muted-foreground sm:block print:block">{entry.course.subject}</span>}
      {(entry.lab || showHours) && (
        <span className="truncate text-[0.65rem] text-muted-foreground">{[showHours && formatHours(entry.hours), entry.lab && 'ITP'].filter(Boolean).join(' · ')}</span>
      )}
    </button>
  )
}
