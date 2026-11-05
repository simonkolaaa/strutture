/*
 * Regenerates the PWA icons from scripts/icon-source.svg.
 * Run manually after changing the source: `npm run icons:build`.
 *
 *   public/icons/icon-192.png       192×192, edge to edge
 *   public/icons/icon-512.png       512×512, edge to edge
 *   public/icons/maskable-512.png   512×512, glyph kept inside the ~80% safe area
 *   public/favicon.svg              copy of the source
 */
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const srcPath = resolve(root, 'scripts/icon-source.svg')
const src = readFileSync(srcPath)
const out = (name) => resolve(root, 'public/icons', name)

await sharp(src).resize(192, 192).png().toFile(out('icon-192.png'))
await sharp(src).resize(512, 512).png().toFile(out('icon-512.png'))

// Maskable: shrink the artwork to the safe zone and pad with the background colour.
const inner = Math.round(512 * 0.78)
const pad = Math.round((512 - inner) / 2)
await sharp({
  create: { width: 512, height: 512, channels: 4, background: '#1c1917' },
})
  .composite([{ input: await sharp(src).resize(inner, inner).png().toBuffer(), top: pad, left: pad }])
  .png()
  .toFile(out('maskable-512.png'))

writeFileSync(resolve(root, 'public/favicon.svg'), src)

console.log('icons: icon-192, icon-512, maskable-512, favicon.svg aggiornati')
