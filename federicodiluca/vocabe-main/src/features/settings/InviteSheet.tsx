import { getProgress } from '@/state/store'
import { renderInviteCard } from '@/core/share/card'
import { siteUrl } from '@/core/site'
import { ImageShareSheet } from '@/features/share/ImageShareSheet'

function inviteText(): string {
  return `Sto usando Vocabe, una parola italiana al giorno — significato, esempi, etimologia. È online, gratis, si installa dal browser.\n${siteUrl()}`
}

/** A generic "come and try it" card — for a first post or story, not tied to a word or a badge. */
export function InviteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <ImageShareSheet
      open={open}
      onClose={onClose}
      title="Invita a provare Vocabe"
      render={() => renderInviteCard(getProgress())}
      text={inviteText()}
      filename="vocabe-invito.png"
      alt="Invito a provare Vocabe"
    />
  )
}
