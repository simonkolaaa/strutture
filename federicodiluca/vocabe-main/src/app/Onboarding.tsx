import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { completeOnboarding } from '@/state/store'
import { Button } from '@/ui/Button'
import { Icon, type IconName } from '@/ui/Icon'
import { LogoTile } from '@/ui/Logo'
import { cn } from '@/ui/cn'

const SLIDES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'book',
    title: 'Una parola italiana al giorno',
    body: 'Ogni giorno un vocabolo ricercato: significato, esempi d’uso, etimologia e una curiosità.',
  },
  {
    icon: 'cards',
    title: 'Impara e ripassa',
    body: 'Segnala come imparata. Il giorno dopo un quiz veloce ti aiuta a fissarla in memoria, con ripetizione spaziata.',
  },
  {
    icon: 'sliders',
    title: 'Tutto resta con te',
    body: 'Niente account, niente tracciamento. I progressi vivono su questo dispositivo e puoi esportarli quando vuoi.',
  },
  {
    icon: 'chart',
    title: 'Quanto ne sai già?',
    body: 'Un test di due minuti: venti parole, dalle più comuni alle più rare. Da lì in poi ti proponiamo solo quelle che non conosci.',
  },
]

export function Onboarding() {
  const navigate = useNavigate()
  const [i, setI] = useState(0)
  const last = i === SLIDES.length - 1
  const slide = SLIDES[i]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-[calc(env(safe-area-inset-top)+1rem)]">
      <div className="flex justify-end">
        <button className="text-sm text-ink-soft" onClick={completeOnboarding}>
          Salta
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-8">
          {i === 0 ? (
            <LogoTile size={80} />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-soft text-brand">
              <Icon name={slide.icon} size={40} strokeWidth={1.5} />
            </div>
          )}
        </div>
        <h1 className="mb-3 font-serif text-2xl font-semibold">{slide.title}</h1>
        <p className="max-w-xs text-ink-soft">{slide.body}</p>
      </div>

      <div className="mb-6 flex justify-center gap-2">
        {SLIDES.map((_, idx) => (
          <span
            key={idx}
            className={cn('h-1.5 rounded-full transition-all', idx === i ? 'w-6 bg-brand' : 'w-1.5 bg-line')}
          />
        ))}
      </div>

      {last ? (
        <>
          <Button
            className="w-full"
            onClick={() => {
              completeOnboarding()
              navigate('/livello', { replace: true })
            }}
          >
            Fai il test
          </Button>
          <Button variant="ghost" className="mt-1 w-full" onClick={completeOnboarding}>
            Salta, parto dal primo livello
          </Button>
        </>
      ) : (
        <Button className="w-full" onClick={() => setI(i + 1)}>
          Avanti
        </Button>
      )}
    </div>
  )
}
