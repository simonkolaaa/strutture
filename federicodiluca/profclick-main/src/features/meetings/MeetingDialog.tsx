import { useState } from 'react'
import { toast } from 'sonner'
import { CourseName, Segmented, Toggle } from '@/components/bits'
import { CalendarAddIcon, CopyIcon, PlusIcon, TrashIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { deleteMeeting, saveMeeting } from '@/core/actions'
import { googleCalendarLink, meetingEntry } from '@/core/calendarExport'
import { formatLong, type ISODate, today } from '@/core/dates'
import { classNames, classSummary, defaultPrep, hasCoordinatorPrep, hasMinutes, periodEnded, summaryLine, summaryText, updateDefaultPrep, wasCoordinator, wroteMinutes } from '@/core/meetings'
import { isClassMeeting, type Meeting, MEETING_KINDS, MEETING_LABELS, type MeetingKind, meetingLabel, type MeetingPrep, type ProfclickData } from '@/core/model'
import { newId } from '@/lib/id'
import { cn } from '@/lib/utils'
import { useAutosave } from '@/lib/useAutosave'
import { useData } from '@/state/data'

type Draft = Omit<Meeting, 'updatedAt'>

const KIND_SHORT: Record<MeetingKind, string> = {
  cdc: 'Consiglio',
  scrutinio: 'Scrutinio',
  glo: 'GLO',
  collegio: 'Collegio',
  dipartimento: 'Dipartimento',
  corso: 'Corso',
  altro: 'Altro',
}

/** open: null = chiuso, 'new' = nuova riunione, altrimenti l'id della riunione. */
export function MeetingDialog({ open, date, onClose }: { open: string | null; date?: ISODate; onClose: () => void }) {
  return (
    <Dialog open={open !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        {open && <MeetingForm key={open} id={open === 'new' ? null : open} date={date} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

/** Una nuova riunione nasce come consiglio della prima classe, con le cose da preparare già proposte. */
function blank(data: ProfclickData, date: ISODate): Draft {
  const className = classNames(data)[0] ?? null
  const coordinator = className ? wasCoordinator(data, className) : false
  const minutes = wroteMinutes(data, 'cdc', className)
  return { id: newId(), kind: 'cdc', date, time: '', className, title: '', coordinator, minutes, prep: defaultPrep('cdc', { coordinator, minutes }, newId), notes: '' }
}

function MeetingForm({ id, date, onClose }: { id: string | null; date?: ISODate; onClose: () => void }) {
  const { data, apply, applyWithUndo } = useData()
  const saved = id ? data.meetings[id] : undefined
  const [draft, setDraft] = useState<Draft>(() => blank(data, date ?? today()))
  // I testi si salvano anche a dialogo chiuso; di una riunione appena eliminata, niente.
  const saveText = (patch: Partial<Draft>) => {
    if (saved) apply(saveMeeting({ ...saved, ...patch }))
    else if (!id) setDraft((d) => ({ ...d, ...patch }))
  }
  const title = useAutosave((value) => value.trim() !== (saved ?? draft).title && saveText({ title: value.trim() }))
  const notes = useAutosave((value) => value !== (saved ?? draft).notes && saveText({ notes: value }))
  if (id && !saved) return null

  // Una riunione già salvata si aggiorna a ogni modifica, come le lezioni; una nuova solo con "Aggiungi".
  const meeting: Draft = saved ?? draft
  const set = (patch: Partial<Draft>) => {
    const next = { ...meeting, ...patch }
    if (saved) apply(saveMeeting(next))
    else setDraft(next)
  }
  const classes = classNames(data)
  const forClass = isClassMeeting(meeting.kind)
  const summary = classSummary(data, meeting)

  const setKind = (kind: MeetingKind) => {
    const className = isClassMeeting(kind) ? (meeting.className ?? classes[0] ?? null) : null
    const coordinator = className === meeting.className ? meeting.coordinator : className ? wasCoordinator(data, className) : false
    const minutes = wroteMinutes(data, kind, className)
    set({ kind, className, coordinator, minutes, prep: updateDefaultPrep(meeting.prep, meeting, { kind, coordinator, minutes }, newId) })
  }
  const setClass = (className: string) => {
    const coordinator = wasCoordinator(data, className)
    const minutes = wroteMinutes(data, meeting.kind, className)
    set({ className, coordinator, minutes, prep: updateDefaultPrep(meeting.prep, meeting, { kind: meeting.kind, coordinator, minutes }, newId) })
  }
  const toggleRole = (role: 'coordinator' | 'minutes') => {
    const roles = { coordinator: meeting.coordinator, minutes: Boolean(meeting.minutes), [role]: !meeting[role] }
    set({ ...roles, prep: updateDefaultPrep(meeting.prep, meeting, { kind: meeting.kind, ...roles }, newId) })
  }
  const copySummary = () => {
    if (!summary) return
    navigator.clipboard.writeText(summaryText(meeting, summary)).then(
      () => toast.success('Riepilogo copiato'),
      () => toast.error('Copia non riuscita'),
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg">{saved ? meetingLabel(meeting) : 'Nuova riunione'}</DialogTitle>
        <DialogDescription className="first-letter:uppercase">
          {formatLong(meeting.date)}
          {meeting.time && ` · ore ${meeting.time}`}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <Segmented<MeetingKind> value={meeting.kind} onChange={setKind} options={MEETING_KINDS.map((k) => ({ value: k, label: KIND_SHORT[k] }))} />

        {forClass && classes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Segmented value={meeting.className ?? ''} onChange={setClass} options={classes.map((c) => ({ value: c, label: c }))} />
          </div>
        )}
        {(hasMinutes(meeting.kind) || (forClass && hasCoordinatorPrep(meeting.kind) && meeting.className)) && (
          <div className="flex flex-wrap gap-2">
            {forClass && hasCoordinatorPrep(meeting.kind) && meeting.className && (
              <Toggle on={meeting.coordinator} onClick={() => toggleRole('coordinator')}>
                Sono coordinatore
              </Toggle>
            )}
            {hasMinutes(meeting.kind) && (
              <Toggle on={Boolean(meeting.minutes)} onClick={() => toggleRole('minutes')}>
                Scrivo il verbale
              </Toggle>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="meeting-date">Giorno</Label>
            <Input id="meeting-date" type="date" value={meeting.date} onChange={(e) => e.target.value && set({ date: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="meeting-time">Ora</Label>
            <Input id="meeting-time" type="time" step={300} value={meeting.time} onChange={(e) => set({ time: e.target.value })} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="meeting-title">Titolo, se serve</Label>
          <Input
            id="meeting-title"
            placeholder={MEETING_LABELS[meeting.kind]}
            defaultValue={meeting.title}
            {...title}
          />
        </div>
      </div>

      <PrepList
        title="Da preparare"
        items={meeting.prep.filter((p) => !p.after)}
        placeholder="Relazione, documenti da leggere, proposte…"
        hint="Compare nella settimana e nel Da fare quando la riunione si avvicina."
        onChange={(items) => set({ prep: [...items, ...meeting.prep.filter((p) => p.after)] })}
      />
      <PrepList
        title="Da fare dopo"
        items={meeting.prep.filter((p) => p.after)}
        after
        placeholder="Verbale, comunicazioni alle famiglie, relazione…"
        hint="Resta nel Da fare, anche passata la riunione, finché non la spunti."
        onChange={(items) => set({ prep: [...meeting.prep.filter((p) => !p.after), ...items] })}
      />

      {summary && (
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">
              La classe nei tuoi dati <span className="font-normal text-muted-foreground">· {summary.period.name}</span>
            </h3>
            <Button variant="ghost" size="sm" onClick={copySummary}>
              <CopyIcon /> Copia
            </Button>
          </div>
          <ul className="space-y-2 rounded-xl bg-muted/50 p-3 text-sm">
            {summary.courses.map((s) => (
              <li key={s.course.id} className="space-y-0.5">
                <CourseName course={s.course} className="font-medium" />
                <p className="text-muted-foreground first-letter:uppercase">{summaryLine(s, periodEnded(summary, meeting.date))}.</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Appunti</h3>
        <Textarea
          rows={4}
          defaultValue={meeting.notes}
          placeholder={
            meeting.kind === 'glo'
              ? 'Cosa si è deciso, cosa fare dopo. Niente nomi: lo studente è nel PEI, non qui.'
              : 'Cosa si è deciso, cosa fare dopo. Niente nomi di studenti: quelli stanno sul registro.'
          }
          {...notes}
        />
      </section>

      <DialogFooter className="flex-row flex-wrap items-center justify-between sm:justify-between">
        {saved ? (
          <>
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  applyWithUndo(deleteMeeting(saved.id), 'Riunione eliminata')
                  onClose()
                }}
              >
                <TrashIcon /> Elimina
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href={googleCalendarLink(meetingEntry(saved))} target="_blank" rel="noopener">
                  <CalendarAddIcon /> Aggiungi a Google Calendar
                </a>
              </Button>
            </div>
            <Button onClick={onClose}>Fatto</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              Annulla
            </Button>
            <Button
              onClick={() => {
                apply(saveMeeting(draft))
                toast.success('Riunione aggiunta')
                onClose()
              }}
            >
              <PlusIcon /> Aggiungi
            </Button>
          </>
        )}
      </DialogFooter>
    </>
  )
}

/** Le voci di una riunione, prima o dopo: da spuntare, togliere, aggiungere. */
function PrepList({ title, items, after, placeholder, hint, onChange }: { title: string; items: MeetingPrep[]; after?: boolean; placeholder: string; hint: string; onChange: (items: MeetingPrep[]) => void }) {
  const [text, setText] = useState('')
  const add = () => {
    if (!text.trim()) return
    onChange([...items, { id: newId(), text: text.trim(), done: false, ...(after && { after: true }) }])
    setText('')
  }
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length > 0 && (
        <ul className="divide-y rounded-xl border bg-card">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-3 py-1.5 text-sm">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => onChange(items.map((p) => (p.id === item.id ? { ...p, done: !p.done } : p)))}
                className="size-4 shrink-0 accent-[var(--done)]"
                aria-label={`${after ? 'Fatto' : 'Pronto'}: ${item.text}`}
              />
              <span className={cn('min-w-0 flex-1', item.done && 'text-muted-foreground line-through')}>{item.text}</span>
              <Button variant="ghost" size="icon-sm" aria-label={`Togli ${item.text}`} onClick={() => onChange(items.filter((p) => p.id !== item.id))}>
                <TrashIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} className="flex-1" aria-label={`Aggiungi a ${title.toLowerCase()}`} />
        <Button type="submit" variant="outline" disabled={!text.trim()}>
          <PlusIcon /> Aggiungi
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </section>
  )
}
