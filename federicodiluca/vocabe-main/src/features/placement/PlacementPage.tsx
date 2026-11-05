import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getProgress, applyPlacement } from '@/state/store'
import { buildPlacement, PASS_MARK, scorePlacement, type PlacementResult } from '@/core/placement'
import { LEVELS, levelLabel } from '@/core/content/levels'
import type { Question } from '@/core/quiz'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { Icon } from '@/ui/Icon'
import { cn } from '@/ui/cn'

type Answer = { question: Question; correct: boolean }

/**
 * The placement test: twenty words from easy to rare, "what does this mean".
 * Sets the level the daily words start from and sets aside the words the reader
 * already knew. Reachable from onboarding and from Opzioni, any time.
 */
export function PlacementPage() {
  const navigate = useNavigate()
  // Fixed when the page opens; answering must not reshuffle the remaining questions.
  const [quiz] = useState(() => buildPlacement(getProgress()))
  const [i, setI] = useState(0)
  const [choice, setChoice] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [result, setResult] = useState<PlacementResult | null>(null)

  if (quiz.length === 0) {
    return (
      <Card className="mt-6 text-center">
        <p className="font-semibold">Non c'è più niente da testare</p>
        <p className="mt-1 text-sm text-ink-soft">Conosci già tutte le parole di Vocabe.</p>
        <Link to="/impostazioni" className="mt-4 inline-block text-sm text-brand underline">
          Torna alle opzioni
        </Link>
      </Card>
    )
  }

  if (result) {
    const known = result.knownIds.length
    return (
      <div className="space-y-5 pt-2">
        <Card className="animate-rise text-center">
          <p className="text-sm text-ink-soft">Il tuo livello di partenza</p>
          <p className="mt-1 font-serif text-3xl font-semibold">{levelLabel(result.level)}</p>
          <p className="mt-2 text-sm text-ink-soft">{LEVELS[result.level - 1].hint}</p>
        </Card>

        <ul className="space-y-1.5">
          {LEVELS.map((l) => {
            const { correct, asked } = result.perLevel[l.value]
            const cleared = asked > 0 && correct >= Math.min(PASS_MARK, asked)
            return (
              <li key={l.value} className="flex items-center justify-between rounded-2xl border border-line px-4 py-2.5 text-sm">
                <span className={cn(cleared ? 'text-ink' : 'text-ink-soft')}>{l.label}</span>
                <span className="flex items-center gap-2 text-ink-soft">
                  {correct}/{asked}
                  {cleared && <Icon name="check" size={16} className="text-brand" />}
                </span>
              </li>
            )
          })}
        </ul>

        <p className="text-sm text-ink-soft">
          Da oggi la parola del giorno parte da qui.{' '}
          {known > 0 &&
            `Le ${known} ${known === 1 ? 'parola che conoscevi già viene messa' : 'parole che conoscevi già vengono messe'} da parte: le trovi sempre in Esplora.`}
        </p>

        <Button
          className="w-full"
          onClick={() => {
            applyPlacement(result.level, result.knownIds)
            navigate('/', { replace: true })
          }}
        >
          <Icon name="check" size={18} /> Conferma
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => navigate('/', { replace: true })}>
          Lascia com'era
        </Button>
      </div>
    )
  }

  const q = quiz[i]
  const answered = choice !== null

  function choose(idx: number) {
    if (answered) return
    setChoice(idx)
    setAnswers((a) => [...a, { question: q, correct: idx === q.answer }])
  }

  function next() {
    setChoice(null)
    if (i + 1 < quiz.length) setI(i + 1)
    else setResult(scorePlacement(answers))
  }

  return (
    <div className="space-y-5 pt-2">
      <div className="flex items-center justify-between text-sm text-ink-soft">
        <span>
          {i + 1} di {quiz.length}
        </span>
        <span className="rounded-full bg-line/60 px-2.5 py-0.5 text-xs">
          {levelLabel(q.word.difficulty ?? 1)}
        </span>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-line">
        <div className="h-full bg-brand transition-[width]" style={{ width: `${(i / quiz.length) * 100}%` }} />
      </div>

      <Card>
        <p className="text-sm text-ink-soft">Cosa significa</p>
        <h2 className="font-reading text-3xl font-semibold">{q.prompt}</h2>
      </Card>

      <div className="space-y-2">
        {q.options.map((opt, idx) => {
          const s =
            !answered ? 'idle'
            : idx === q.answer ? 'correct'
            : idx === choice ? 'wrong'
            : 'dim'
          return (
            <button
              key={idx}
              onClick={() => choose(idx)}
              disabled={answered}
              className={cn(
                'w-full rounded-2xl border px-4 py-3 text-left text-sm transition',
                s === 'idle' && 'border-line hover:bg-line/40',
                s === 'correct' && 'border-good bg-good/10 text-good',
                s === 'wrong' && 'border-bad bg-bad/10 text-bad',
                s === 'dim' && 'border-line opacity-50',
              )}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {answered ? (
        <Button className="w-full animate-rise" onClick={next}>
          {i + 1 === quiz.length ? 'Vedi il risultato' : 'Prossima'}
        </Button>
      ) : (
        <button
          className="w-full py-2 text-center text-sm text-ink-soft underline"
          onClick={() => choose(-1)}
        >
          Non la conosco
        </button>
      )}
    </div>
  )
}
