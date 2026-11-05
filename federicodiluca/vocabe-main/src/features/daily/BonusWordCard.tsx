import { getWord } from '@/core/content/words'
import { useIsLearned } from '@/state/hooks'
import { markLearned, unmarkLearned } from '@/state/store'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { Icon } from '@/ui/Icon'
import { WordDetails } from './WordDetails'

/** A second word, offered once the day's word has been learned. */
export function BonusWordCard({ wordId }: { wordId: string }) {
  const bonusWord = getWord(wordId)
  const learned = useIsLearned(wordId)

  if (!bonusWord) return null

  return (
    <Card className="border-dashed">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand">
        <Icon name="sparkle" size={18} />
        Parola bonus
      </div>

      <h2 className="mb-4 font-reading text-2xl font-semibold">{bonusWord.term}</h2>
      <WordDetails word={bonusWord} />

      <div className="mt-4">
        {learned ? (
          <div className="flex items-center justify-between rounded-2xl bg-brand-soft px-4 py-3 text-brand">
            <span className="inline-flex items-center gap-2 font-semibold">
              <Icon name="check" size={18} /> Imparata oggi
            </span>
            <button className="text-sm underline" onClick={() => unmarkLearned(bonusWord.id)}>
              annulla
            </button>
          </div>
        ) : (
          <Button className="w-full" onClick={() => markLearned(bonusWord.id)}>
            <Icon name="check" size={18} /> Segna come imparata
          </Button>
        )}
      </div>
    </Card>
  )
}
