// Piccoli pezzi d'interfaccia usati in più pagine.

import { createElement, type ReactNode } from 'react'
import { activityLabel, type Activity, type Course, courseLabel, type ProfclickData } from '@/core/model'
import { AlertIcon, GradesIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { activityIcon } from '@/lib/activityIcons'
import { activityTone, courseColor, type GradeMark } from '@/lib/ui'

export function CourseName({ course, className }: { course: Course; className?: string }) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2', className)}>
      <span className="size-2.5 shrink-0 rounded-full" style={{ background: courseColor(course) }} />
      <span className="truncate">{courseLabel(course)}</span>
    </span>
  )
}

export function ActivityLine({ activity, data, dashed }: { activity: Activity; data: ProfclickData; dashed?: boolean }) {
  const topics = activity.topicIds.map((id) => data.topics[id]?.title).filter(Boolean)
  const detail = [topics.join(', '), activity.text].filter(Boolean).join(' · ')
  return (
    <span className={cn('flex min-w-0 items-start gap-1.5 text-sm', dashed && 'opacity-80')}>
      {createElement(activityIcon(activity), { className: cn('mt-0.5 size-4 shrink-0', activityTone(activity)) })}
      <span className="min-w-0">
        <span className="font-medium">{activityLabel(activity)}</span>
        {detail && <span className="text-muted-foreground"> · {detail}</span>}
      </span>
    </span>
  )
}

/**
 * Il segno di una lezione con voto, in un posto solo: l'avviso giallo (che lampeggia) finché c'è
 * da preparare per la prova, poi la coccarda dei voti, su un giallo tenue. Il tipo di prova lo
 * dice già il testo della lezione. Sulle schede sta a cavallo del bordo sinistro, a metà; nelle
 * righe di una lista (inline) accanto al titolo, dove il bordo sarebbe tagliato.
 */
export function GradeSign({ mark, inline }: { mark: GradeMark; inline?: boolean }) {
  const label = mark.toPrepare ? 'Da preparare per la prova' : `Si mette un voto: ${mark.label.toLowerCase()}`
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        'grid size-6 shrink-0 place-items-center rounded-full',
        mark.toPrepare ? 'grade-warn bg-[var(--grade-yellow)] text-black/80' : 'bg-[var(--grade-yellow-soft)] text-[var(--grade-yellow-ink)]',
        // Da solo nella riga lampeggia per conto suo; sulla scheda segue il bordo.
        inline ? mark.toPrepare && 'grade-pulse' : 'pointer-events-none absolute top-1/2 -left-3 z-10 -translate-y-1/2 shadow-sm ring-2 ring-background',
      )}
    >
      {mark.toPrepare ? <AlertIcon className="size-3.5" /> : <GradesIcon className="size-4" />}
    </span>
  )
}

export function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className={cn('h-1.5 overflow-hidden rounded-full bg-muted', className)} role="presentation">
      <div className="h-full rounded-full bg-done transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Scelta tra poche opzioni, a pulsanti affiancati. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div className={cn('inline-flex flex-wrap gap-1 rounded-lg bg-muted p-1', className)} role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-2.5 py-1 text-sm font-medium text-muted-foreground transition-colors',
            value === o.value ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Un'etichetta cliccabile che si accende e si spegne. */
export function Toggle({ on, onClick, children, className }: { on: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
        on ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:border-foreground/30 hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Section({ title, action, children, className }: { title: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-base font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
