// Le classi da vedere, e le riunioni: si accendono e si spengono con un tocco. La scelta vale
// per la settimana e per la lista Da fare.

import type { ReactNode } from 'react'
import { MeetingIcon } from '@/components/icons'
import { courseColor } from '@/lib/ui'
import { type Course, courseLabel } from '@/core/model'
import { cn } from '@/lib/utils'
import { MEETINGS } from '@/state/weekFilter'

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
        on ? 'bg-card text-foreground shadow-xs' : 'border-dashed text-muted-foreground line-through hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

export function CourseFilter({ courses, hidden, onToggle, onShowAll }: { courses: Course[]; hidden: Set<string>; onToggle: (id: string) => void; onShowAll: () => void }) {
  const anyHidden = hidden.has(MEETINGS) || courses.some((c) => hidden.has(c.id))
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Classi e riunioni da vedere">
      {courses.map((course) => {
        const on = !hidden.has(course.id)
        return (
          <Chip key={course.id} on={on} onClick={() => onToggle(course.id)}>
            <span
              className="size-2.5 shrink-0 rounded-full border-2"
              style={{ borderColor: courseColor(course), background: on ? courseColor(course) : 'transparent' }}
            />
            {courseLabel(course)}
          </Chip>
        )
      })}
      <Chip on={!hidden.has(MEETINGS)} onClick={() => onToggle(MEETINGS)}>
        <MeetingIcon className="size-3.5 shrink-0 text-pencil-blue" />
        Riunioni
      </Chip>
      {anyHidden && (
        <button type="button" onClick={onShowAll} className="px-1.5 text-xs font-medium text-primary hover:underline">
          Mostra tutte
        </button>
      )}
    </div>
  )
}
