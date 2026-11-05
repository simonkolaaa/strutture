import { describe, expect, it } from 'vitest'
import { encodeChallenge, decodeChallenge, type Challenge } from './challenge'

const sample: Challenge = { n: 'Federico', s: 12, w: 45, d: 60, on: '2026-03-10' }

describe('challenge token', () => {
  it('survives a round trip', () => {
    expect(decodeChallenge(encodeChallenge(sample))).toEqual(sample)
  })

  it('handles accented and non-ascii names', () => {
    const c = { ...sample, n: 'Niccolò 🎓' }
    expect(decodeChallenge(encodeChallenge(c))).toEqual(c)
  })

  it('produces a URL-safe token', () => {
    expect(encodeChallenge(sample)).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('rejects garbage instead of throwing', () => {
    expect(decodeChallenge('non-un-token')).toBeNull()
    expect(decodeChallenge('')).toBeNull()
    expect(decodeChallenge(encodeChallenge(sample).slice(0, 5))).toBeNull()
  })

  it('rejects a token missing required fields', () => {
    const partial = btoa(JSON.stringify({ n: 'x' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(decodeChallenge(partial)).toBeNull()
  })

  it('defaults a missing name to empty rather than failing', () => {
    const noName = encodeChallenge({ ...sample, n: '' })
    expect(decodeChallenge(noName)?.n).toBe('')
  })
})
