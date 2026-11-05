import { useState } from 'react'
import { toast } from 'sonner'
import { Segmented, Toggle } from '@/components/bits'
import { CopyIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PROGRAM_TEXT_LABELS, programText, type ProgramTextInput, type ProgramTextKind } from '@/core/programText'

/** Programma svolto o piano di lavoro come testo, da incollare nel modello della scuola. */
export function ProgramTextDialog({ input, kind: initialKind = 'svolto', onClose }: { input: ProgramTextInput | null; kind?: ProgramTextKind; onClose: () => void }) {
  return (
    <Dialog open={input !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">{input && <ProgramTextForm input={input} initialKind={initialKind} onClose={onClose} />}</DialogContent>
    </Dialog>
  )
}

function ProgramTextForm({ input, initialKind, onClose }: { input: ProgramTextInput; initialKind: ProgramTextKind; onClose: () => void }) {
  const [kind, setKind] = useState(initialKind)
  const [byPeriod, setByPeriod] = useState(true)
  const text = programText(input, kind, byPeriod)
  const empty = !text.includes('\n')

  const copy = () =>
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success(`${PROGRAM_TEXT_LABELS[kind]} copiato`)
        onClose()
      },
      () => toast.error('Copia non riuscita'),
    )

  return (
    <>
      <DialogHeader>
        <DialogTitle>{input.courseLabel}</DialogTitle>
        <DialogDescription>
          {kind === 'svolto'
            ? 'Gli argomenti fatti, con i sotto-punti; quelli iniziati sono segnati come svolti in parte.'
            : 'Tutti gli argomenti previsti, con i sotto-punti.'}{' '}
          Si incolla nel modello della scuola.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented<ProgramTextKind> value={kind} onChange={setKind} options={(['svolto', 'piano'] as const).map((k) => ({ value: k, label: PROGRAM_TEXT_LABELS[k] }))} />
        {input.periods.length > 1 && (
          <Toggle on={byPeriod} onClick={() => setByPeriod(!byPeriod)}>
            Diviso per periodo
          </Toggle>
        )}
      </div>
      {empty ? (
        <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
          {kind === 'svolto' ? 'Ancora nessun argomento svolto.' : 'Il programma è vuoto.'}
        </p>
      ) : (
        <pre className="max-h-[50dvh] overflow-y-auto rounded-xl bg-muted/50 p-3 font-sans text-sm whitespace-pre-wrap">{text}</pre>
      )}
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Chiudi
        </Button>
        <Button onClick={copy} disabled={empty}>
          <CopyIcon /> Copia il testo
        </Button>
      </DialogFooter>
    </>
  )
}
