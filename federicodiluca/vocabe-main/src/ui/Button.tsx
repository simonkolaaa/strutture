import type { ButtonHTMLAttributes } from 'react'
import { cn } from './cn'

type Variant = 'primary' | 'ghost' | 'outline'

const styles: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:opacity-90 disabled:opacity-40',
  ghost: 'text-ink-soft hover:bg-line/50',
  outline: 'border border-line text-ink hover:bg-line/40',
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-semibold transition select-none active:scale-[0.98] disabled:pointer-events-none',
        styles[variant],
        className,
      )}
      {...props}
    />
  )
}
