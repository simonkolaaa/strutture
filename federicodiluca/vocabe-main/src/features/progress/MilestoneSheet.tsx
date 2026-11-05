import type { Badge } from '@/core/badges/badges'
import { getProgress } from '@/state/store'
import { renderMilestoneCard } from '@/core/share/card'
import { siteUrl } from '@/core/site'
import { ImageShareSheet } from '@/features/share/ImageShareSheet'

function milestoneText(badge: Badge): string {
  const what = badge.figure ? `${badge.figure.value} ${badge.figure.label}` : badge.name
  return `${what} su Vocabe — «${badge.name}».\n${siteUrl()}`
}

/** Share an earned badge as a milestone card. */
export function MilestoneSheet({
  badge,
  open,
  onClose,
}: {
  badge: Badge | null
  open: boolean
  onClose: () => void
}) {
  if (!badge) return null
  return (
    <ImageShareSheet
      open={open}
      onClose={onClose}
      title="Condividi il traguardo"
      render={() => renderMilestoneCard(badge, getProgress())}
      text={milestoneText(badge)}
      filename={`vocabe-${badge.id}.png`}
      alt={`Traguardo ${badge.name}`}
    />
  )
}
