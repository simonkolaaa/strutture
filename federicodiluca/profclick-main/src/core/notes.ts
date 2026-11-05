// Le note della bacheca (ADR 0023): testo libero, letto riga per riga. Niente editor a
// blocchi: si scrive come su un foglio, e le poche convenzioni si vedono già nel testo.
//   [ ] da fare     [x] fatto     - voce di elenco     **grassetto**
// Gli indirizzi web diventano link.

import type { Course, Note, ProfclickData } from './model'

export type NoteLine =
  | { kind: 'check'; done: boolean; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'text'; text: string }
  | { kind: 'blank' }

const CHECK = /^\s*(?:[-*]\s+)?\[([ xX])\]\s?(.*)$/
const BULLET = /^\s*[-*•]\s+(.*)$/

export function noteLines(text: string): NoteLine[] {
  return text.split('\n').map((line): NoteLine => {
    const check = CHECK.exec(line)
    if (check) return { kind: 'check', done: check[1] !== ' ', text: check[2] }
    const bullet = BULLET.exec(line)
    if (bullet) return { kind: 'bullet', text: bullet[1] }
    return line.trim() ? { kind: 'text', text: line } : { kind: 'blank' }
  })
}

/** Spunta o toglie la spunta alla riga i-esima, se è una casella. */
export function toggleNoteLine(text: string, index: number): string {
  const lines = text.split('\n')
  const line = lines[index]
  if (line === undefined || !CHECK.test(line)) return text
  lines[index] = line.replace(/\[([ xX])\]/, (_m, mark: string) => (mark === ' ' ? '[x]' : '[ ]'))
  return lines.join('\n')
}

/** Quante caselle ci sono e quante sono spuntate. */
export function noteChecks(text: string): { done: number; total: number } {
  const checks = noteLines(text).filter((l) => l.kind === 'check')
  return { done: checks.filter((l) => l.done).length, total: checks.length }
}

export type Inline = { kind: 'text' | 'bold' | 'link'; text: string }

const INLINE = /\*\*(.+?)\*\*|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g

/** Grassetto e link dentro una riga. */
export function inlineParts(text: string): Inline[] {
  const parts: Inline[] = []
  let last = 0
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) parts.push({ kind: 'text', text: text.slice(last, m.index) })
    parts.push(m[1] !== undefined ? { kind: 'bold', text: m[1] } : { kind: 'link', text: m[2] })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ kind: 'text', text: text.slice(last) })
  return parts
}

/** Le note in ordine di bacheca: prima quelle fissate, poi le altre. */
export function sortedNotes(data: ProfclickData): Note[] {
  return Object.values(data.notes).sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.order - b.order || b.updatedAt - a.updatedAt)
}

/** Le classi ancora esistenti di una nota: una classe eliminata non lascia tracce. */
export function noteCourses(data: ProfclickData, note: Note): Course[] {
  return note.courseIds.map((id) => data.courses[id]).filter((c): c is Course => Boolean(c))
}

/** Un posto in cima alla bacheca, per una nota nuova. */
export function topOrder(data: ProfclickData): number {
  return Math.min(1, ...Object.values(data.notes).map((n) => n.order)) - 1
}
