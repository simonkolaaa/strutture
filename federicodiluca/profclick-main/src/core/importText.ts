// Programma incollato da una nota (Google Keep, un documento, il piano di lavoro dell'anno
// scorso). Capisce tre abitudini diffuse, anche mescolate:
//
// - elenco di argomenti: una riga per argomento, le righe rientrate (o con il trattino sotto
//   una riga senza segni) diventano sotto-punti, le ore in fondo si tolgono dal titolo ("(10h)", "- 8 ore"): 0 ore vuol dire solo valutazione;
// - elenco dei voti: "Sistemi di numerazione (scritto)", "Flipped classroom (orale, 30%)",
//   con 1️⃣ 2️⃣ per il periodo e ✳️ per i voti minori; righe con lo stesso titolo nello stesso
//   periodo diventano un solo argomento con più valutazioni;
// - lista "prossimi passi": "⚠️ Scritto ❓" è una valutazione sugli argomenti appena sopra,
//   e ⬅️ segna dove si è arrivati (quello che viene prima è già fatto).

import type { GradeType } from './model'

export interface ParsedAssessment {
  type: GradeType
  /** null = peso non indicato: pieno, o quello dei voti minori se segnato come minore. */
  weight: number | null
  minor: boolean
  text: string
}

export interface ParsedTopic {
  title: string
  hours: number | null
  /** 1 = primo periodo, 2 = secondo…; null se non indicato. */
  period: number | null
  points: string[]
  assessments: ParsedAssessment[]
  completed: boolean
}

const KEYCAP = /^\s*(\d)️?⃣/u
const EMOJI = /[\p{Extended_Pictographic}️⃣⬅]/gu
const CHECKED = /^\s*(?:[☑✓✔✅]|\[[xX]\])/u
const BULLET = /^(?:[-*•–·]|\d+[.)](?=\s)|[☐☑]|\[[ xX]\])\s*/u
const HOURS = /[\s,:;–-]*[([]?\s*(\d+(?:[.,]\d+)?)\s*(?:h|ore|ora)\b\.?\s*[)\]]?\s*$/i
const PAREN = /\s*\(([^()]*)\)\s*$/
// Le righe dell'orario settimanale ("Lunedì (1h): …") non sono argomenti.
const WEEKDAY = /^(?:(?:lune|marte|mercole|giove|vener)d[iì]|sabato)(?=[\s(:,]|$)/i
const HEADER = /^(voti|next|prossim[io]|programma|argomenti)\s*:?\s*$/i

const TYPE_WORDS: [RegExp, GradeType][] = [
  [/\bscritt[oaie]\b|\bverifica\b|\bcompito\b/i, 'scritto'],
  [/\boral[ei]\b|\bteoric[oaie]\b|\binterrogazion[ei]\b/i, 'teorico'],
  [/\bpratic[oaie]\b|\blaboratorio\b|\battivit[aà]|\bprogetto\b/i, 'pratico'],
]

/** Una riga fatta solo di una valutazione: "Scritto", "Pratico con orale", "Scritto piccolo". */
const STANDALONE =
  /^(?:verifica\s+|prova\s+|voto\s+)?(scritt[oa]|orale|interrogazion[ei]|pratic[oa]|attivit[aà]|verifica)(?:\s+(?:e|con|\+)\s+(?:orale|pratico|scritto))?(?:\s+piccol[oa])?$/i

function typesIn(text: string): GradeType[] {
  return TYPE_WORDS.filter(([re]) => re.test(text))
    .map(([re, type]) => ({ type, at: text.search(re) }))
    .sort((a, b) => a.at - b.at)
    .map((t) => t.type)
}

function percentIn(text: string): number | null {
  const m = text.match(/(\d{1,3})\s*%/)
  return m ? Number(m[1]) : null
}

/** "(pratico con orale, 75%)" → pratico, 75%, "con orale". Null se non parla di voti. */
function gradeInfo(inside: string, minor: boolean): ParsedAssessment | null {
  const types = typesIn(inside)
  const weight = percentIn(inside)
  if (types.length === 0 && weight === null) return null
  // Il primo tipo è quello del voto; il resto ("con orale", "con domande") resta come dettaglio.
  const first = TYPE_WORDS.find(([, t]) => t === types[0])?.[0]
  const text = (first ? inside.replace(first, '') : inside)
    .replace(/\s*\d{1,3}\s*%/, '')
    .replace(/\s*,\s*/g, ' ')
    .trim()
  return { type: types[0] ?? 'pratico', weight, minor: minor || (weight !== null && weight < 100), text }
}

function indentOf(line: string): number {
  return line.match(/^\s*/)![0].replace(/\t/g, '    ').length
}

interface Line {
  raw: string
  indent: number
  period: number | null
  minor: boolean
  warning: boolean
  current: boolean
  completed: boolean
  bullet: boolean
  /** Gruppo di righe separato dagli altri da una riga vuota. */
  block: number
  content: string
}

function readLine(raw: string, block: number): Line {
  const keycap = raw.match(KEYCAP)
  const minor = /✳/u.test(raw)
  const warning = /⚠/u.test(raw)
  const current = /⬅/u.test(raw)
  const completed = CHECKED.test(raw)
  let content = raw.replace(KEYCAP, '').replace(EMOJI, ' ').replace(/[?？]+/g, ' ').trim()
  const bullet = BULLET.test(content)
  content = content.replace(BULLET, '').replace(/\s+/g, ' ').trim()
  return { raw, indent: indentOf(raw), period: keycap ? Number(keycap[1]) : null, minor, warning, current, completed, bullet, content, block }
}

export function parseProgram(text: string): ParsedTopic[] {
  let block = 0
  const lines = text
    .split(/\r?\n/)
    .map((raw) => {
      if (!raw.trim()) block++
      return readLine(raw, block)
    })
    .filter((l) => l.content && !HEADER.test(l.content) && !WEEKDAY.test(l.content) && !/^[.…]+$/.test(l.content))
  if (lines.length === 0) return []

  const base = Math.min(...lines.map((l) => l.indent))
  // Elenco dei voti: la maggior parte delle righe dice di che tipo è la valutazione.
  const gradeLines = lines.filter((l) => {
    const m = l.content.match(PAREN)
    return l.minor || l.period !== null || (m && gradeInfo(m[1], false))
  }).length
  const gradeList = gradeLines >= lines.length / 2

  const topics: ParsedTopic[] = []
  let period: number | null = null
  let lastPlain = false
  let currentIndex = -1

  // Una riga senza numero di periodo (es. ✳️) prende quello del suo blocco: il primo indicato
  // prima di lei nel blocco, altrimenti il primo dopo. Così un blocco del secondo periodo che
  // inizia con un voto minore non finisce nel primo.
  const blockPeriod = (line: Line, index: number): number | null => {
    for (let i = index - 1; i >= 0 && lines[i].block === line.block; i--) if (lines[i].period !== null) return lines[i].period
    for (let i = index + 1; i < lines.length && lines[i].block === line.block; i++) if (lines[i].period !== null) return lines[i].period
    return null
  }

  for (const [index, line] of lines.entries()) {
    let content = line.content
    period = line.period ?? blockPeriod(line, index) ?? period
    const previous = topics.at(-1)

    // Sotto-punto: più a destra dell'argomento, o con il trattino sotto una riga senza segni.
    if (previous && !line.warning && (line.indent > base || (line.bullet && lastPlain && /^\s*[-*•–·]/.test(line.raw)))) {
      previous.points.push(content)
      continue
    }

    if (STANDALONE.test(content)) {
      const [type] = typesIn(content)
      const assessment: ParsedAssessment = {
        type: type ?? 'scritto',
        weight: null,
        minor: line.minor || /piccol|attivit/i.test(content),
        text: /\b(e|con|\+)\s+\w+/i.test(content) ? content.replace(/^\S+\s*/, '') : '',
      }
      if (previous) previous.assessments.push(assessment)
      else topics.push({ title: 'Verifica', hours: 0, period, points: [], assessments: [assessment], completed: false })
      if (line.current) currentIndex = topics.length - 1
      lastPlain = false
      continue
    }

    let hours: number | null = null
    const h = content.match(HOURS)
    if (h) {
      hours = Number(h[1].replace(',', '.'))
      content = content.slice(0, h.index).trim()
    }
    let assessment: ParsedAssessment | null = null
    const paren = content.match(PAREN)
    if (paren) {
      assessment = gradeInfo(paren[1], line.minor)
      if (assessment || /^\s*$/.test(paren[1])) content = content.slice(0, paren.index).trim()
    }
    if (!assessment && gradeList) assessment = { type: 'scritto', weight: null, minor: line.minor, text: '' }
    if (!content) continue

    // Stesso titolo nello stesso periodo: un argomento solo, con più valutazioni.
    const same = topics.find((t) => t.title.toLowerCase() === content.toLowerCase() && t.period === period)
    if (same) {
      if (assessment) same.assessments.push(assessment)
      if (line.current) currentIndex = topics.indexOf(same)
    } else {
      // Una voce che è solo una valutazione (prova parallela, verifica comune) non ha ore.
      if (hours === null && /^(prova|verifica|compito)\b/i.test(content)) hours = 0
      topics.push({ title: content, hours, period, points: [], assessments: assessment ? [assessment] : [], completed: line.completed })
      if (line.current) currentIndex = topics.length - 1
    }
    lastPlain = !line.bullet && !line.warning && line.period === null && !line.minor
  }

  // ⬅️ "sono qui": gli argomenti prima sono già svolti.
  for (let i = 0; i < currentIndex; i++) topics[i].completed = true
  return topics
}
