/**
 * "Add to home screen" support. Chromium browsers fire `beforeinstallprompt`,
 * which we stash so a button can open the native dialog later. Safari and
 * Firefox never fire it: there the button shows manual steps instead.
 *
 * `initInstall()` must run at startup, before React mounts — the event can
 * fire right after load and is not re-dispatched.
 */

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type Platform = 'ios' | 'android' | 'desktop'

export type InstallState = {
  /** already running as an installed app */
  installed: boolean
  /** the browser can show its own install dialog */
  canPrompt: boolean
  platform: Platform
}

let deferred: InstallPromptEvent | null = null
let installed = false
let snapshot: InstallState = { installed: false, canPrompt: false, platform: 'desktop' }
const listeners = new Set<() => void>()

function detectPlatform(): Platform {
  const ua = navigator.userAgent
  // iPadOS reports itself as a Mac; touch support gives it away.
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function emit() {
  snapshot = { installed, canPrompt: !!deferred && !installed, platform: snapshot.platform }
  listeners.forEach((l) => l())
}

export function initInstall(): void {
  installed = isStandalone()
  snapshot = { ...snapshot, platform: detectPlatform() }
  emit()
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // keep the mini-infobar away; we offer our own button
    deferred = e as InstallPromptEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    installed = true
    deferred = null
    emit()
  })
}

export function subscribeInstall(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getInstallState(): InstallState {
  return snapshot
}

/** Opens the native dialog. Resolves to false when there is none, or it was declined. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false
  const e = deferred
  // The event is single-use either way.
  deferred = null
  emit()
  await e.prompt()
  const { outcome } = await e.userChoice
  return outcome === 'accepted'
}
