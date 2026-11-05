/*
 * Rigenera l'immagine di anteprima per la condivisione del link (Open Graph, 1200×630):
 * `npm run social:build`. Il PNG è nel repo, quindi non serve rifarla a ogni build.
 *
 * L'icona è quella di scripts/icon-source.svg, ingrandita; il testo usa i font di sistema,
 * che sharp (librsvg) sa disegnare.
 */
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const BOARD = '#24463d'
const CHALK = '#eef5f1'
const RED = '#e5483b'
const BLUE = '#8fb0ff'
const SOFT = '#b9cfc6'

// Il contenuto dell'icona (griglia 64) scalato ×4.5 (288 px) e posizionato a sinistra.
const iconBody = readFileSync(resolve(root, 'scripts/icon-source.svg'), 'utf8')
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  .replace(/<!--[\s\S]*?-->/g, '')
const icon = `<g transform="translate(96 171) scale(4.5)">${iconBody}</g>`

const font = `'Segoe UI', 'Helvetica Neue', Arial, sans-serif`

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BOARD}"/>
  <rect y="598" width="600" height="32" fill="${BLUE}"/>
  <rect x="600" y="598" width="600" height="32" fill="${RED}"/>
  ${icon}
  <g font-family="${font}">
    <text x="456" y="262" font-size="96" font-weight="700" fill="#ffffff">ProfClick</text>
    <text x="456" y="330" font-size="38" font-weight="600" fill="${CHALK}">Il piano di lavoro del docente,</text>
    <text x="456" y="378" font-size="38" font-weight="600" fill="${CHALK}">lezione per lezione</text>
    <text x="456" y="446" font-size="26" fill="${SOFT}">Programma, verifiche e voti per quadrimestre.</text>
    <text x="456" y="484" font-size="26" fill="${SOFT}">Gratis, senza server: i dati restano sul tuo Drive.</text>
    <text x="1104" y="560" font-size="24" fill="${SOFT}" text-anchor="end">profclick.federicodiluca.com</text>
  </g>
</svg>`

await sharp(Buffer.from(svg)).png().toFile(resolve(root, 'public/social-share.png'))
console.log('public/social-share.png aggiornata')
