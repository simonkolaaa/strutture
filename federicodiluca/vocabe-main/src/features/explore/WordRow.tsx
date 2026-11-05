import type { Word } from '@/core/types'
import { useIsFavorite, useIsLearned } from '@/state/hooks'
import { Icon } from '@/ui/Icon'
import { WordDetails } from '@/features/daily/WordDetails'

/** One expandable row of the word list, shared by the browser and the collections. */
export function WordRow({
  word,
  open,
  onToggle,
}: {
  word: Word
  open: boolean
  onToggle: () => void
}) {
  const fav = useIsFavorite(word.id)
  const learned = useIsLearned(word.id)

  return (
    <li className="rounded-2xl border border-line bg-paper-raised">
      <button
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        onClick={onToggle}
      >
        <span className="min-w-0">
          <span className="font-reading text-lg font-semibold">{word.term}</span>
          <span className="block truncate text-xs text-ink-soft">{word.meaning}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-brand">
          {fav && <Icon name="star-filled" size={15} />}
          {learned && <Icon name="check" size={16} />}
        </span>
      </button>
      {open && (
        <div className="border-t border-line px-4 py-4">
          <WordDetails word={word} learnAction />
        </div>
      )}
    </li>
  )
}
