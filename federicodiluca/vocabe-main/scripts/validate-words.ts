/* Run with `npm run words:validate`. Checks the dataset before it ships. */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const path = fileURLToPath(new URL('../src/data/words.json', import.meta.url))
const words = JSON.parse(readFileSync(path, 'utf8')) as Array<Record<string, unknown>>

const collectionsPath = fileURLToPath(new URL('../src/data/collections.json', import.meta.url))
const collections = JSON.parse(readFileSync(collectionsPath, 'utf8')) as Array<
  Record<string, unknown>
>

const CATEGORIES = ['comune', 'letteraria', 'scientifica', 'antica', 'regionale', 'straniera']
const errors: string[] = []
const seen = new Set<string>()
// Two words sharing a term or a definition would make a recall question
// unanswerable: one of the wrong options would read exactly like the right one.
const seenTerms = new Map<string, string>()
const seenMeanings = new Map<string, string>()

// A definition that contains its own word (or its root) answers the quiz for
// you: "borioso — pieno di boria". Set phrases belong in `usage`, not here.
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const stemOf = (term: string) => fold(term).slice(0, Math.max(4, term.length - 3))

words.forEach((w, i) => {
  const at = `#${i} (${String(w.term ?? '??')})`
  const id = w.id
  if (typeof id !== 'string' || !/^[a-z0-9-]+$/.test(id)) errors.push(`${at}: id mancante o non slug`)
  else if (seen.has(id)) errors.push(`${at}: id duplicato "${id}"`)
  else seen.add(id as string)

  if (typeof w.term !== 'string' || !w.term) errors.push(`${at}: term mancante`)
  else {
    const key = (w.term as string).toLowerCase()
    const other = seenTerms.get(key)
    if (other) errors.push(`${at}: term già usato da "${other}"`)
    else seenTerms.set(key, String(id))
  }

  if (typeof w.meaning !== 'string' || (w.meaning as string).length < 10)
    errors.push(`${at}: meaning troppo corto`)
  else {
    const other = seenMeanings.get(w.meaning as string)
    if (other) errors.push(`${at}: meaning identico a quello di "${other}"`)
    else seenMeanings.set(w.meaning as string, String(id))
    if (typeof w.term === 'string' && new RegExp(`\\b${stemOf(w.term)}`).test(fold(w.meaning as string)))
      errors.push(`${at}: il significato contiene la radice del termine (sposta la locuzione in "usage")`)
  }

  if (!Array.isArray(w.examples) || w.examples.length < 1)
    errors.push(`${at}: servono almeno 1 esempio`)
  if (w.category !== undefined && !CATEGORIES.includes(w.category as string))
    errors.push(`${at}: category "${String(w.category)}" non valida`)
  if (w.difficulty !== undefined && ![1, 2, 3, 4, 5].includes(w.difficulty as number))
    errors.push(`${at}: difficulty deve essere da 1 a 5`)
})

const collectionIds = new Set<string>()
collections.forEach((c, i) => {
  const at = `raccolta #${i} (${String(c.name ?? '??')})`
  const id = c.id
  if (typeof id !== 'string' || !/^[a-z0-9-]+$/.test(id)) errors.push(`${at}: id mancante o non slug`)
  else if (collectionIds.has(id)) errors.push(`${at}: id duplicato "${id}"`)
  else collectionIds.add(id)

  if (typeof c.name !== 'string' || !c.name) errors.push(`${at}: name mancante`)
  if (typeof c.description !== 'string' || !c.description) errors.push(`${at}: description mancante`)

  if (!Array.isArray(c.wordIds) || c.wordIds.length < 10) {
    errors.push(`${at}: servono almeno 10 parole`)
    return
  }
  const inside = new Set<string>()
  for (const wordId of c.wordIds as string[]) {
    if (!seen.has(wordId)) errors.push(`${at}: la parola "${wordId}" non esiste`)
    if (inside.has(wordId)) errors.push(`${at}: la parola "${wordId}" compare due volte`)
    inside.add(wordId)
  }
})

if (errors.length) {
  console.error(`❌ ${errors.length} problemi:\n` + errors.map((e) => '  - ' + e).join('\n'))
  process.exit(1)
}
console.log(`✅ ${words.length} parole e ${collections.length} raccolte valide.`)
