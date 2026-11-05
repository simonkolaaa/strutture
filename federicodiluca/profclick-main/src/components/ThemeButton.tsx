import { type IconComponent, MoonIcon, SunIcon, SystemThemeIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { type ThemeChoice, useTheme } from '@/state/theme'

const CHOICES: { value: ThemeChoice; label: string; icon: IconComponent }[] = [
  { value: 'system', label: 'Come il sistema', icon: SystemThemeIcon },
  { value: 'light', label: 'Chiaro', icon: SunIcon },
  { value: 'dark', label: 'Scuro', icon: MoonIcon },
]

/** Chiaro, scuro o come il sistema: l'icona mostra il tema che si vede ora. */
export function ThemeButton() {
  const { choice, theme, setChoice } = useTheme()
  const Icon = theme === 'dark' ? MoonIcon : SunIcon
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Tema" title="Tema">
          <Icon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={choice} onValueChange={(v) => setChoice(v as ThemeChoice)}>
          {CHOICES.map((c) => (
            <DropdownMenuRadioItem key={c.value} value={c.value}>
              <c.icon />
              {c.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
