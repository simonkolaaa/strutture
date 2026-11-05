import { type ComponentProps, type ReactNode, useState } from 'react'
import { AddSquareIcon, InstallIcon, ShareIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { promptInstall, useInstallMode } from '@/state/install'

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold tabular-nums">{n}</span>
      <span className="pt-0.5 [&_svg]:inline [&_svg]:size-4 [&_svg]:align-[-0.15em]">{children}</span>
    </li>
  )
}

/**
 * Installa ProfClick come un'app, con la sua icona: in classe si apre con un tocco, anche
 * offline. Dove il browser lo permette apre la sua finestra di installazione; su iPhone,
 * iPad e Safari per Mac, che non la offrono, spiega il menu da usare. Se l'app è già
 * installata, o il browser non la può installare, il pulsante non c'è.
 */
export function InstallButton({ label = 'Installa', ...props }: ComponentProps<typeof Button> & { label?: string }) {
  const mode = useInstallMode()
  const [help, setHelp] = useState(false)

  if (!mode) return null

  return (
    <>
      <Button {...props} onClick={() => (mode === 'prompt' ? void promptInstall() : setHelp(true))}>
        <InstallIcon />
        {label}
      </Button>
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Installa ProfClick</DialogTitle>
            <DialogDescription>
              {mode === 'ios'
                ? 'Avrai la sua icona nella schermata Home e si aprirà a tutto schermo, come le altre app. Funziona anche senza rete.'
                : 'Avrai la sua icona nel Dock e si aprirà in una finestra sua, come le altre app.'}
            </DialogDescription>
          </DialogHeader>
          <ol className="grid gap-3">
            {mode === 'ios' ? (
              <>
                <Step n={1}>
                  Tocca <ShareIcon /> <strong>Condividi</strong>, nella barra del browser
                </Step>
                <Step n={2}>
                  Scegli <AddSquareIcon /> <strong>Aggiungi alla schermata Home</strong> (se non lo vedi, scorri l'elenco)
                </Step>
                <Step n={3}>
                  Tocca <strong>Aggiungi</strong>
                </Step>
              </>
            ) : (
              <>
                <Step n={1}>
                  Apri il menu <strong>File</strong> di Safari, oppure <ShareIcon /> <strong>Condividi</strong>
                </Step>
                <Step n={2}>
                  Scegli <strong>Aggiungi al Dock</strong>
                </Step>
              </>
            )}
          </ol>
          <DialogFooter>
            <Button onClick={() => setHelp(false)}>Ho capito</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
