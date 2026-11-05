/** Italian text-to-speech via the browser's built-in speech synthesis. */
export const speechAvailable = () => typeof window !== 'undefined' && 'speechSynthesis' in window

/**
 * `getVoices()` returns an empty list until the engine has loaded them, which on
 * Chrome and Android happens after the first call — so the first tap would fall
 * back to the default voice. Keep the last known list and refresh it whenever
 * the browser says it changed.
 */
let voices: SpeechSynthesisVoice[] = []

function refreshVoices(): void {
  voices = window.speechSynthesis.getVoices()
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices()
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices)
}

export function speak(text: string): void {
  if (!speechAvailable()) return
  if (voices.length === 0) refreshVoices()

  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'it-IT'
  u.rate = 0.95
  const italian = voices.find((v) => v.lang.toLowerCase().startsWith('it'))
  if (italian) u.voice = italian
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
}
