import { useEffect, useState } from 'react'
import { useToday } from '@/app/useToday'
import { useDailyPick, useIsLearned } from '@/state/hooks'
import { ensureDaily, markLearned, unmarkLearned } from '@/state/store'
import { getWord } from '@/core/content/words'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { Icon } from '@/ui/Icon'
import { WordDetails } from './WordDetails'
import { ShareSheet } from './ShareSheet'
import { InstallHint } from '@/features/install/InstallButton'
import { BonusWordCard } from './BonusWordCard'

const todayLabel = () =>
  new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

/** Remounted when the date rolls over, so no local state survives into the new day. */
export function DailyPage() {
  const today = useToday()
  // Persist today's pick once. The hook below already renders the same word
  // before this runs, so there is no flash of a different word.
  useEffect(() => ensureDaily(today), [today])
  return <DailyWord key={today} today={today} />
}

function DailyWord({ today }: { today: string }) {
  const pick = useDailyPick(today)
  const word = getWord(pick.wordId)!
  const learned = useIsLearned(word.id)
  const [revealed, setRevealed] = useState(learned)
  const [justRevealed, setJustRevealed] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  return (
    <div className="space-y-6">
      <p className="text-sm capitalize text-ink-soft">{todayLabel()}</p>

      <Card
        className={revealed ? undefined : 'cursor-pointer'}
        onClick={
          revealed
            ? undefined
            : () => {
                setRevealed(true)
                setJustRevealed(true)
              }
        }
      >
        <div className="mb-4 flex items-baseline gap-2">
          <h1 className="font-reading text-4xl font-semibold tracking-tight">{word.term}</h1>
          {word.pos && <span className="text-sm italic text-ink-soft">{word.pos}</span>}
        </div>

        {revealed ? (
          <div className={justRevealed ? 'animate-rise' : undefined}>
            <WordDetails word={word} shareAction={false} />
          </div>
        ) : (
          <p className="py-6 text-center text-ink-soft">Tocca per scoprire il significato</p>
        )}
      </Card>

      {revealed && (
        <div className="space-y-3">
          {learned ? (
            <div className="flex items-center justify-between rounded-2xl bg-brand-soft px-4 py-3 text-brand">
              <span className="inline-flex items-center gap-2 font-semibold">
                <Icon name="check" size={18} /> Imparata oggi
              </span>
              <button className="text-sm underline" onClick={() => unmarkLearned(word.id)}>
                annulla
              </button>
            </div>
          ) : (
            <Button className="w-full" onClick={() => markLearned(word.id)}>
              <Icon name="check" size={18} /> Segna come imparata
            </Button>
          )}

          <Button variant="outline" className="w-full" onClick={() => setShareOpen(true)}>
            <Icon name="share" size={18} /> Condividi
          </Button>
        </div>
      )}

      <InstallHint />

      {learned && pick.bonusId && <BonusWordCard wordId={pick.bonusId} />}

      <ShareSheet word={word} daily open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  )
}
