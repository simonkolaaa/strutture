# 0002 — Stack: React, Vite, shadcn/ui, wouter con indirizzi #

Stesso stack di Duetrack, per riusarne codice e abitudini: React 19, Vite, TypeScript,
Tailwind 4, componenti shadcn/ui su Radix copiati in `src/components/ui`, idb-keyval, sonner,
vite-plugin-pwa, Vitest, oxlint.

- **wouter con indirizzi `#/…`**: GitHub Pages serve solo file statici, un percorso "vero"
  darebbe 404 al ricaricamento.
- **Icone disegnate a mano** (`src/components/icons.tsx`), tutte con lo stesso tratto; niente
  emoji nell'interfaccia. Lucide resta solo dentro i componenti shadcn (chiusura, spunte, frecce).
- **Palette**: verde lavagna, più il rosso e il blu della matita del docente: blu per ciò che
  si fa, rosso per le valutazioni.
- **Logica pura in `src/core`**, testata senza React; l'interfaccia la usa con funzioni
  `Change = (data) => data`.
