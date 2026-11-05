import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useProgressSlice } from '@/state/hooks'
import { getProgress, markRecapSeen } from '@/state/store'
import { displayStreak } from '@/core/streak/streak'
import { isDue } from '@/core/srs/leitner'
import { pendingRecap } from '@/core/recap/recap'
import { decodeChallenge, type Challenge } from '@/core/challenge'
import { ChallengeSheet } from '@/features/challenge/ChallengeSheet'
import { RecapSheet } from '@/features/recap/RecapSheet'
import { Icon, type IconName } from '@/ui/Icon'
import { Logo } from '@/ui/Logo'
import { cn } from '@/ui/cn'
import { Onboarding } from './Onboarding'

const tabs: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/', label: 'Oggi', icon: 'book', end: true },
  { to: '/ripasso', label: 'Ripasso', icon: 'cards' },
  { to: '/esplora', label: 'Esplora', icon: 'compass' },
  { to: '/progressi', label: 'Progressi', icon: 'chart' },
  { to: '/impostazioni', label: 'Opzioni', icon: 'sliders' },
]

export function Layout() {
  const { pathname } = useLocation()
  const onboarded = useProgressSlice((s) => s.onboarded)
  const streakBlock = useProgressSlice((s) => s.streak)
  const learned = useProgressSlice((s) => s.learned)

  const streak = displayStreak(streakBlock)
  const dueCount = useMemo(() => Object.values(learned).filter((e) => isDue(e)).length, [learned])

  // Settled once on mount: the pending week only changes at a week boundary,
  // and closing the sheet is what clears it.
  const [recapWeek, setRecapWeek] = useState(() => pendingRecap(getProgress()))

  const [incoming, setIncoming] = useState<Challenge | null>(null)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('sfida')
    if (!token) return
    const parsed = decodeChallenge(token)
    params.delete('sfida')
    const qs = params.toString()
    window.history.replaceState(
      null,
      '',
      window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash,
    )
    if (parsed) setIncoming(parsed)
  }, [])

  if (!onboarded) return <Onboarding />

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col">
      <header className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3">
        <span className="flex items-center gap-2">
          <Logo size={22} className="text-brand" />
          <span className="font-serif text-xl font-semibold tracking-tight">Vocabe</span>
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold',
            streak > 0 ? 'bg-brand-soft text-brand' : 'text-ink-soft',
          )}
          title="Giorni consecutivi"
        >
          <Icon name="flame" size={16} strokeWidth={1.7} />
          {streak}
        </span>
      </header>

      <main className="flex-1 px-5 pb-28">
        <div key={pathname} className="animate-fade">
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-stretch justify-around px-2 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] pt-2">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-xs font-medium transition',
                  isActive ? 'text-brand' : 'text-ink-soft',
                )
              }
            >
              <Icon name={t.icon} size={22} />
              {t.label}
              {t.to === '/ripasso' && dueCount > 0 && (
                <span className="absolute right-2 top-0 min-w-4 rounded-full bg-brand px-1 text-[10px] font-bold leading-4 text-white">
                  {dueCount}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <ChallengeSheet
        key={incoming ? 'incoming' : 'none'}
        open={!!incoming}
        incoming={incoming}
        onClose={() => setIncoming(null)}
      />

      {recapWeek && (
        <RecapSheet
          open={!incoming}
          from={recapWeek}
          onClose={() => {
            markRecapSeen(recapWeek)
            setRecapWeek(null)
          }}
        />
      )}
    </div>
  )
}
