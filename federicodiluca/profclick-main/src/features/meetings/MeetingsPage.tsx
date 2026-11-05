import { useState } from 'react'
import { MeetingIcon, PlusIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { formatLong, today } from '@/core/dates'
import { pendingAfter, sortedMeetings } from '@/core/meetings'
import { type Meeting, meetingLabel } from '@/core/model'
import { cn } from '@/lib/utils'
import { ListSection } from '@/components/ListSection'
import { useData } from '@/state/data'
import { useListMode } from '@/state/listMode'
import { MeetingDialog } from './MeetingDialog'

/**
 * Consigli, scrutini, collegi e corsi: quelli che arrivano, quelli passati con ancora qualcosa da
 * fare dopo (il verbale) e, a richiesta, gli altri passati.
 */
export default function MeetingsPage() {
  const { data } = useData()
  const now = today()
  const [open, setOpen] = useState<string | null>(null)
  const toFinishMode = useListMode('riunioni-da-completare')
  const upcomingMode = useListMode('riunioni-prossime')
  const pastMode = useListMode('riunioni-passate', 'chiusa')
  const all = sortedMeetings(data)
  const toFinish = all.filter((m) => m.date < now && pendingAfter(m).length > 0)
  const upcoming = all.filter((m) => m.date >= now)
  const past = all.filter((m) => m.date < now && !toFinish.includes(m)).reverse()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Riunioni</h1>
        <Button onClick={() => setOpen('new')}>
          <PlusIcon /> Nuova riunione
        </Button>
      </div>

      {toFinish.length > 0 && (
        <ListSection title="Da completare" count={toFinish.length} mode={toFinishMode.mode} onMode={toFinishMode.setMode} onToggleOpen={toFinishMode.toggleOpen}>
          <MeetingGrid meetings={toFinish} past compact={toFinishMode.mode === 'compatta'} onOpen={setOpen} />
        </ListSection>
      )}

      {upcoming.length === 0 ? (
        <p className="text-muted-foreground">
          Consigli di classe, scrutini, GLO, collegi, dipartimenti e corsi, con le cose da preparare: compaiono nella settimana e nel Da fare
          quando si avvicinano. Per consigli e scrutini trovi già la situazione della classe con i voti e il programma.
        </p>
      ) : (
        <ListSection title="Prossime" count={upcoming.length} mode={upcomingMode.mode} onMode={upcomingMode.setMode} onToggleOpen={upcomingMode.toggleOpen}>
          <MeetingGrid meetings={upcoming} compact={upcomingMode.mode === 'compatta'} onOpen={setOpen} />
        </ListSection>
      )}

      {past.length > 0 && (
        <ListSection title="Passate" count={past.length} mode={pastMode.mode} onMode={pastMode.setMode} onToggleOpen={pastMode.toggleOpen}>
          <MeetingGrid meetings={past} past compact={pastMode.mode === 'compatta'} onOpen={setOpen} />
        </ListSection>
      )}

      <MeetingDialog open={open} onClose={() => setOpen(null)} />
    </div>
  )
}

function MeetingGrid({ meetings, past, compact, onOpen }: { meetings: Meeting[]; past?: boolean; compact: boolean; onOpen: (id: string) => void }) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2', compact ? 'gap-1.5' : 'gap-2')}>
      {meetings.map((m) => (
        <MeetingCard key={m.id} meeting={m} showDate past={past} compact={compact} onOpen={() => onOpen(m.id)} />
      ))}
    </div>
  )
}

export function MeetingCard({
  meeting,
  showDate,
  past,
  compact,
  onOpen,
}: {
  meeting: Meeting
  showDate?: boolean
  past?: boolean
  /** Una riga sola, più stretta: nome e giorno affiancati. */
  compact?: boolean
  onOpen: () => void
}) {
  const items = meeting.prep.filter((p) => p.text.trim() && !p.after)
  const ready = items.filter((p) => p.done).length
  const after = pendingAfter(meeting)
  const when = [showDate && formatLong(meeting.date), meeting.time && `ore ${meeting.time}`].filter(Boolean).join(' · ')

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full items-center rounded-xl border bg-card text-left shadow-xs transition-colors hover:bg-muted/40',
        compact ? 'gap-2 px-3 py-1.5' : 'gap-3 p-3',
        past && after.length === 0 && 'opacity-70',
      )}
    >
      <MeetingIcon className={cn('shrink-0 text-pencil-blue', compact ? 'size-4' : 'size-5')} />
      {compact ? (
        <span className="flex min-w-0 flex-1 items-baseline gap-1.5 text-sm">
          <span className="shrink-0 font-semibold">{meetingLabel(meeting)}</span>
          {when && <span className="truncate text-xs text-muted-foreground">{when}</span>}
        </span>
      ) : (
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{meetingLabel(meeting)}</span>
          {when && <span className="block text-xs text-muted-foreground first-letter:uppercase">{when}</span>}
        </span>
      )}
      {past && after.length > 0 ? (
        <span className="max-w-40 shrink-0 truncate text-xs font-medium text-warn">{after.length === 1 ? after[0].text : `${after.length} cose da fare`}</span>
      ) : (
        items.length > 0 &&
        !past && (
          <span className={cn('shrink-0 text-xs', ready === items.length ? 'text-done' : 'text-warn')}>
            {ready}/{items.length} pronte
          </span>
        )
      )}
    </button>
  )
}
