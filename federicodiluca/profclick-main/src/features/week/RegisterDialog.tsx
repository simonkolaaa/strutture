import { useState } from 'react'
import { toast } from 'sonner'
import { Segmented } from '@/components/bits'
import { CopyIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { LessonSlot } from '@/core/calendar'
import { type RegisterGrouping, registerText } from '@/core/registerText'
import { useData } from '@/state/data'

/** Gli argomenti delle lezioni della settimana fino a oggi, da incollare nel registro. */
export function RegisterDialog({ slots, open, onClose }: { slots: LessonSlot[]; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">{open && <RegisterForm slots={slots} onClose={onClose} />}</DialogContent>
    </Dialog>
  )
}

function RegisterForm({ slots, onClose }: { slots: LessonSlot[]; onClose: () => void }) {
  const { data } = useData()
  const [grouping, setGrouping] = useState<RegisterGrouping>('giorno')
  const text = registerText(data, slots, grouping)

  const copy = () =>
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success('Copiato: ora incollalo nel registro')
        onClose()
      },
      () => toast.error('Copia non riuscita'),
    )

  return (
    <>
      <DialogHeader>
        <DialogTitle>Per il registro</DialogTitle>
        <DialogDescription>
          Gli argomenti delle lezioni di questa settimana fino a oggi, delle classi che stai guardando. Una riga per lezione, da incollare nel campo
          dell'argomento.
        </DialogDescription>
      </DialogHeader>
      <Segmented<RegisterGrouping>
        value={grouping}
        onChange={setGrouping}
        options={[
          { value: 'giorno', label: 'Per giorno' },
          { value: 'classe', label: 'Per classe' },
        ]}
      />
      {text ? (
        <pre className="max-h-[50dvh] overflow-y-auto rounded-xl bg-muted/50 p-3 font-sans text-sm whitespace-pre-wrap">{text}</pre>
      ) : (
        <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">Nessuna lezione con qualcosa in programma, fino a oggi.</p>
      )}
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Chiudi
        </Button>
        <Button onClick={copy} disabled={!text}>
          <CopyIcon /> Copia il testo
        </Button>
      </DialogFooter>
    </>
  )
}
