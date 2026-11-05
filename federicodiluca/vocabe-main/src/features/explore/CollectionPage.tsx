import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useProgressSlice } from '@/state/hooks'
import { collectionProgress, collectionWords, getCollection } from '@/core/content/collections'
import { Icon } from '@/ui/Icon'
import { WordRow } from './WordRow'

/**
 * A collection is its own route rather than a piece of Explore's state, so the
 * back button comes back to the list instead of leaving the app.
 */
export function CollectionPage() {
  const { collectionId } = useParams()
  const learned = useProgressSlice((s) => s.learned)
  const known = useProgressSlice((s) => s.known)
  const [open, setOpen] = useState<string | null>(null)

  const collection = collectionId ? getCollection(collectionId) : undefined
  if (!collection) return <Navigate to="/esplora" replace />

  const words = collectionWords(collection)
  const done = collectionProgress(collection, { learned, known })
  const complete = done === words.length

  return (
    <div className="space-y-4 pt-2">
      {/* `replace`, so back from here goes to whatever came before Esplora
          instead of bouncing between the list and the collection. */}
      <Link to="/esplora" replace className="flex items-center gap-1 text-sm text-ink-soft">
        <Icon name="compass" size={16} /> Tutte le raccolte
      </Link>

      <div>
        <h1 className="font-serif text-2xl font-semibold">{collection.name}</h1>
        <p className="mt-1 text-sm text-ink-soft">{collection.description}</p>
      </div>

      <div>
        <div className="h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-500"
            style={{ width: `${(done / words.length) * 100}%` }}
          />
        </div>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-soft">
          {complete && <Icon name="medal" size={14} className="text-brand" />}
          {complete ? 'Raccolta completata' : `${done} di ${words.length} imparate`}
        </p>
      </div>

      <ul className="space-y-2">
        {words.map((word) => (
          <WordRow
            key={word.id}
            word={word}
            open={open === word.id}
            onToggle={() => setOpen(open === word.id ? null : word.id)}
          />
        ))}
      </ul>
    </div>
  )
}
