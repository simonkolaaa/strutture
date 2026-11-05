import { CloudCheckIcon, CloudIcon, CloudOffIcon, CloudUpIcon, GoogleIcon, type IconComponent } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/state/auth'
import { type SyncStatus, useData } from '@/state/data'

function formatTime(date: Date): string {
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function describe(sync: SyncStatus): { icon: IconComponent; label: string; title: string } {
  switch (sync.state) {
    case 'synced':
      return { icon: CloudCheckIcon, label: 'Salvato', title: `Salvato su Google Drive alle ${formatTime(sync.at)}` }
    case 'syncing':
      return { icon: CloudUpIcon, label: 'Salvo…', title: 'Sincronizzazione con Google Drive in corso' }
    case 'pending':
      return { icon: CloudUpIcon, label: 'Da salvare', title: 'Modifiche non ancora salvate su Google Drive' }
    case 'offline':
      return { icon: CloudOffIcon, label: 'Offline', title: 'Sei offline: le modifiche restano qui e vanno su Drive al ritorno della rete' }
    case 'error':
      return { icon: CloudOffIcon, label: 'Errore', title: `Sincronizzazione non riuscita: ${sync.message}. Tocca per riprovare.` }
    case 'off':
      return { icon: CloudIcon, label: 'Solo qui', title: 'Dati salvati solo su questo dispositivo' }
  }
}

/**
 * Dove sono i dati. Senza token è il pulsante per collegare (o ricollegare) Google: un
 * tocco, e i dati si uniscono a quelli degli altri dispositivi.
 */
export function SyncButton() {
  const { token, available, linked, signIn, signingIn } = useAuth()
  const { sync, syncNow } = useData()

  if (!available) return null

  if (!token) {
    return (
      <Button
        variant={linked ? 'secondary' : 'outline'}
        size="sm"
        onClick={() => void signIn()}
        disabled={signingIn}
        title={linked ? 'La sessione con Google è scaduta: tocca per sincronizzare di nuovo' : 'Salva su Google Drive per avere gli stessi dati su PC e telefono'}
      >
        <GoogleIcon />
        {signingIn ? 'Collego…' : linked ? 'Sincronizza' : 'Collega Drive'}
      </Button>
    )
  }

  const { icon: Icon, label, title } = describe(sync)
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={syncNow}
      title={title}
      aria-label={title}
      className={cn(sync.state === 'error' && 'text-destructive')}
    >
      <Icon className={cn(sync.state === 'syncing' && 'animate-pulse')} />
      {label}
    </Button>
  )
}
