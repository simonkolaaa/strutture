import { Download, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const IMAGE = '/story.png'
const TEXT = 'ProfClick: il piano di lavoro del docente, lezione per lezione. Gratis, dal browser.'
const APP_URL = 'https://profclick.federicodiluca.com/'

function download(blob: Blob) {
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = 'profclick.png'
  a.click()
  URL.revokeObjectURL(href)
}

/**
 * "Consiglia ProfClick": un link discreto che apre l'anteprima dell'immagine per le storie
 * (public/story.png, `npm run story:build`) e la passa al menu di condivisione del telefono,
 * da cui si sceglie Instagram → Storia. Dove il browser non condivide file, la scarica.
 * L'immagine si carica all'apertura, così il tocco su "Condividi" la trova già pronta:
 * Safari rifiuta la condivisione se tra il tocco e la chiamata c'è un'attesa di rete.
 */
export function ShareApp({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [blob, setBlob] = useState<Blob | null>(null)

  useEffect(() => {
    if (!open || blob) return
    fetch(IMAGE)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(r.statusText))))
      .then(setBlob)
      .catch(() => setBlob(null))
  }, [open, blob])

  async function share() {
    if (!blob) return
    const file = new File([blob], 'profclick.png', { type: 'image/png' })
    if (!navigator.canShare?.({ files: [file] })) return download(blob)
    try {
      await navigator.share({ files: [file], text: `${TEXT}\n${APP_URL}` })
    } catch (e) {
      if ((e as Error).name !== 'AbortError') download(blob)
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        Consiglia ProfClick
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Consiglia ProfClick</DialogTitle>
            <DialogDescription>
              Un’immagine pronta per le storie di Instagram, con il link scritto sopra. Dal telefono, “Condividi” apre il
              menu del sistema: scegli Instagram e poi Storia.
            </DialogDescription>
          </DialogHeader>
          <img
            src={IMAGE}
            alt="ProfClick: il piano di lavoro del docente, lezione per lezione"
            width={1080}
            height={1920}
            className="mx-auto max-h-[50dvh] w-auto rounded-lg border"
          />
          <DialogFooter>
            <Button variant="outline" disabled={!blob} onClick={() => blob && download(blob)}>
              <Download />
              Scarica
            </Button>
            <Button disabled={!blob} onClick={() => void share()}>
              <Share2 />
              Condividi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
