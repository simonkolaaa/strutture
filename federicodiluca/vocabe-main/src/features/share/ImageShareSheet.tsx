import { useEffect, useState } from 'react'
import { shareImageFile, downloadBlob, copyText } from '@/core/share/share'
import { Button } from '@/ui/Button'
import { Icon } from '@/ui/Icon'
import { Sheet } from '@/ui/Sheet'

/**
 * Renders an image on open, previews it, and offers share / download / copy.
 * What the image is — a word, a milestone — is the caller's business: it passes
 * the renderer, the text that goes with it and a file name.
 */
export function ImageShareSheet({
  open,
  onClose,
  title,
  render,
  text,
  filename,
  alt,
}: {
  open: boolean
  onClose: () => void
  title: string
  render: () => Promise<Blob>
  text: string
  filename: string
  alt: string
}) {
  const [blob, setBlob] = useState<Blob | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let revoked = false
    let objectUrl: string | null = null
    setBlob(null)
    setUrl(null)
    setError(false)
    setNote(null)
    render()
      .then((b) => {
        if (revoked) return
        objectUrl = URL.createObjectURL(b)
        setBlob(b)
        setUrl(objectUrl)
      })
      .catch(() => !revoked && setError(true))
    return () => {
      revoked = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
    // The renderer captures its inputs at open time on purpose: re-rendering
    // the card while the sheet is up would swap the preview under the reader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function onShare() {
    if (!blob) return
    const r = await shareImageFile(blob, text)
    if (r === 'unsupported' || r === 'failed') {
      downloadBlob(blob, filename)
      const copied = await copyText(text)
      setNote(copied ? 'Immagine scaricata e testo copiato' : 'Immagine scaricata')
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="mb-4 overflow-hidden rounded-2xl border border-line bg-paper-raised">
        {url ? (
          <img src={url} alt={alt} className="block w-full" />
        ) : (
          <div className="flex aspect-[4/5] items-center justify-center text-sm text-ink-soft">
            {error ? 'Impossibile creare l’immagine' : 'Creazione immagine…'}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Button className="w-full" disabled={!blob} onClick={onShare}>
          <Icon name="share" size={18} /> Condividi
        </Button>
        <Button
          variant="outline"
          className="w-full"
          disabled={!blob}
          onClick={() => blob && downloadBlob(blob, filename)}
        >
          Scarica immagine
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={async () => setNote((await copyText(text)) ? 'Testo copiato' : 'Copia non riuscita')}
        >
          Copia solo testo
        </Button>
      </div>

      {note && <p className="mt-3 text-center text-sm text-ink-soft">{note}</p>}
      <p className="mt-1 text-center text-xs text-ink-soft">
        Su telefono “Condividi” apre il menu del sistema con immagine e testo.
      </p>
    </Sheet>
  )
}
