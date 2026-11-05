import type { ReactNode } from 'react'
import { ChevronDownIcon, ChevronRightIcon, ListCompactIcon, ListRoomyIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import type { ListMode } from '@/state/listMode'

/**
 * Una lista con il suo titolo: toccando il titolo si chiude e si riapre; a destra si sceglie
 * tra righe estese e compatte. Il contenuto riceve il modo e si disegna di conseguenza.
 */
export function ListSection({
  title,
  count,
  badge,
  extra,
  mode,
  onMode,
  onToggleOpen,
  level = 2,
  children,
}: {
  title: ReactNode
  /** Quante voci, mostrato accanto al titolo quando la lista è chiusa. */
  count?: number
  /** Quante voci restano da fare: un numerino sempre accanto al titolo, come sul tab; al posto di `count`. */
  badge?: number
  /** Altro a destra del titolo: avanzamento, pulsanti. */
  extra?: ReactNode
  mode: ListMode
  onMode: (mode: ListMode) => void
  onToggleOpen: () => void
  level?: 2 | 3
  children: ReactNode
}) {
  const closed = mode === 'chiusa'
  const Heading = level === 2 ? 'h2' : 'h3'
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Heading className={cn('font-heading font-semibold', level === 2 ? 'text-lg' : 'text-base')}>
          <button type="button" onClick={onToggleOpen} aria-expanded={!closed} className="inline-flex items-center gap-1.5 hover:text-primary">
            {closed ? <ChevronRightIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
            {title}
            {badge !== undefined
              ? badge > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs leading-none font-semibold text-primary-foreground tabular-nums">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )
              : closed && count !== undefined && <span className="text-sm font-normal text-muted-foreground">· {count}</span>}
          </button>
        </Heading>
        <div className="flex items-center gap-2">
          {!closed && extra}
          {!closed && <ListModeToggle mode={mode} onMode={onMode} />}
        </div>
      </div>
      {!closed && children}
    </section>
  )
}

/** Righe estese o compatte: due icone, la scelta accesa. */
export function ListModeToggle({ mode, onMode, className }: { mode: ListMode; onMode: (mode: ListMode) => void; className?: string }) {
  return (
    <div className={cn('flex rounded-md border p-0.5', className)} role="group" aria-label="Righe">
      {(
        [
          ['estesa', ListRoomyIcon, 'Righe estese'],
          ['compatta', ListCompactIcon, 'Righe compatte'],
        ] as const
      ).map(([value, Icon, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          aria-label={label}
          title={label}
          onClick={() => onMode(value)}
          className={cn('rounded p-1 text-muted-foreground transition-colors hover:text-foreground', mode === value && 'bg-muted text-foreground')}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  )
}
