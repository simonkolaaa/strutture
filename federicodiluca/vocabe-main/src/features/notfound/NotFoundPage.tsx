import { Link } from 'react-router-dom'
import { Card } from '@/ui/Card'

/**
 * Pagina 404, travestita da parola del giorno: la voce è "irreperibile", il resto spiega che
 * l'indirizzo non esiste e riporta alla parola vera.
 */
export function NotFoundPage() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-soft">Errore 404 · parola fuori programma</p>

      <Card>
        <div className="mb-4 flex items-baseline gap-2">
          <h1 className="font-reading text-4xl font-semibold tracking-tight">irreperìbile</h1>
          <span className="text-sm italic text-ink-soft">agg.</span>
        </div>
        <p className="font-reading text-lg leading-relaxed">Che non si riesce a trovare, per quanto lo si cerchi.</p>
        <p className="mt-3 font-reading italic text-ink-soft">«La pagina che cercavi è irreperibile.»</p>
        <p className="mt-4 text-sm text-ink-soft">
          Etimologia: dal latino <i>reperire</i>, «trovare», con il prefisso negativo. Come questa pagina, che non
          c'è mai stata o ha cambiato indirizzo.
        </p>
      </Card>

      <Link
        to="/"
        replace
        className="flex w-full items-center justify-center rounded-2xl bg-brand px-5 py-3 font-semibold text-white hover:opacity-90"
      >
        Torna alla parola di oggi
      </Link>
      <Link to="/esplora" className="block text-center text-sm text-ink-soft underline">
        oppure esplora le raccolte
      </Link>
    </div>
  )
}
