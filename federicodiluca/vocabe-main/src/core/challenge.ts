import type { ProgressState } from '@/core/types'
import { displayStreak } from '@/core/streak/streak'
import { siteUrl } from '@/core/site'

export type Challenge = {
  /** who sent it (may be empty) */
  n: string
  /** current streak */
  s: number
  /** words learned */
  w: number
  /** total active days */
  d: number
  /** ISO date the challenge was created */
  on: string
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function challengeFromState(state: ProgressState): Challenge {
  return {
    n: state.settings.name.trim().slice(0, 24),
    s: displayStreak(state.streak),
    w: Object.keys(state.learned).length,
    d: state.activeDays.length,
    on: new Date().toISOString().slice(0, 10),
  }
}

export function encodeChallenge(c: Challenge): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(c)))
}

export function decodeChallenge(token: string): Challenge | null {
  try {
    const c = JSON.parse(new TextDecoder().decode(fromBase64Url(token))) as Partial<Challenge>
    if (
      typeof c.s !== 'number' ||
      typeof c.w !== 'number' ||
      typeof c.d !== 'number' ||
      typeof c.on !== 'string'
    ) {
      return null
    }
    return { n: typeof c.n === 'string' ? c.n : '', s: c.s, w: c.w, d: c.d, on: c.on }
  } catch {
    return null
  }
}

export function challengeUrl(c: Challenge): string {
  return `${siteUrl()}?sfida=${encodeChallenge(c)}`
}

export function challengeText(c: Challenge): string {
  const who = c.n ? `${c.n} ti sfida su Vocabe!` : 'Ti sfido su Vocabe!'
  return `${who}\nSerie: ${c.s} giorni · ${c.w} parole imparate.\n${challengeUrl(c)}`
}
