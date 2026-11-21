import { describe, expect, it } from 'vitest'
import type { ProgressRecord } from '../../types'
import { applyResult, emptyProgress, isDue, isLeech, isMastered, priority, reviewReasons } from './srs'

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
  it('brings mastered cards back once their interval has passed', () => {
    let p = emptyProgress('c', 'i')
    p = applyResult(p, true, { now })
    p = applyResult(p, true, { now }) // box 2 → due in 3 days
    expect(isMastered(p)).toBe(true)
    expect(reviewReasons(p, new Date(now.getTime() + 2 * 86_400_000))).toEqual([])
    expect(reviewReasons(p, new Date(now.getTime() + 3 * 86_400_000))).toEqual(['due'])
  })
  it('refines remembered cards by confidence grade', () => {
    const base: ProgressRecord = { ...emptyProgress('c', 'i'), level: 2, status: 'known' }
    const days = (p: ProgressRecord) => (new Date(p.nextReview!).getTime() - now.getTime()) / 86_400_000
    const hard = applyResult(base, true, { now, grade: 'hard' })
    expect([hard.level, days(hard)]).toEqual([2, 1]) // same box, half of 3 days rounded down
    const good = applyResult(base, true, { now, grade: 'good' })
    expect([good.level, days(good)]).toEqual([3, 7])
    const easy = applyResult(base, true, { now, grade: 'easy' })
    expect([easy.level, days(easy)]).toEqual([4, 14])
    const again = applyResult(base, true, { now, grade: 'again' })
    expect([again.level, again.status, again.incorrect]).toEqual([1, 'unknown', 1])
    expect(applyResult(emptyProgress('c', 'i'), true, { now, grade: 'hard' }).level).toBe(1)
    expect(applyResult({ ...base, level: 5 }, true, { now, grade: 'easy' }).level).toBe(5)
  })
  it('clears the review flag only when asked', () => {
    const p = { ...emptyProgress('c', 'i'), review: true }
    expect(applyResult(p, true, { now }).review).toBe(true)
    expect(applyResult(p, true, { now, clearReview: true }).review).toBe(false)
  })
  it('flags a leech: wrong 4+ times and not mostly right any more', () => {
    let p = emptyProgress('c', 'i')
    for (let i = 0; i < 3; i++) p = applyResult(p, false, { now })
    expect(isLeech(p)).toBe(false) // only 3 misses
    p = applyResult(p, false, { now })
    expect(isLeech(p)).toBe(true)
    for (let i = 0; i < 5; i++) p = applyResult(p, true, { now }) // learned it after all: 4 wrong, 5 right
    expect(isLeech(p)).toBe(false)
    expect(isLeech(undefined)).toBe(false)
  })
})
