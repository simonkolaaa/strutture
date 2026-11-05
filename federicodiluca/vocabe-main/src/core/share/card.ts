import type { ProgressState, Word } from '@/core/types'
import type { Badge } from '@/core/badges/badges'
import { displayStreak } from '@/core/streak/streak'
import { WORDS } from '@/core/content/words'
import { SITE_LABEL } from '@/core/site'
import { shareKicker } from './share'

/** Share image size — Instagram feed portrait (4:5). */
const W = 1080
const H = 1350

const SERIF = "'Georgia', 'Times New Roman', serif"
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"

const COLORS = {
  paper: '#faf7f2',
  raised: '#ffffff',
  ink: '#1c1917',
  soft: '#57534e',
  line: '#e7e2d9',
  brand: '#b45309',
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/)
  const lines: string[] = []
  let line = ''
  let i = 0
  for (; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i]
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line)
      line = words[i]
      if (lines.length === maxLines - 1) {
        i++
        break
      }
    } else {
      line = test
    }
  }
  // whatever is left goes on the last line
  const tail = words.slice(i).join(' ')
  line = line && tail ? `${line} ${tail}` : line || tail
  const truncated = ctx.measureText(line).width > maxWidth
  if (truncated) {
    while (line && ctx.measureText(`${line}…`).width > maxWidth) {
      line = line.replace(/\s*\S*$/, '')
    }
    line = line.replace(/[.,;:]?$/, '') + '…'
  }
  lines.push(line)
  return lines
}

/** Fit a single line to a width by stepping the font size down. */
function fitLine(ctx: CanvasRenderingContext2D, text: string, max: number, start: number, min: number) {
  let size = start
  do {
    ctx.font = `700 ${size}px ${SERIF}`
    if (ctx.measureText(text).width <= max) break
    size -= 4
  } while (size > min)
  return size
}

const PAD = 96

/** Paper, frame, the mark + wordmark and a kicker on the right. Shared by every card. */
async function openCard(kicker: string): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> {
  if ('fonts' in document) {
    try {
      await (document as Document & { fonts: FontFaceSet }).fonts.ready
    } catch {
      /* fine, system fonts */
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const pad = PAD

  ctx.fillStyle = COLORS.paper
  ctx.fillRect(0, 0, W, H)

  // frame
  ctx.strokeStyle = COLORS.line
  ctx.lineWidth = 2
  roundRect(ctx, 44, 44, W - 88, H - 88, 36)
  ctx.stroke()

  // header
  ctx.textBaseline = 'alphabetic'
  // x is nudged so the glyph's own left edge lands on the margin, and the size
  // is chosen so its foot sits on the wordmark's baseline.
  drawMark(ctx, pad - 18, 86, 72)
  ctx.fillStyle = COLORS.brand
  ctx.font = `700 30px ${SANS}`
  ctx.save()
  ctx.translate(pad + 52, 132)
  drawTracked(ctx, 'VOCABE', 6)
  ctx.restore()

  ctx.fillStyle = COLORS.soft
  ctx.font = `500 28px ${SANS}`
  ctx.textAlign = 'right'
  ctx.fillText(kicker, W - pad, 132)
  ctx.textAlign = 'left'

  return { canvas, ctx }
}

/** Site line bottom-left and a stat bottom-right, then the PNG. */
function closeCard(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, tag: string): Promise<Blob> {
  const pad = PAD
  ctx.textAlign = 'left'
  ctx.fillStyle = COLORS.ink
  ctx.font = `700 32px ${SANS}`
  ctx.fillText('Vocabe', pad, H - 116)
  ctx.fillStyle = COLORS.soft
  ctx.font = `500 24px ${SANS}`
  ctx.fillText(SITE_LABEL, pad, H - 82)

  ctx.fillStyle = COLORS.soft
  ctx.font = `500 28px ${SANS}`
  ctx.textAlign = 'right'
  ctx.fillText(tag, W - pad, H - 100)
  ctx.textAlign = 'left'

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  )
}

/** The reader's one-line stat for the footer: the streak if alive, else the tally. */
function statTag(state: ProgressState): string {
  const streak = displayStreak(state.streak)
  const learned = Object.keys(state.learned).length
  return streak > 0 ? `serie di ${streak} giorni` : `${learned} parole imparate`
}

/**
 * Same idea as statTag, but for the invite card: "0 parole imparate" would
 * undersell the app to a stranger, so an empty state falls back to the
 * dataset size — a real number that still makes the case.
 */
function inviteTag(state: ProgressState): string {
  const streak = displayStreak(state.streak)
  const learned = Object.keys(state.learned).length
  if (streak > 0) return `serie di ${streak} giorni`
  if (learned > 0) return `${learned} parole imparate`
  return `${WORDS.length} parole da scoprire`
}

export async function renderShareCard(
  word: Word,
  state: ProgressState,
  { daily = false }: { daily?: boolean } = {},
): Promise<Blob> {
  const { canvas, ctx } = await openCard(shareKicker(word, daily))
  const pad = PAD

  // term
  let y = 360
  const termSize = fitLine(ctx, word.term, W - pad * 2, 116, 60)
  ctx.fillStyle = COLORS.ink
  ctx.font = `700 ${termSize}px ${SERIF}`
  ctx.fillText(word.term, pad, y)

  if (word.pos) {
    y += 56
    ctx.fillStyle = COLORS.soft
    ctx.font = `italic 36px ${SERIF}`
    ctx.fillText(word.pos, pad, y)
  }

  // brand rule
  y += 52
  ctx.strokeStyle = COLORS.brand
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(pad, y)
  ctx.lineTo(pad + 96, y)
  ctx.stroke()

  // meaning
  y += 76
  ctx.fillStyle = COLORS.ink
  ctx.font = `400 44px ${SANS}`
  for (const ln of wrap(ctx, word.meaning, W - pad * 2, 4)) {
    ctx.fillText(ln, pad, y)
    y += 62
  }

  // example
  if (word.examples[0]) {
    y += 26
    ctx.strokeStyle = COLORS.line
    ctx.lineWidth = 4
    const exTop = y - 40
    ctx.font = `italic 38px ${SERIF}`
    ctx.fillStyle = COLORS.soft
    const exLines = wrap(ctx, word.examples[0], W - pad * 2 - 40, 3)
    exLines.forEach((ln, i) => {
      ctx.fillText(ln, pad + 40, y + i * 54)
    })
    ctx.beginPath()
    ctx.moveTo(pad, exTop)
    ctx.lineTo(pad, y + (exLines.length - 1) * 54 + 12)
    ctx.stroke()
  }

  return closeCard(canvas, ctx, statTag(state))
}

/**
 * A milestone card: the badge's figure very large in the middle, its name and
 * hint beneath. Same paper and chrome as the word card, so they sit together in
 * a feed.
 */
export async function renderMilestoneCard(badge: Badge, state: ProgressState): Promise<Blob> {
  const { canvas, ctx } = await openCard('traguardo raggiunto')
  const pad = PAD
  const figure = badge.figure ?? { value: '✓', label: badge.name }

  ctx.textAlign = 'center'
  ctx.fillStyle = COLORS.brand
  const size = fitLine(ctx, figure.value, W - pad * 2, 260, 120)
  ctx.font = `700 ${size}px ${SERIF}`
  ctx.fillText(figure.value, W / 2, 600)

  ctx.fillStyle = COLORS.ink
  ctx.font = `400 48px ${SANS}`
  ctx.fillText(figure.label, W / 2, 720)

  // rule
  ctx.strokeStyle = COLORS.brand
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(W / 2 - 48, 790)
  ctx.lineTo(W / 2 + 48, 790)
  ctx.stroke()

  // The badge name alone: its hint would only restate the figure.
  ctx.fillStyle = COLORS.ink
  ctx.font = `700 60px ${SERIF}`
  ctx.fillText(badge.name, W / 2, 890)

  return closeCard(canvas, ctx, statTag(state))
}

/**
 * The invite card: no word, no personal figure — just the mark, the pitch and
 * the link large enough to read on a phone screenshot. Meant for a first post
 * or story aimed at people who have never opened the app.
 */
export async function renderInviteCard(state: ProgressState): Promise<Blob> {
  const { canvas, ctx } = await openCard('web app gratuita')

  // mark, large and centered — the same glyph as the header, blown up
  ctx.save()
  ctx.translate(W / 2 - 90, 260)
  drawMark(ctx, 0, 0, 180)
  ctx.restore()

  ctx.textAlign = 'center'
  ctx.fillStyle = COLORS.ink
  ctx.font = `700 68px ${SERIF}`
  const headline = wrap(ctx, 'Una parola italiana al giorno', W - PAD * 2, 2)
  const headlineLineHeight = 78
  // Anchor the block so a one-line headline and a two-line headline both end
  // at the same baseline, keeping the pitch below it at a fixed position.
  let y = 640 - (headline.length - 1) * headlineLineHeight
  for (const ln of headline) {
    ctx.fillText(ln, W / 2, y)
    y += headlineLineHeight
  }

  y += 40
  ctx.fillStyle = COLORS.soft
  ctx.font = `400 38px ${SANS}`
  const pitch = wrap(ctx, "È online: si apre dal browser e si installa come un'app, gratis.", W - PAD * 2 - 40, 3)
  for (const ln of pitch) {
    ctx.fillText(ln, W / 2, y)
    y += 52
  }

  // the link is the call to action here, so it gets its own prominent line
  ctx.strokeStyle = COLORS.brand
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(W / 2 - 48, y + 24)
  ctx.lineTo(W / 2 + 48, y + 24)
  ctx.stroke()

  ctx.fillStyle = COLORS.brand
  ctx.font = `700 46px ${SANS}`
  ctx.fillText(SITE_LABEL, W / 2, y + 96)
  ctx.textAlign = 'left'

  return closeCard(canvas, ctx, inviteTag(state))
}

/**
 * Vocabe's mark, same geometry as scripts/icon-source.svg and src/ui/Logo.tsx,
 * minus the underline bar — here the wordmark sits where the bar would be.
 * `size` is the height of the 512-unit design grid; (x, y) is its top-left.
 */
function drawMark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const u = size / 512
  const p = (a: number, b: number) => [x + a * u, y + b * u] as const

  ctx.save()
  ctx.fillStyle = COLORS.brand
  ctx.beginPath()
  // left arm
  ctx.moveTo(...p(160, 116))
  ctx.lineTo(...p(238, 116))
  ctx.lineTo(...p(268, 330))
  ctx.lineTo(...p(250, 330))
  ctx.closePath()
  // right arm
  ctx.moveTo(...p(316, 116))
  ctx.lineTo(...p(368, 116))
  ctx.lineTo(...p(268, 330))
  ctx.lineTo(...p(250, 330))
  ctx.closePath()
  ctx.fill()
  // slab serifs
  ctx.fillRect(...p(130, 100), 122 * u, 18 * u)
  ctx.fillRect(...p(296, 100), 94 * u, 18 * u)
  ctx.restore()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawTracked(ctx: CanvasRenderingContext2D, text: string, spacing: number) {
  let x = 0
  for (const ch of text) {
    ctx.fillText(ch, x, 0)
    x += ctx.measureText(ch).width + spacing
  }
}
