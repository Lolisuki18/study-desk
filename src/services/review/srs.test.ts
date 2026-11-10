import { describe, expect, it } from 'vitest'
import type { ProgressRecord } from '../../types'
import { applyResult, emptyProgress, isDue, isMastered, priority, reviewReasons } from './srs'

const now = new Date('2026-01-01T00:00:00Z')

describe('Leitner SRS', () => {
  it('moves up a box and schedules next review on correct answers', () => {
    let p = emptyProgress('c', 'i')
    p = applyResult(p, true, { now })
    expect(p.level).toBe(1)
    expect(p.status).toBe('known')
    expect(new Date(p.nextReview!).getTime() - now.getTime()).toBe(86_400_000)
    p = applyResult(p, true, { now })
    expect(p.level).toBe(2)
  })
  it('drops to box 1 and is due immediately on a wrong answer', () => {
    let p: ProgressRecord = { ...emptyProgress('c', 'i'), level: 4, status: 'known' }
    p = applyResult(p, false, { now })
    expect(p.level).toBe(1)
    expect(p.incorrect).toBe(1)
    expect(isDue(p, now)).toBe(true)
    expect(reviewReasons(p, now)).toEqual(expect.arrayContaining(['unknown', 'incorrect', 'due']))
  })
  it('counts as mastered after two correct rounds in a row', () => {
    let p = emptyProgress('c', 'i')
    p = applyResult(p, true, { now })
    expect(isMastered(p)).toBe(false)
    p = applyResult(p, true, { now })
    expect(isMastered(p)).toBe(true)
    p = applyResult(p, false, { now })
    expect(isMastered(p)).toBe(false)
  })
  it('caps at box 5', () => {
    let p = emptyProgress('c', 'i')
    for (let i = 0; i < 8; i++) p = applyResult(p, true, { now })
    expect(p.level).toBe(5)
    expect(isMastered(p)).toBe(true)
  })
  it('prioritises difficult items', () => {
    const hard = applyResult(applyResult(emptyProgress('c', 'a'), false, { now }), false, { now })
    const easy = applyResult(emptyProgress('c', 'b'), true, { now })
    expect(priority(hard, now)).toBeGreaterThan(priority(easy, now))
  })
  it('clears the review flag only when asked', () => {
    const p = { ...emptyProgress('c', 'i'), review: true }
    expect(applyResult(p, true, { now }).review).toBe(true)
    expect(applyResult(p, true, { now, clearReview: true }).review).toBe(false)
  })
})
