import { describe, expect, it } from 'vitest'
import { computeSpellingDiff } from './diff'

describe('computeSpellingDiff', () => {
  it('returns isExact true for identical words', () => {
    const res = computeSpellingDiff('accommodation', 'accommodation')
    expect(res.isExact).toBe(true)
    expect(res.similarity).toBe(1.0)
    expect(res.parts.every((p) => p.status === 'correct')).toBe(true)
  })

  it('detects missing letter in common spelling trap', () => {
    const res = computeSpellingDiff('accomodation', 'accommodation')
    expect(res.isExact).toBe(false)
    expect(res.parts.some((p) => p.status === 'missing' && p.char === 'm')).toBe(true)
  })

  it('detects extra letter', () => {
    const res = computeSpellingDiff('pronounciation', 'pronunciation')
    expect(res.isExact).toBe(false)
    expect(res.parts.some((p) => p.status === 'extra' || p.status === 'wrong')).toBe(true)
  })
})
