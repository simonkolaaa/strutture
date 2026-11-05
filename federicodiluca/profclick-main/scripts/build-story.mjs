/*
 * Rigenera l'immagine da condividere nelle storie di Instagram (1080×1920):
 * `npm run story:build`. Il PNG è nel repo, quindi non serve rifarla a ogni build.
 *
 * Mostra l'app con una settimana finta, presa dalle classi di esempio (src/core/sample.ts).
 * Il link è scritto in grande perché Instagram, di una condivisione, prende solo l'immagine.
 * Contenuti importanti tra y 250 e y 1670: sopra e sotto le storie coprono con la barra e
 * il campo di risposta.
 */
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const BOARD = '#24463d'
const BOARD_LIGHT = '#2f5b4f'
const CHALK = '#eef5f1'
const RED = '#e5483b'
const BLUE = '#3f6fd8'
const SOFT = '#b9cfc6'
const PAPER = '#fbfaf7'
const INK = '#1f2d29'
const MUTED = '#66756f'
const GREEN = '#2f8a5b'

// Il contenuto dell'icona (griglia 64) scalato ×3.5: 224 px.
const iconBody = readFileSync(resolve(root, 'scripts/icon-source.svg'), 'utf8')
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  .replace(/<!--[\s\S]*?-->/g, '')
const icon = `<g transform="translate(428 240) scale(3.5)">${iconBody}</g>`

const font = `'Segoe UI', 'Helvetica Neue', Arial, sans-serif`

// La settimana finta: una riga per lezione, con il colore della classe a sinistra.
const lessons = [
  { day: 'Lun', cls: '3A', color: BLUE, what: 'Selezione e iterazione', tag: null, done: true },
  { day: 'Mar', cls: '4B', color: RED, what: 'Basi di dati: il modello E/R', tag: null, done: true },
  { day: 'Mer', cls: '3A', color: BLUE, what: 'Selezione e iterazione', tag: 'Verifica scritta', done: false },
  { day: 'Gio', cls: '4B', color: RED, what: 'Normalizzazione', tag: 'Slide da preparare', done: false },
  { day: 'Ven', cls: '3A', color: BLUE, what: 'Array · laboratorio con l’ITP', tag: 'Voto pratico', done: false },
]

const PX = 140
const PW = 1080 - PX * 2
const rows = lessons
  .map((l, i) => {
    const y = 990 + i * 116
    const tag = l.tag
      ? `<rect x="190" y="58" width="${Math.round(l.tag.length * 11.5) + 32}" height="38" rx="19" fill="${l.tag.startsWith('Verifica') || l.tag.startsWith('Voto') ? '#fde8e6' : '#e6eefc'}"/>
         <text x="206" y="85" font-size="22" font-weight="600" fill="${l.tag.startsWith('Verifica') || l.tag.startsWith('Voto') ? RED : BLUE}">${l.tag}</text>`
      : ''
    const check = l.done
      ? `<circle cx="${PW - 124}" cy="50" r="22" fill="${GREEN}"/><path d="M${PW - 135} 50l8 8 15-16" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<circle cx="${PW - 124}" cy="50" r="21" fill="none" stroke="#c9d3cf" stroke-width="3"/>`
    return `
    <g transform="translate(${PX + 36} ${y})">
      <rect width="${PW - 72}" height="100" rx="18" fill="#ffffff"/>
      <rect width="10" height="100" rx="5" fill="${l.color}"/>
      <text x="40" y="44" font-size="24" font-weight="600" fill="${MUTED}">${l.day}</text>
      <text x="40" y="80" font-size="30" font-weight="700" fill="${l.color}">${l.cls}</text>
      <text x="120" y="${l.tag ? 42 : 60}" font-size="29" font-weight="600" fill="${INK}">${l.what}</text>
      ${tag.replace(/x="190"/, 'x="120"').replace(/x="206"/, 'x="136"')}
      ${check}
    </g>`
  })
  .join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BOARD_LIGHT}"/>
      <stop offset="1" stop-color="${BOARD}"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="24" stdDeviation="30" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect width="1080" height="1920" fill="url(#bg)"/>

  <g font-family="${font}">
    ${icon}
    <text x="540" y="580" font-size="112" font-weight="700" fill="#ffffff" text-anchor="middle">ProfClick</text>
    <text x="540" y="655" font-size="44" font-weight="600" fill="${CHALK}" text-anchor="middle">Il piano di lavoro del docente,</text>
    <text x="540" y="712" font-size="44" font-weight="600" fill="${CHALK}" text-anchor="middle">lezione per lezione</text>

    <g filter="url(#shadow)">
      <rect x="${PX}" y="790" width="${PW}" height="790" rx="44" fill="${PAPER}"/>
    </g>
    <text x="${PX + 48}" y="864" font-size="30" fill="${MUTED}">Questa settimana</text>
    <text x="${PX + 48}" y="936" font-size="56" font-weight="700" fill="${INK}">5 lezioni, 2 voti</text>
    ${rows}

    <text x="540" y="1638" font-size="34" fill="${SOFT}" text-anchor="middle">Gratis, dal browser. Nessun dato degli studenti.</text>
    <text x="540" y="1702" font-size="46" font-weight="700" fill="#ffffff" text-anchor="middle">profclick.federicodiluca.com</text>
  </g>
</svg>`

await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toFile(resolve(root, 'public/story.png'))
console.log('public/story.png aggiornata')
