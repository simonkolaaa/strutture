import type { ReactNode } from 'react'
import { Link, useRoute } from 'wouter'
import { ClassesIcon, type IconComponent, MeetingIcon, NotesIcon, PrepIcon, WeekIcon, YearIcon } from '@/components/icons'
import { InstallButton } from '@/components/InstallButton'
import { SyncButton } from '@/components/SyncButton'
import { ThemeButton } from '@/components/ThemeButton'
import { addDays, today } from '@/core/dates'
import { isLater, todos } from '@/core/todo'
import { cn } from '@/lib/utils'
import { currentWeek } from '@/lib/week'
import { useData } from '@/state/data'

function NavLink({ to, icon: Icon, badge, children }: { to: string; icon: IconComponent; badge?: number; children: ReactNode }) {
  const [active] = useRoute(to === '/' ? '/' : `${to}/*?`)
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground md:flex-none md:flex-row md:gap-1.5 md:px-3 md:text-sm',
        active && 'bg-secondary text-foreground',
      )}
    >
      <span className="relative">
        <Icon className="size-5 md:size-4" />
        {badge ? (
          <span className="absolute -top-1.5 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-none font-semibold text-primary-foreground tabular-nums">
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
      </span>
      <span className="truncate">{children}</span>
    </Link>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  // Prima di scegliere l'anno scolastico c'è solo il benvenuto: le sezioni non servono ancora.
  const { data } = useData()
  const ready = data.year !== null
  // Sul tab Da fare, quante cose non sono ancora pronte per la settimana mostrata (dal venerdì
  // sera la prossima), più quelle ancora da chiudere.
  const now = today()
  const dueSoon = ready ? todos(data, now, addDays(currentWeek(data), 6)).filter((t) => t.due && !t.done && !isLater(t, now)).length : 0
  const nav = (
    <>
      <NavLink to="/" icon={WeekIcon}>
        Settimana
      </NavLink>
      <NavLink to="/da-fare" icon={PrepIcon} badge={dueSoon}>
        Da fare
      </NavLink>
      <NavLink to="/classi" icon={ClassesIcon}>
        Classi
      </NavLink>
      <NavLink to="/note" icon={NotesIcon}>
        Note
      </NavLink>
      <NavLink to="/riunioni" icon={MeetingIcon}>
        Riunioni
      </NavLink>
      <NavLink to="/anno" icon={YearIcon}>
        Anno
      </NavLink>
    </>
  )

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col px-4">
      <header className="flex items-center justify-between gap-3 py-3 print:hidden">
        <Link to="/" className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight">
          <img src="/favicon.svg" alt="" className="size-7" />
          ProfClick
        </Link>
        <div className="flex items-center gap-1">
          {/* Da computer il browser offre già l'installazione nella barra degli indirizzi:
              il pulsante resta solo su telefono e tablet, dove serve davvero. */}
          <InstallButton variant="ghost" size="sm" className="md:hidden" />
          <ThemeButton />
          <SyncButton />
        </div>
      </header>

      {/* Da computer le sezioni stanno in una riga loro, sotto la testata: accanto al logo
          e ai pulsanti sei voci con il nome non ci starebbero. */}
      {ready && (
        <nav className="-mt-1 mb-3 hidden flex-wrap items-center gap-1 border-b pb-2 md:flex print:hidden" aria-label="Sezioni">
          {nav}
        </nav>
      )}

      <main className={cn('flex-1 pb-10', ready && 'pb-24 md:pb-10', 'print:pb-0')}>{children}</main>

      {/* Da telefono e tablet la navigazione sta in basso, a portata di pollice. */}
      {ready && (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 flex gap-1 border-t bg-background/95 px-3 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden print:hidden"
          aria-label="Sezioni"
        >
          {nav}
        </nav>
      )}
    </div>
  )
}
