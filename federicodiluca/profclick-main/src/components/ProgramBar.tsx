import { weeksPassed } from '@/core/calendar'
import { today } from '@/core/dates'
import type { TopicProgress } from '@/core/progress'
import { cn } from '@/lib/utils'
import { useData } from '@/state/data'

const STATUS_TITLES: Record<TopicProgress['status'], string> = {
  'da-pianificare': 'da pianificare',
  pianificato: 'pianificato',
  'in-corso': 'in corso',
  fatto: 'fatto',
}

/**
 * Il programma a colpo d'occhio: un segmento per argomento, pieno se fatto, riempito per le
 * lezioni svolte se in corso, chiaro se in calendario. La tacca segna quanto dell'anno è
 * passato, per vedere se si è avanti o indietro. Le prove senza lezioni non contano.
 */
export function ProgramBar({ progress, className }: { progress: TopicProgress[]; className?: string }) {
  const { data } = useData()
  const topics = progress.filter((p) => !p.topic.assessmentOnly)
  if (topics.length === 0) return null
  const now = today()
  const year = data.year
  const weeks = year ? weeksPassed(year, now) : []
  const total = weeks.reduce((s, w) => s + w.weeks, 0)
  const passed = weeks.reduce((s, w) => s + w.passed, 0)
  const mark = total > 0 && passed > 0 && passed < total ? passed / total : undefined

  return (
    <div className={cn('relative', className)}>
      <div className="flex h-1.5 gap-0.5" role="presentation">
        {topics.map((p) => {
          const fill = p.status === 'fatto' ? 1 : p.status === 'in-corso' ? p.doneLessons / p.plannedLessons : 0
          return (
            <div
              key={p.topic.id}
              title={`${p.topic.title}: ${STATUS_TITLES[p.status]}`}
              className={cn('relative min-w-0 flex-1 overflow-hidden rounded-full', p.status === 'da-pianificare' ? 'bg-muted' : 'bg-done/20')}
            >
              <div className="absolute inset-y-0 left-0 bg-done transition-all" style={{ width: `${Math.min(1, fill) * 100}%` }} />
            </div>
          )
        })}
      </div>
      {mark !== undefined && (
        <div
          className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-foreground/50"
          style={{ left: `${mark * 100}%` }}
          title={`Passate ${passed} settimane di scuola su ${total}`}
        />
      )}
    </div>
  )
}
