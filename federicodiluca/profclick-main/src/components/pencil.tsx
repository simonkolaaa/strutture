// Segni a mano della matita rossa e blu del logo: pochi, dove il docente segnerebbe davvero
// (oggi cerchiato, la lezione spuntata, il titolo sottolineato, quello che manca segnato in
// rosso, la lezione saltata barrata). La grana li fa sembrare grafite sul tema chiaro e
// gessetto colorato su quello scuro; il colore è currentColor, di solito text-pencil-blue.

import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

/** Il filtro della grana, una volta sola nella pagina: i segni lo richiamano per id. */
export function PencilFilters() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        {/* Bordi appena mossi e qualche puntino scoperto. */}
        <filter id="pencil-grain" x="-10%" y="-60%" width="120%" height="220%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" result="moved" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2 1.75" result="specks" />
          <feComposite in="moved" in2="specks" operator="in" />
        </filter>
      </defs>
    </svg>
  )
}

function Mark({ className, children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#pencil-grain)"
      aria-hidden="true"
      className={cn('pointer-events-none overflow-visible', className)}
      {...props}
    >
      {children}
    </svg>
  )
}

/** Un giro a mano attorno a una parola, aperto e un po' storto. Va in un contenitore relative. */
export function PencilCircle({ className }: { className?: string }) {
  return (
    <Mark viewBox="0 0 100 40" preserveAspectRatio="none" className={cn('absolute -top-2.5 -left-3.5 h-[calc(100%+1.25rem)] w-[calc(100%+1.75rem)]', className)}>
      <path vectorEffect="non-scaling-stroke" d="M58 4C86 3 99 12 97 21 95 32 66 38 38 36 12 34 1 25 4 15 7 6 28 2 66 6" />
    </Mark>
  )
}

/** Una riga sotto, tirata a mano e un po' in salita. Va in un contenitore relative. */
export function PencilUnderline({ className }: { className?: string }) {
  return (
    <Mark viewBox="0 0 100 8" preserveAspectRatio="none" className={cn('absolute -bottom-1.5 -left-1 h-2 w-[calc(100%+0.5rem)]', className)}>
      <path vectorEffect="non-scaling-stroke" d="M2 6C24 4.5 52 3.5 98 2.5" />
    </Mark>
  )
}

/** La sottolineatura dell'errore: ondulata, in rosso. Va in un contenitore relative. */
export function PencilWave({ className }: { className?: string }) {
  return (
    <Mark viewBox="0 0 100 8" preserveAspectRatio="none" className={cn('absolute -bottom-1.5 left-0 h-2 w-full text-pencil-red', className)}>
      <path vectorEffect="non-scaling-stroke" d="M1 5C7 1 11 1 15 4S24 8 29 4 38 0 43 4 52 8 57 4 66 0 71 4 80 8 85 4 94 0 99 4" />
    </Mark>
  )
}

/** Un tratto storto sopra le parole: cancellato. Va in un contenitore relative. */
export function PencilStrike({ className }: { className?: string }) {
  return (
    <Mark viewBox="0 0 100 10" preserveAspectRatio="none" className={cn('absolute top-1/2 -left-1 h-2.5 w-[calc(100%+0.5rem)] -translate-y-1/2', className)}>
      <path vectorEffect="non-scaling-stroke" d="M2 7C30 5 60 4 98 3" />
    </Mark>
  )
}

/** La spunta del fatto, tirata veloce: esce un po' dal suo cerchio. */
export function PencilTick({ className }: { className?: string }) {
  return (
    <Mark viewBox="0 0 24 24" className={className}>
      <path d="M3 13.5C5 15 7.5 17.5 9 20.5 12 13 16 7 23 1.5" />
    </Mark>
  )
}
