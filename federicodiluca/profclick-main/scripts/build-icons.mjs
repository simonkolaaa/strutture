/*
 * Rigenera le icone da scripts/icon-source.svg.
 * Da lanciare a mano dopo aver cambiato il sorgente: `npm run icons:build`.
 *
 *   public/favicon.svg                  copia del sorgente, per le schede del browser
 *   public/icons/icon-192.png           192×192, angoli arrotondati trasparenti
 *   public/icons/icon-512.png           512×512, angoli arrotondati trasparenti
 *   public/icons/maskable-512.png       512×512, a tutto campo, disegno nell'area sicura
 *   public/icons/apple-touch-icon.png   180×180, a tutto campo: iOS arrotonda da sé
 *                                       e riempirebbe di nero gli angoli trasparenti
 *   docs/oauth/logo-120.png             120×120, logo della schermata di consenso Google
 */
import sharp from 'sharp'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const BACKGROUND = '#2f5b4f'
const VIEWBOX = 64

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(resolve(root, 'scripts/icon-source.svg'))
const out = (name) => resolve(root, 'public/icons', name)

// density alta: sharp rasterizza l'SVG a 72 dpi, e il viewBox verrebbe sgranato.
const render = (size) => sharp(src, { density: 72 * (size / VIEWBOX) * 2 }).resize(size, size)

/**
 * Il disegno a `scale` del lato, centrato su un quadrato pieno del colore di fondo. Sopra 1
 * si ingrandisce e si ritaglia il centro: sparisce il margine del riquadro arrotondato.
 */
async function fullBleed(size, scale) {
  const inner = Math.round(size * scale)
  const canvas = sharp({ create: { width: size, height: size, channels: 4, background: BACKGROUND } })
  if (inner <= size) {
    const offset = Math.round((size - inner) / 2)
    return canvas.composite([{ input: await render(inner).png().toBuffer(), top: offset, left: offset }])
  }
  const crop = Math.round((inner - size) / 2)
  const input = await render(inner).extract({ left: crop, top: crop, width: size, height: size }).png().toBuffer()
  return canvas.composite([{ input }])
}

mkdirSync(resolve(root, 'public/icons'), { recursive: true })
await render(192).png().toFile(out('icon-192.png'))
await render(512).png().toFile(out('icon-512.png'))
// Android ritaglia le icone maskable a cerchio, goccia o squircle: il disegno deve stare
// nel cerchio centrale che copre l'80% del lato.
await (await fullBleed(512, 0.82)).png().toFile(out('maskable-512.png'))
await (await fullBleed(180, 1.06)).png().toFile(out('apple-touch-icon.png'))
// Logo per la schermata di consenso OAuth di Google: quadrato 120×120, caricato a mano in
// Google Cloud Console. Non serve all'app, quindi sta in docs/.
mkdirSync(resolve(root, 'docs/oauth'), { recursive: true })
await (await fullBleed(120, 1.06)).png().toFile(resolve(root, 'docs/oauth/logo-120.png'))
writeFileSync(resolve(root, 'public/favicon.svg'), src)

console.log('icone aggiornate: favicon.svg, icon-192, icon-512, maskable-512, apple-touch-icon, docs/oauth/logo-120.png')
