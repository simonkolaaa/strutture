import { describe, expect, it } from 'vitest'
import { normalize, defaultState, STATE_VERSION } from './store'

const v1Entry = (learnedOn: string) => ({ learnedOn, box: 1, dueOn: learnedOn, correct: 0, wrong: 0 })

describe('normalize', () => {
  it('falls back to a fresh state for junk input', () => {
    expect(normalize(null).learned).toEqual({})
    expect(normalize('nope').favorites).toEqual([])
    expect(normalize(42).onboarded).toBe(false)
  })

  it('fills in fields added after a save was written', () => {
    const old = { learned: {}, streak: { current: 3, longest: 3, lastActiveOn: '2026-03-10' } }
    const s = normalize(old)
    expect(s.streak.freezes).toBe(0)
    expect(s.favorites).toEqual([])
    expect(s.notes).toEqual({})
    expect(s.settings.theme).toBe('system')
    expect(s.streak.current).toBe(3) // existing values survive
  })

  it('stamps the current schema version', () => {
    expect(normalize({ version: 1, learned: {} }).version).toBe(STATE_VERSION)
  })

  it('gives a reader without one a seed, and keeps the one they have', () => {
    const fresh = normalize({ version: 2, learned: {} })
    expect(typeof fresh.seed).toBe('number')
    expect(normalize({ version: 2, learned: {}, seed: 12345 }).seed).toBe(12345)
  })

  it('clamps the level and drops a malformed daily assignment', () => {
    expect(normalize({ version: 2, learned: {}, level: 9 }).level).toBe(5)
    expect(normalize({ version: 2, learned: {}, level: -3 }).level).toBe(1)
    expect(normalize({ version: 2, learned: {} }).level).toBe(1)
    expect(normalize({ version: 2, learned: {}, daily: { date: '2026-09-07' } }).daily).toBeNull()
    const ok = { date: '2026-09-07', wordId: 'sagace', bonusId: null }
    expect(normalize({ version: 2, learned: {}, daily: ok }).daily).toEqual(ok)
  })
})

describe('migration 1 → 2', () => {
  it('rebuilds activeDays from the days words were learned', () => {
    const s = normalize({
      version: 1,
      learned: { a: v1Entry('2026-03-02'), b: v1Entry('2026-03-01') },
      streak: { current: 1, longest: 1, lastActiveOn: '2026-03-05' },
    })
    expect(s.activeDays).toEqual(['2026-03-01', '2026-03-02', '2026-03-05'])
  })

  it('keeps activeDays a v1 save already had', () => {
    expect(normalize({ version: 1, activeDays: ['2026-01-01'], learned: {} }).activeDays).toEqual([
      '2026-01-01',
    ])
  })

  it('does not show the intro to someone who already had progress', () => {
    expect(normalize({ version: 1, learned: { a: v1Entry('2026-03-01') } }).onboarded).toBe(true)
    expect(normalize({ version: 1, learned: {} }).onboarded).toBe(false)
  })

  it('respects an explicit onboarded flag', () => {
    const s = normalize({ version: 1, onboarded: false, learned: { a: v1Entry('2026-03-01') } })
    expect(s.onboarded).toBe(false)
  })

  it('leaves a current-version save alone', () => {
    // A brand new v2 user has no activity: nothing to backfill, no intro to skip.
    const s = normalize({ version: STATE_VERSION, learned: {}, activeDays: [], onboarded: false })
    expect(s.activeDays).toEqual([])
    expect(s.onboarded).toBe(false)
  })

  it('treats a save with no version at all as v1', () => {
    const s = normalize({ learned: { a: v1Entry('2026-03-01') } })
    expect(s.activeDays).toEqual(['2026-03-01'])
    expect(s.onboarded).toBe(true)
  })

  it('round-trips a full state', () => {
    const s = defaultState()
    s.favorites = ['effimero']
    s.notes = { effimero: 'bella parola' }
    expect(normalize(JSON.parse(JSON.stringify(s)))).toEqual(s)
  })
})
