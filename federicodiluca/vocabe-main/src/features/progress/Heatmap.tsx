import { useMemo } from 'react'
import { addDays, localDateKey } from '@/core/date'
import { cn } from '@/ui/cn'

const WEEKS = 18

/** GitHub-style activity grid: one cell per day for the last ~18 weeks. */
export function Heatmap({ activeDays }: { activeDays: string[] }) {
  const { cells, today } = useMemo(() => {
    const today = localDateKey()
    const active = new Set(activeDays)
    const jsDow = new Date().getDay() // 0 = Sun
    const monFirst = (jsDow + 6) % 7 // 0 = Mon
    const end = addDays(today, 6 - monFirst) // Sunday of the current week
    const start = addDays(end, -(WEEKS * 7 - 1))

    const cells: { date: string; active: boolean; future: boolean }[] = []
    for (let i = 0; i < WEEKS * 7; i++) {
      const date = addDays(start, i)
      cells.push({ date, active: active.has(date), future: date > today })
    }
    return { cells, today }
  }, [activeDays])

  return (
    <div className="overflow-x-auto">
      <div
        className="grid w-max gap-[3px]"
        style={{ gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column' }}
        role="img"
        aria-label={`${activeDays.length} giorni attivi`}
      >
        {cells.map((c) => (
          <span
            key={c.date}
            title={c.date}
            className={cn(
              'h-3 w-3 rounded-[3px]',
              c.future ? 'bg-transparent' : c.active ? 'bg-brand' : 'bg-line',
              c.date === today && 'ring-1 ring-brand ring-offset-1 ring-offset-paper',
            )}
          />
        ))}
      </div>
    </div>
  )
}
