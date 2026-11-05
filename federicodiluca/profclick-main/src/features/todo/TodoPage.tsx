import { createElement, useState } from 'react'
import { Link } from 'wouter'
import { CourseName, GradeSign, ProgressBar } from '@/components/bits'
import { ChevronDownIcon, ChevronRightIcon, MeetingIcon } from '@/components/icons'
import { PencilUnderline } from '@/components/pencil'
import { Button } from '@/components/ui/button'
import { sortedCourses } from '@/core/calendar'
import { addDays, formatDay, formatShort, type ISODate, startOfWeek, today } from '@/core/dates'
import { activityLabel, meetingLabel } from '@/core/model'
import { isAfter, stepLabel } from '@/core/steps'
import { isFollowUp, isLater, setTodosDone, type Todo, todoFilterKey, todos, toggleTodo } from '@/core/todo'
import { activityIcon } from '@/lib/activityIcons'
import { LessonDialog } from '@/features/lesson/LessonDialog'
import { MeetingDialog } from '@/features/meetings/MeetingDialog'
import { CourseFilter } from '@/features/week/CourseFilter'
import { activityTone, courseSurface, formatHours, gradeMark } from '@/lib/ui'
import { cn } from '@/lib/utils'
import { currentWeek } from '@/lib/week'
import { useData } from '@/state/data'
import { ListSection } from '@/components/ListSection'
import { useClosedGroups, useListMode } from '@/state/listMode'
import { useHiddenCourses } from '@/state/weekFilter'

/** Le settimane in vista all'apertura: abbastanza per preparare con calma, non tutto l'anno. */
const WEEKS = 3

/**
 * Tutto quello da preparare per le prossime settimane, da spuntare in un posto solo: le
 * attività delle lezioni pianificate, le voci scritte nelle classi, quelle delle riunioni.
 */
export default function TodoPage() {
  const { data, applyWithUndo } = useData()
  const now = today()
  const [weeks, setWeeks] = useState(WEEKS)
  const [open, setOpen] = useState<{ courseId: string; date: ISODate } | null>(null)
  const [meetingOpen, setMeetingOpen] = useState<string | null>(null)
  const { hidden, toggle, showAll } = useHiddenCourses()
  const courses = sortedCourses(data)
  // Come nella settimana: finita la scuola della settimana si guarda già a quella che arriva.
  const monday = currentWeek(data)
  const until = addDays(monday, weeks * 7 - 1)
  const list = todos(data, now, until).filter((t) => !hidden.has(todoFilterKey(t)))
  const yearEnded = !data.year || until >= data.year.end

  // Tre liste: da chiudere per quello che c'è già stato (correzioni, registro, verbali), da
  // preparare per quello che viene, e a cose fatte, per vedere per tempo cosa ci sarà dopo.
  const after = list.filter((t) => isFollowUp(t) && !isLater(t, now))
  const before = list.filter((t) => !isFollowUp(t))
  const later = list.filter((t) => isLater(t, now))
  const afterMode = useListMode('da-chiudere')
  const beforeMode = useListMode('da-preparare')
  const laterMode = useListMode('a-cose-fatte')
  const closedGroups = useClosedGroups()

  const groups = new Map<ISODate, Todo[]>()
  for (const todo of before.filter((t) => t.due)) {
    const week = startOfWeek(todo.due!) < monday ? monday : startOfWeek(todo.due!)
    groups.set(week, [...(groups.get(week) ?? []), todo])
  }
  const undated = before.filter((t) => !t.due)
  const weekTitle = (week: ISODate) =>
    week === monday ? 'Questa settimana' : week === addDays(monday, 7) ? 'Settimana prossima' : `Settimana del ${formatDay(week).replace(/ \d{4}$/, '')}`

  // "Tutte pronte" vale per quello da preparare: correggere o i voti sul registro si spuntano uno per uno.
  const markAll = (all: Todo[]) => {
    const items = all.filter((t) => !isFollowUp(t))
    const open = items.filter((t) => !t.done).length
    // Tutto già pronto: lo stesso pulsante toglie le spunte, per chi ha esagerato.
    const done = open > 0
    const count = done ? open : items.length
    const message = done
      ? count === 1 ? 'Una voce pronta' : `${count} voci pronte`
      : count === 1 ? 'Una voce di nuovo da preparare' : `${count} voci di nuovo da preparare`
    applyWithUndo(setTodosDone(items, done), message)
  }

  const onOpen = (todo: Todo) => {
    const s = todo.source
    if (s.kind === 'activity') setOpen({ courseId: s.course.id, date: todo.due! })
    else if (s.kind === 'meeting') setMeetingOpen(s.meeting.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            <span className="relative text-foreground">
              Da fare
              <PencilUnderline className="text-pencil-blue" />
            </span>
          </h1>
          <p className="mt-1 text-muted-foreground">Quello da chiudere dopo lezioni e riunioni già fatte, quello da preparare per le prossime, e quello che verrà a cose fatte.</p>
        </div>
      </div>

      {courses.length > 0 && <CourseFilter courses={courses} hidden={hidden} onToggle={toggle} onShowAll={showAll} />}

      {list.length === 0 ? (
        <div className="space-y-2 rounded-xl border border-dashed p-6 text-center">
          <p className="font-medium">Niente da preparare nelle prossime {weeks} settimane.</p>
          <p className="text-sm text-muted-foreground">
            Le voci nascono da sole dalle lezioni pianificate: spiegazioni, esercitazioni, laboratori e verifiche portano i loro passi, prima e dopo. Slide e stampe si aggiungono nella lezione.
            Pianifica dalla <Link to="/" className="font-medium text-primary hover:underline">Settimana</Link> o dal piano di una classe.
          </p>
        </div>
      ) : (
        <>
          {after.length > 0 && (
            <ListSection
              title="Da chiudere"
              badge={after.filter((t) => !t.done).length}
              extra={<span className="hidden text-xs text-muted-foreground sm:inline">dopo lezioni e riunioni già fatte</span>}
              mode={afterMode.mode}
              onMode={afterMode.setMode}
              onToggleOpen={afterMode.toggleOpen}
            >
              <TodoList items={after} now={now} compact={afterMode.mode === 'compatta'} onOpen={onOpen} />
            </ListSection>
          )}
          {before.length > 0 && (
            <ListSection
              title="Da preparare"
              badge={before.filter((t) => !t.done).length}
              mode={beforeMode.mode}
              onMode={beforeMode.setMode}
              onToggleOpen={beforeMode.toggleOpen}
            >
              <div className="space-y-5">
                {[...groups].map(([week, items]) => (
                  <TodoGroup
                    key={week}
                    title={weekTitle(week)}
                    items={items}
                    now={now}
                    compact={beforeMode.mode === 'compatta'}
                    closed={closedGroups.isClosed(week)}
                    onToggleOpen={() => closedGroups.toggle(week)}
                    onOpen={onOpen}
                    onMarkAll={() => markAll(items)}
                  />
                ))}
                {undated.length > 0 && (
                  <TodoGroup
                    title="Senza data"
                    hint="Voci delle classi per argomenti non ancora in calendario: prendono una data quando li pianifichi."
                    items={undated}
                    now={now}
                    compact={beforeMode.mode === 'compatta'}
                    closed={closedGroups.isClosed('senza-data')}
                    onToggleOpen={() => closedGroups.toggle('senza-data')}
                    onOpen={onOpen}
                    onMarkAll={() => markAll(undated)}
                  />
                )}
              </div>
            </ListSection>
          )}
          {later.length > 0 && (
            <ListSection
              title="A cose fatte"
              badge={later.filter((t) => !t.done).length}
              extra={<span className="hidden text-xs text-muted-foreground sm:inline">dopo le prossime verifiche e riunioni</span>}
              mode={laterMode.mode}
              onMode={laterMode.setMode}
              onToggleOpen={laterMode.toggleOpen}
            >
              <TodoList items={later} now={now} compact={laterMode.mode === 'compatta'} onOpen={onOpen} />
            </ListSection>
          )}
        </>
      )}

      {!yearEnded && (
        <Button variant="outline" onClick={() => setWeeks(weeks + 2)}>
          Mostra altre due settimane
        </Button>
      )}

      <LessonDialog courseId={open?.courseId ?? ''} date={open?.date ?? null} onClose={() => setOpen(null)} />
      <MeetingDialog open={meetingOpen} onClose={() => setMeetingOpen(null)} />
    </div>
  )
}

function TodoGroup({
  title,
  hint,
  items,
  now,
  compact,
  closed,
  onToggleOpen,
  onOpen,
  onMarkAll,
}: {
  title: string
  hint?: string
  items: Todo[]
  now: ISODate
  compact: boolean
  closed: boolean
  onToggleOpen: () => void
  onOpen: (todo: Todo) => void
  onMarkAll: () => void
}) {
  const ready = items.filter((t) => t.done).length
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold">
          <button type="button" onClick={onToggleOpen} aria-expanded={!closed} className="inline-flex items-center gap-1.5 hover:text-primary">
            {closed ? <ChevronRightIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
            {title}
          </button>
        </h3>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          {ready === items.length ? 'tutto pronto' : `${ready} di ${items.length} pronte`}
          {!closed && items.filter((t) => !isFollowUp(t)).length > 1 && (
            <Button variant="ghost" size="sm" onClick={onMarkAll} className="h-7 px-2 text-xs text-primary">
              {ready === items.length ? 'Togli le spunte' : 'Tutte pronte'}
            </Button>
          )}
        </span>
      </div>
      {!closed && (
        <>
          <ProgressBar value={ready} max={items.length} />
          {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
          <TodoList items={items} now={now} compact={compact} onOpen={onOpen} />
        </>
      )}
    </section>
  )
}

function TodoList({ items, now, compact, onOpen }: { items: Todo[]; now: ISODate; compact: boolean; onOpen: (todo: Todo) => void }) {
  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
      {rows(items).map((row) =>
        row[0].source.kind === 'activity' ? (
          <StepsRow key={row[0].id} todos={row} now={now} compact={compact} onOpen={() => onOpen(row[0])} />
        ) : row[0].source.kind === 'meeting' ? (
          <MeetingRow key={row[0].id} todos={row} now={now} compact={compact} onOpen={() => onOpen(row[0])} />
        ) : (
          <TodoRow key={row[0].id} todo={row[0]} now={now} compact={compact} onOpen={() => onOpen(row[0])} />
        ),
      )}
    </ul>
  )
}

/**
 * I passi della stessa lezione stanno in una riga sola, anche con più attività: la lezione, e sotto
 * le spunte. Lo stesso per le voci di una riunione.
 */
function rows(items: Todo[]): Todo[][] {
  const result: Todo[][] = []
  const byActivity = new Map<string, Todo[]>()
  for (const todo of items) {
    const s = todo.source
    if (s.kind === 'prep') {
      result.push([todo])
      continue
    }
    const key = s.kind === 'activity' ? `${s.course.id}@${todo.due}` : `meeting:${s.meeting.id}`
    const row = byActivity.get(key)
    if (row) row.push(todo)
    else {
      const fresh = [todo]
      byActivity.set(key, fresh)
      result.push(fresh)
    }
  }
  return result
}

function whenLabel(todo: Todo, now: ISODate): string | null {
  const s = todo.source
  if (!todo.due) return null
  if (s.kind === 'activity' && s.floating) return `lezione ${s.index} della settimana`
  return todo.due === now ? 'oggi' : todo.due === addDays(now, 1) ? 'domani' : formatShort(todo.due)
}

/** Una lezione con i passi delle sue attività: si apre toccando il titolo, si spunta ogni passo. */
function StepsRow({ todos: list, now, compact, onOpen }: { todos: Todo[]; now: ISODate; compact: boolean; onOpen: () => void }) {
  const { data, apply } = useData()
  const s = list[0].source
  if (s.kind !== 'activity') return null
  const when = whenLabel(list[0], now)
  const allDone = list.every((t) => t.done)
  // Le attività della lezione, nell'ordine: "Spiegazione + Esercitazione", gli argomenti una volta sola.
  const activities = [...new Map(list.flatMap((t) => (t.source.kind === 'activity' ? [[t.source.activity.id, t.source.activity] as const] : []))).values()]
  const label = activities.map(activityLabel).join(' + ')
  // L'icona della lezione: la valutazione, se c'è, se no la prima attività.
  const main = activities.find((a) => a.kind === 'verifica') ?? activities[0]
  const topics = [...new Set(activities.flatMap((a) => a.topicIds))].map((id) => data.topics[id]?.title).filter(Boolean).join(', ')
  const labels = list.map((t) => (t.source.kind === 'activity' ? stepLabel(t.source.step.key, t.source.activity) : ''))
  const mark = gradeMark(activities, list.some((t) => !t.done && t.source.kind === 'activity' && t.source.activity.kind === 'verifica' && !isAfter(t.source.step.key)))
  const checks = list.map((todo, i) => {
    if (todo.source.kind !== 'activity') return null
    const activity = todo.source.activity
    // Lo stesso passo per due attività ("Materiale"): si dice di quale.
    const text = labels.indexOf(labels[i]) !== labels.lastIndexOf(labels[i]) ? `${labels[i]} (${activityLabel(activity).toLowerCase()})` : labels[i]
    return (
      <label key={todo.id} className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" checked={todo.done} onChange={() => apply(toggleTodo(todo))} className="size-[18px] shrink-0 accent-[var(--done)]" />
        <span className={cn(todo.done && 'text-muted-foreground line-through')}>{text}</span>
      </label>
    )
  })
  if (compact) {
    // Una riga: la classe, l'attività, quando, e le spunte.
    return (
      <li style={courseSurface(s.course, { tint: false })} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 pl-4">
        <button type="button" onClick={onOpen} className={cn('flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm', allDone && 'opacity-60')}>
          <span className="shrink-0 font-semibold">{s.course.className}</span>
          {mark && <GradeSign mark={mark} inline />}
          <span className="min-w-0 truncate text-muted-foreground">
            {label}
            {when && ` · ${when}`}
          </span>
        </button>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">{checks}</div>
      </li>
    )
  }
  return (
    <li style={courseSurface(s.course, { tint: false })} className={'space-y-2 px-3 py-3 pl-4'}>
      <button type="button" onClick={onOpen} className={cn('block w-full min-w-0 text-left', allDone && 'opacity-60')}>
        <span className="flex min-w-0 items-start gap-2 text-base">
          {createElement(activityIcon(main), { className: cn('mt-1 size-4 shrink-0', activityTone(main)) })}
          <span className="min-w-0 flex-1">
            <span className="font-semibold">{label}</span>
            {topics && <span className="text-muted-foreground"> · {topics}</span>}
          </span>
          {mark && <GradeSign mark={mark} inline />}
        </span>
        <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
          <CourseName course={s.course} />
          {when && <span>· {when}</span>}
          {/* Quanto dura la lezione: cambia quanto materiale serve. */}
          <span>· {formatHours(s.hours)}</span>
        </span>
      </button>
      <div className="flex flex-wrap gap-x-4 gap-y-1">{checks}</div>
    </li>
  )
}

/** Una riunione con le sue voci: si apre toccando il nome, si spunta ogni voce. */
function MeetingRow({ todos: list, now, compact, onOpen }: { todos: Todo[]; now: ISODate; compact: boolean; onOpen: () => void }) {
  const { apply } = useData()
  const s = list[0].source
  if (s.kind !== 'meeting') return null
  const when = whenLabel(list[0], now)
  const allDone = list.every((t) => t.done)
  const checks = list.map((todo) =>
    todo.source.kind !== 'meeting' ? null : (
      <label key={todo.id} className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" checked={todo.done} onChange={() => apply(toggleTodo(todo))} className="size-[18px] shrink-0 accent-[var(--done)]" />
        <span className={cn(todo.done && 'text-muted-foreground line-through')}>{todo.source.item.text}</span>
      </label>
    ),
  )
  if (compact) {
    return (
      <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 pl-4">
        <button type="button" onClick={onOpen} className={cn('flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm', allDone && 'opacity-60')}>
          <MeetingIcon className="size-3.5 shrink-0" />
          <span className="min-w-0 truncate font-semibold">{meetingLabel(s.meeting)}</span>
          {when && <span className="shrink-0 text-muted-foreground">· {when}</span>}
        </button>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">{checks}</div>
      </li>
    )
  }
  return (
    <li className="space-y-2 px-3 py-3 pl-4">
      <button type="button" onClick={onOpen} className={cn('block w-full min-w-0 text-left', allDone && 'opacity-60')}>
        <span className="flex min-w-0 items-start gap-2 text-base">
          <MeetingIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 font-semibold">{meetingLabel(s.meeting)}</span>
        </span>
        <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
          {when && <span>{when}</span>}
          {s.meeting.time && <span>· {s.meeting.time}</span>}
        </span>
      </button>
      <div className="flex flex-wrap gap-x-4 gap-y-1">{checks}</div>
    </li>
  )
}

function TodoRow({ todo, now, compact, onOpen }: { todo: Todo; now: ISODate; compact: boolean; onOpen: () => void }) {
  const { data, apply } = useData()
  const s = todo.source
  const toggle = () => apply(toggleTodo(todo))
  const when = whenLabel(todo, now)
  const topic = s.kind === 'prep' && s.item.topicId ? data.topics[s.item.topicId]?.title : undefined
  if (s.kind === 'activity') return null

  const body = (
    <>
      <span className="block text-base font-medium">{s.item.text}</span>
      <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
        {s.kind === 'meeting' ? (
          <span className="inline-flex items-center gap-1.5">
            <MeetingIcon className="size-3.5" /> {meetingLabel(s.meeting)}
          </span>
        ) : (
          <CourseName course={s.course} />
        )}
        {topic && <span>· per {topic}</span>}
        {when && <span>· {when}</span>}
      </span>
    </>
  )

  const compactBody = (
    <span className="flex min-w-0 items-center gap-1.5 text-sm">
      <span className="min-w-0 truncate font-medium">{s.item.text}</span>
      <span className="min-w-0 shrink truncate text-muted-foreground">
        {s.kind === 'meeting' ? meetingLabel(s.meeting) : s.course.className}
        {when && ` · ${when}`}
      </span>
    </span>
  )
  const content = compact ? compactBody : body

  return (
    <li
      style={s.kind === 'meeting' ? undefined : courseSurface(s.course, { tint: false })}
      className={cn('flex gap-3 px-3 pl-4', compact ? 'items-center py-2' : 'items-start py-3')}
    >
      <input
        type="checkbox"
        checked={todo.done}
        onChange={toggle}
        className={cn('size-[18px] shrink-0 accent-[var(--done)]', !compact && 'mt-1')}
        aria-label={todo.done ? 'Pronto: tocca per annullare' : 'Segna come pronto'}
      />
      {s.kind === 'prep' ? (
        <div className={cn('min-w-0 flex-1', todo.done && 'text-muted-foreground line-through opacity-70')}>{content}</div>
      ) : (
        <button type="button" onClick={onOpen} className={cn('min-w-0 flex-1 text-left', todo.done && 'line-through opacity-60')}>
          {content}
        </button>
      )}
    </li>
  )
}
