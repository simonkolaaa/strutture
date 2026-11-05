import type { Word } from '@/core/types'
import { getProgress } from '@/state/store'
import { renderShareCard } from '@/core/share/card'
import { shareText } from '@/core/share/share'
import { ImageShareSheet } from '@/features/share/ImageShareSheet'

/** Share a word as a card. `daily` marks it as today's word on the image and in the text. */
export function ShareSheet({
  word,
  open,
  onClose,
  daily = false,
}: {
  word: Word
  open: boolean
  onClose: () => void
  daily?: boolean
}) {
  return (
    <ImageShareSheet
      open={open}
      onClose={onClose}
      title="Condividi la parola"
      render={() => renderShareCard(word, getProgress(), { daily })}
      text={shareText(word, daily)}
      filename={`vocabe-${word.id}.png`}
      alt={`Scheda della parola ${word.term}`}
    />
  )
}
