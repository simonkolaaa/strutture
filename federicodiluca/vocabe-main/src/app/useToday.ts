import { useEffect, useState } from 'react'
import { localDateKey } from '@/core/date'

/**
 * Today's date key, re-checked whenever the app comes back to the foreground.
 *
 * A phone doesn't reload the page: the app is suspended and resumed, so without
 * this a session left open overnight keeps showing yesterday's word — and
 * marking it learned would count it against today.
 */
export function useToday(): string {
  const [day, setDay] = useState(localDateKey)

  useEffect(() => {
    const check = () => setDay((current) => (localDateKey() === current ? current : localDateKey()))
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)
    return () => {
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('focus', check)
    }
  }, [])

  return day
}
