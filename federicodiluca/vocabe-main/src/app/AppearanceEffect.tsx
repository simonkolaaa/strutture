import { useEffect } from 'react'
import { useProgressSlice } from '@/state/hooks'

/**
 * Applies the appearance settings to <html>: theme (tracking the OS preference
 * when set to "system"), reading typeface and text size.
 */
export function AppearanceEffect() {
  const theme = useProgressSlice((s) => s.settings.theme)
  const readingFont = useProgressSlice((s) => s.settings.readingFont)
  const textSize = useProgressSlice((s) => s.settings.textSize)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      document.documentElement.classList.toggle('dark', dark)
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) meta.setAttribute('content', dark ? '#1c1917' : '#faf7f2')
    }
    apply()
    if (theme === 'system') {
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [theme])

  useEffect(() => {
    document.documentElement.classList.toggle('reading-sans', readingFont === 'sans')
  }, [readingFont])

  useEffect(() => {
    document.documentElement.classList.toggle('text-grande', textSize === 'grande')
  }, [textSize])

  return null
}
