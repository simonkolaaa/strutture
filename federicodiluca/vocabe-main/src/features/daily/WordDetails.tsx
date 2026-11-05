import { useState } from 'react'
import type { Word } from '@/core/types'
import { useIsFavorite, useIsLearned, useNote } from '@/state/hooks'
import { toggleFavorite, setNote, markLearned, unmarkLearned } from '@/state/store'
import { speak, speechAvailable } from '@/core/speech'
import { levelLabel } from '@/core/content/levels'
import { Button } from '@/ui/Button'
import { Icon } from '@/ui/Icon'
import { cn } from '@/ui/cn'
import { ShareSheet } from './ShareSheet'

const CATEGORY_LABEL: Record<NonNullable<Word['category']>, string> = {
  comune: 'comune',
  letteraria: 'letteraria',
  scientifica: 'scientifica',
  antica: 'antica',
  regionale: 'regionale',
  straniera: 'straniera',
}

export function WordDetails({
  word,
  /**
   * Show the "learn" toggle. Off where the screen already owns that action —
   * the daily card and the bonus card have their own button right below.
   */
  learnAction = false,
  /** Show the share icon. Off on the daily card, which has its own big button. */
  shareAction = true,
}: {
  word: Word
  learnAction?: boolean
  shareAction?: boolean
}) {
  const fav = useIsFavorite(word.id)
  const [shareOpen, setShareOpen] = useState(false)
  const learned = useIsLearned(word.id)
  const savedNote = useNote(word.id)
  const [noteOpen, setNoteOpen] = useState(Boolean(savedNote))
  const [draft, setDraft] = useState(savedNote)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1 text-ink-soft">
        <button
          onClick={() => toggleFavorite(word.id)}
          aria-label={fav ? 'Togli dai preferiti' : 'Aggiungi ai preferiti'}
          className={cn('rounded-full p-1.5 transition hover:bg-line/50', fav && 'text-brand')}
        >
          <Icon name={fav ? 'star-filled' : 'star'} size={20} />
        </button>
        {speechAvailable() && (
          <button
            onClick={() => speak(word.term)}
            aria-label="Ascolta la pronuncia"
            className="rounded-full p-1.5 transition hover:bg-line/50"
          >
            <Icon name="speaker" size={20} />
          </button>
        )}
        <button
          onClick={() => setNoteOpen((v) => !v)}
          aria-label="Nota personale"
          className={cn('rounded-full p-1.5 transition hover:bg-line/50', savedNote && 'text-brand')}
        >
          <Icon name="note" size={20} />
        </button>
        {shareAction && (
          <button
            onClick={() => setShareOpen(true)}
            aria-label="Condividi la parola"
            className="rounded-full p-1.5 transition hover:bg-line/50"
          >
            <Icon name="share" size={20} />
          </button>
        )}
      </div>

      <p className="text-lg leading-relaxed">{word.meaning}</p>

      {word.usage && (
        <p className="text-sm text-ink-soft">
          <span className="font-semibold text-ink">Si usa:</span> {word.usage}
        </p>
      )}

      {word.examples.length > 0 && (
        <ul className="space-y-2 border-l-2 border-brand/40 pl-4">
          {word.examples.map((ex, i) => (
            <li key={i} className="font-reading italic text-ink-soft">
              {ex}
            </li>
          ))}
        </ul>
      )}

      {word.synonyms && word.synonyms.length > 0 && (
        <p className="text-sm text-ink-soft">
          <span className="font-semibold text-ink">Sinonimi:</span> {word.synonyms.join(', ')}
        </p>
      )}

      {word.etymology && (
        <p className="text-sm text-ink-soft">
          <span className="font-semibold text-ink">Etimologia:</span> {word.etymology}
        </p>
      )}

      {word.curiosity && (
        <p className="flex gap-2 rounded-2xl bg-brand-soft/60 p-4 text-sm leading-relaxed text-ink">
          <Icon name="sparkle" size={18} className="mt-0.5 shrink-0 text-brand" />
          <span>{word.curiosity}</span>
        </p>
      )}

      {noteOpen && (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => setNote(word.id, draft)}
          placeholder="Nota personale…"
          rows={2}
          className="w-full rounded-2xl border border-line bg-paper-raised p-3 text-sm outline-none focus:border-brand"
        />
      )}

      {learnAction &&
        (learned ? (
          <div className="flex items-center justify-between rounded-2xl bg-brand-soft px-4 py-2.5 text-sm text-brand">
            <span className="inline-flex items-center gap-2 font-semibold">
              <Icon name="check" size={16} /> Imparata
            </span>
            <button className="text-xs underline" onClick={() => unmarkLearned(word.id)}>
              annulla
            </button>
          </div>
        ) : (
          <Button variant="outline" className="w-full py-2.5 text-sm" onClick={() => markLearned(word.id)}>
            <Icon name="check" size={16} /> Segna come imparata
          </Button>
        ))}

      <div className="flex flex-wrap gap-2 text-xs text-ink-soft">
        {word.category && (
          <span className="rounded-full border border-line px-2 py-0.5">
            {CATEGORY_LABEL[word.category]}
          </span>
        )}
        {word.difficulty && (
          <span className="rounded-full border border-line px-2 py-0.5">
            {'●'.repeat(word.difficulty)}
            {'○'.repeat(5 - word.difficulty)} {levelLabel(word.difficulty).toLowerCase()}
          </span>
        )}
      </div>

      {shareAction && <ShareSheet word={word} open={shareOpen} onClose={() => setShareOpen(false)} />}
    </div>
  )
}
