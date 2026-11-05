import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'

export const cn = (...parts: ClassValue[]) => clsx(parts)
