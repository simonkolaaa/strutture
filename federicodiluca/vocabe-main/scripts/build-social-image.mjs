/*
 * Generates the Open Graph / Twitter share image from the same mark as the
 * app icons (scripts/icon-source.svg). Run manually after changing the mark
 * or the tagline: `npm run social:build`.
 *
 *   public/social-share.png   1200×630, used by og:image / twitter:image
 */
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const W = 1200
const H = 630

// V mark geometry copied from scripts/icon-source.svg (512 viewBox), scaled
// and translated into place below. Keep both in sync if the mark changes.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#1c1917" />
  <g transform="translate(96,197) scale(0.56)">
    <g fill="#fbbf24">
      <path d="M160 116h78L268 330H250Z" />
      <path d="M316 116h52L268 330H250Z" />
      <rect x="130" y="100" width="122" height="18" />
      <rect x="296" y="100" width="94" height="18" />
    </g>
    <rect x="196" y="360" width="120" height="14" rx="7" fill="#b45309" />
  </g>
  <text x="460" y="341" font-family="Georgia, 'Times New Roman', serif" font-size="104" fill="#faf7f2">Vocabe</text>
  <text x="462" y="404" font-family="Georgia, 'Times New Roman', serif" font-size="34" fill="#d6d3d1">una parola italiana al giorno</text>
</svg>
`.trim()

await sharp(Buffer.from(svg)).png().toFile(resolve(root, 'public/social-share.png'))

writeFileSync(resolve(root, 'public/social-share.svg'), svg)

console.log('social: public/social-share.png (1200×630) aggiornato')
