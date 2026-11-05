/*
 * Post-build SEO pass. The app itself is a client-rendered SPA — great for users,
 * invisible to search engines. This generates real static HTML that Google can index:
 *
 *   dist/parole/index.html          — full glossary of every word
 *   dist/parole/<slug>/index.html   — one page per word (definition, examples, etymology…)
 *   dist/sitemap.xml                — every URL above
 *   dist/robots.txt
 *
 * Each word page is standalone (no app JS) with its own <title>, meta description,
 * canonical and JSON-LD. Run automatically after `vite build`.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const words = JSON.parse(readFileSync(resolve(root, 'src/data/words.json'), 'utf8'))

const BASE = '/'
const SITE = 'https://vocabe.federicodiluca.com/'
const TODAY = new Date().toISOString().slice(0, 10)

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const LEVEL_LABEL = { 1: 'quotidiana', 2: 'colta', 3: 'ricercata', 4: 'rara', 5: 'rarissima' }

const CATEGORY_LABEL = {
  comune: 'comune',
  letteraria: 'letteraria',
  scientifica: 'scientifica',
  antica: 'antica',
  regionale: 'regionale',
  straniera: 'di origine straniera',
}

const CSS = `
:root{color-scheme:light}
*{box-sizing:border-box}
body{margin:0;background:#faf7f2;color:#1c1917;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6}
.wrap{max-width:44rem;margin:0 auto;padding:2rem 1.25rem 4rem}
a{color:#b45309}
nav.crumbs{font-size:.85rem;color:#57534e;margin-bottom:1.5rem}
h1{font-family:Georgia,'Times New Roman',serif;font-size:2.4rem;margin:.2rem 0 .1rem}
.pos{font-style:italic;color:#57534e}
.def{font-size:1.15rem;margin:1.2rem 0}
h2{font-size:1rem;text-transform:uppercase;letter-spacing:.04em;color:#57534e;margin:2rem 0 .5rem}
ul.ex{margin:0;padding-left:1.1rem}
ul.ex li{font-family:Georgia,serif;font-style:italic;color:#57534e;margin:.3rem 0}
.tags{margin-top:1.5rem;font-size:.85rem;color:#57534e}
.tags span{border:1px solid #e7e2d9;border-radius:999px;padding:.15rem .6rem;margin-right:.4rem;white-space:nowrap}
.cta{display:inline-block;margin-top:2rem;background:#b45309;color:#fff;text-decoration:none;padding:.7rem 1.3rem;border-radius:1rem;font-weight:600}
.pager{display:flex;justify-content:space-between;margin-top:2.5rem;font-size:.9rem;gap:1rem}
.glossary{columns:2;column-gap:2rem}
.glossary a{display:block;padding:.2rem 0}
.letter{break-inside:avoid;margin-bottom:1rem}
.letter h2{margin:.5rem 0 .2rem}
footer{margin-top:3rem;padding-top:1rem;border-top:1px solid #e7e2d9;font-size:.8rem;color:#57534e;text-align:center}
@media(max-width:600px){.glossary{columns:1}}
`.trim()

function shell({ title, description, canonical, jsonLd, body }) {
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="article">
<meta property="og:locale" content="it_IT">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="Vocabe">
<meta property="og:image" content="${SITE}social-share.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE}social-share.png">
<link rel="icon" type="image/svg+xml" href="${BASE}favicon.svg">
<style>${CSS}</style>
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body><div class="wrap">${body}
<footer>Un progetto di <a href="https://federicodiluca.com/" rel="author">Federico Di Luca</a> · <a href="${BASE}privacy/">Privacy</a></footer></div></body>
</html>
`
}

function wordPage(word, prev, next) {
  const url = `${SITE}parole/${word.id}/`
  const desc = `${word.term}: ${word.meaning} Esempi d'uso, sinonimi${
    word.etymology ? ', etimologia' : ''
  } e ripasso su Vocabe.`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: word.term,
    description: word.meaning,
    inDefinedTermSet: `${SITE}parole/`,
    url,
  }

  const body = `
<nav class="crumbs"><a href="${BASE}">Vocabe</a> › <a href="${BASE}parole/">Glossario</a> › ${esc(word.term)}</nav>
<h1>${esc(word.term)}</h1>
${word.pos ? `<p class="pos">${esc(word.pos)}</p>` : ''}
<p class="def">${esc(word.meaning)}</p>
${word.usage ? `<p class="pos">Si usa: ${esc(word.usage)}</p>` : ''}
${
  word.examples?.length
    ? `<h2>Esempi d'uso</h2><ul class="ex">${word.examples.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`
    : ''
}
${word.synonyms?.length ? `<h2>Sinonimi</h2><p>${word.synonyms.map(esc).join(', ')}</p>` : ''}
${word.etymology ? `<h2>Etimologia</h2><p>${esc(word.etymology)}</p>` : ''}
${word.curiosity ? `<h2>Lo sapevi?</h2><p>${esc(word.curiosity)}</p>` : ''}
<p class="tags">
${word.category ? `<span>categoria: ${esc(CATEGORY_LABEL[word.category] ?? word.category)}</span>` : ''}
${word.difficulty ? `<span>livello ${word.difficulty}/5 · ${LEVEL_LABEL[word.difficulty]}</span>` : ''}
</p>
<a class="cta" href="${BASE}">Impara una parola al giorno con Vocabe →</a>
<div class="pager">
<span>${prev ? `<a href="${BASE}parole/${prev.id}/">← ${esc(prev.term)}</a>` : ''}</span>
<span>${next ? `<a href="${BASE}parole/${next.id}/">${esc(next.term)} →</a>` : ''}</span>
</div>
`.trim()

  return shell({
    title: `${word.term} — significato, esempi ed etimologia | Vocabe`,
    description: desc,
    canonical: url,
    jsonLd,
    body,
  })
}

function glossaryPage(sorted) {
  const byLetter = {}
  for (const w of sorted) {
    const L = w.term[0].toUpperCase()
    ;(byLetter[L] ??= []).push(w)
  }
  const sections = Object.keys(byLetter)
    .sort()
    .map(
      (L) => `<div class="letter"><h2>${L}</h2>${byLetter[L]
        .map((w) => `<a href="${BASE}parole/${w.id}/">${esc(w.term)}</a>`)
        .join('')}</div>`,
    )
    .join('')

  const body = `
<nav class="crumbs"><a href="${BASE}">Vocabe</a> › Glossario</nav>
<h1>Glossario di Vocabe</h1>
<p class="def">Tutte le ${sorted.length} parole italiane di Vocabe, con significato, esempi d'uso ed
etimologia. Una parola nuova ogni giorno nell'<a href="${BASE}">app</a>.</p>
<div class="glossary">${sections}</div>
<a class="cta" href="${BASE}">Apri Vocabe →</a>
`.trim()

  return shell({
    title: `Glossario — ${sorted.length} parole italiane con significato ed esempi | Vocabe`,
    description: `Il glossario completo di Vocabe: ${sorted.length} parole italiane ricercate con significato, esempi d'uso, sinonimi ed etimologia. Gratis.`,
    canonical: `${SITE}parole/`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'DefinedTermSet',
      name: 'Glossario di Vocabe',
      url: `${SITE}parole/`,
      hasDefinedTerm: sorted.slice(0, 50).map((w) => ({
        '@type': 'DefinedTerm',
        name: w.term,
        url: `${SITE}parole/${w.id}/`,
      })),
    },
    body,
  })
}

// --- write files ---
const sorted = [...words].sort((a, b) => a.term.localeCompare(b.term, 'it'))

mkdirSync(resolve(dist, 'parole'), { recursive: true })
writeFileSync(resolve(dist, 'parole/index.html'), glossaryPage(sorted))

sorted.forEach((w, i) => {
  const dir = resolve(dist, 'parole', w.id)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, 'index.html'), wordPage(w, sorted[i - 1], sorted[i + 1]))
})

const urls = [
  { loc: SITE, priority: '1.0' },
  { loc: `${SITE}parole/`, priority: '0.8' },
  { loc: `${SITE}privacy/`, priority: '0.2' },
  ...sorted.map((w) => ({ loc: `${SITE}parole/${w.id}/`, priority: '0.6' })),
]
writeFileSync(
  resolve(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (u) =>
        `  <url><loc>${u.loc}</loc><lastmod>${TODAY}</lastmod><priority>${u.priority}</priority></url>`,
    )
    .join('\n')}\n</urlset>\n`,
)

writeFileSync(
  resolve(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`,
)

console.log(`SEO: ${sorted.length} pagine parola + glossario + sitemap generati in dist/`)
