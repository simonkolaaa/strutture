import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Segmented } from '@/components/bits'
import { GoogleIcon, NotesIcon, PrepIcon, SuggestIcon, UploadIcon, WrittenTestIcon } from '@/components/icons'
import { InstallButton } from '@/components/InstallButton'
import { Button } from '@/components/ui/button'
import { setYear } from '@/core/actions'
import { today } from '@/core/dates'
import { normalizeData } from '@/core/model'
import { sampleData } from '@/core/sample'
import { defaultSchoolYear, PERIOD_PRESETS, type PeriodPreset, schoolYearStart } from '@/core/schoolYear'
import { useAuth } from '@/state/auth'
import { useData } from '@/state/data'

/** Prima apertura: si parte in un tocco, con l'anno già pronto, oppure dai dati di esempio. */
export default function Welcome() {
  const { apply, importData } = useData()
  const { available, token, signIn, signingIn } = useAuth()
  const [preset, setPreset] = useState<PeriodPreset>('quadrimestri')
  const input = useRef<HTMLInputElement>(null)
  const startYear = schoolYearStart(today())
  const label = defaultSchoolYear(startYear).label

  return (
    <div className="mx-auto max-w-xl space-y-8 py-8">
      <div className="space-y-3">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-balance">Il piano di lavoro, lezione per lezione.</h1>
        <p className="text-muted-foreground">
          Metti il programma e l'orario delle tue classi: ProfClick conta le ore vere dell'anno, ti propone dove mettere spiegazioni e verifiche per avere
          tutti i voti che servono, e ogni settimana ti dice cosa fare e cosa preparare. Al posto delle note sparse.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { icon: SuggestIcon, text: 'Il programma diviso per periodi e una proposta di piano, da applicare con un tocco' },
          { icon: WrittenTestIcon, text: 'Scritto, orale e pratico: sai sempre quali voti mancano' },
          { icon: PrepIcon, text: 'Cosa preparare prima delle lezioni e cosa correggere dopo, in una lista sola' },
          { icon: NotesIcon, text: 'Riunioni e note al posto di quelle su Keep, anche per classe' },
        ].map(({ icon: Icon, text }) => (
          <li key={text} className="flex gap-2 rounded-xl border bg-card p-3 text-sm">
            <Icon className="size-5 shrink-0 text-pencil-blue" />
            {text}
          </li>
        ))}
      </ul>

      <div className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Anno scolastico {label}</h2>
        <Segmented value={preset} onChange={setPreset} options={(Object.keys(PERIOD_PRESETS) as PeriodPreset[]).map((p) => ({ value: p, label: PERIOD_PRESETS[p] }))} />
        <p className="text-sm text-muted-foreground">Date e festività nazionali sono già inserite: potrai adattarle alla tua regione in qualsiasi momento.</p>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" onClick={() => apply(setYear(defaultSchoolYear(startYear, preset)))}>
            Inizia
          </Button>
          <Button size="lg" variant="outline" onClick={() => importData(sampleData(today()))}>
            Prova con dati di esempio
          </Button>
          <InstallButton size="lg" variant="ghost" label="Installa l'app" />
        </div>
      </div>

      {available && !token && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          Usi già ProfClick su un altro dispositivo?
          <Button variant="outline" onClick={() => void signIn()} disabled={signingIn}>
            <GoogleIcon /> Recupera da Google Drive
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        Hai un file di ProfClick (una copia di sicurezza)?
        <Button variant="outline" onClick={() => input.current?.click()}>
          <UploadIcon /> Importa il file
        </Button>
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            try {
              importData(normalizeData(JSON.parse(await file.text())))
            } catch {
              toast.error('Il file non è una copia di ProfClick')
            }
          }}
        />
      </div>
    </div>
  )
}
