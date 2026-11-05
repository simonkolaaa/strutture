import { useState } from 'react'
import { promptInstall } from '@/core/install'
import { useInstallState, useProgressSlice } from '@/state/hooks'
import { updateSettings } from '@/state/store'
import { Button } from '@/ui/Button'
import { Icon } from '@/ui/Icon'
import { InstallSheet } from './InstallSheet'

/** Opens the browser's own dialog when there is one, the manual steps otherwise. */
function useInstall() {
  const install = useInstallState()
  const [stepsOpen, setStepsOpen] = useState(false)
  const start = () => {
    if (install.canPrompt) void promptInstall()
    else setStepsOpen(true)
  }
  const sheet = (
    <InstallSheet open={stepsOpen} onClose={() => setStepsOpen(false)} platform={install.platform} />
  )
  return { installed: install.installed, start, sheet }
}

/** Full-width button for the settings page. Hidden once running as an installed app. */
export function InstallButton() {
  const { installed, start, sheet } = useInstall()
  if (installed) return null
  return (
    <>
      <Button className="w-full" onClick={start}>
        <Icon name="install" size={18} /> Installa l'app
      </Button>
      {sheet}
    </>
  )
}

/** A dismissable nudge for the daily page — most people don't know a site can be installed. */
export function InstallHint() {
  const { installed, start, sheet } = useInstall()
  const dismissed = useProgressSlice((s) => s.settings.installHintDismissed)
  if (installed || dismissed) return null
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3">
      <Icon name="install" size={22} className="shrink-0 text-brand" />
      <button className="flex-1 text-left text-sm" onClick={start}>
        <span className="font-semibold">Tienila a portata di mano</span>
        <span className="block text-ink-soft">Installa Vocabe e aprila come un'app.</span>
      </button>
      <Button variant="outline" className="px-3 py-1.5 text-sm" onClick={start}>
        Installa
      </Button>
      <button
        className="-mr-1 p-1 text-ink-soft"
        aria-label="Non mostrare più"
        onClick={() => updateSettings({ installHintDismissed: true })}
      >
        ✕
      </button>
      {sheet}
    </div>
  )
}
