import { describe, expect, it } from 'vitest'
import type { ActivityRecord, ProgressRecord } from '../types'
import { emptyProgress } from './review/srs'
import { accuracyByCollection, dailyActivity, dueForecast, streaks } from './stats'
import { fold, matcher } from '../utils/search'

const today = new Date(2026, 0, 10, 15)
const act = (day: number, itemId: string, result: 'correct' | 'incorrect' = 'correct', collectionId = 'c'): ActivityRecord => ({
  ts: new Date(2026, 0, day, 9).toISOString(),
  collectionId,
  itemId,
  kind: 'quiz',
  result,
})

describe('study statistics', () => {
  it('groups activity by day and counts distinct items', () => {
    const d = dailyActivity([act(10, 'a'), act(10, 'a', 'incorrect'), act(10, 'b'), act(9, 'a')])
    expect(d.get('2026-01-10')).toMatchObject({ answers: 3, correct: 2 })
    expect(d.get('2026-01-10')!.items.size).toBe(2)
    expect(d.get('2026-01-09')!.answers).toBe(1)
  })
  it('counts current and longest streaks', () => {
    expect(streaks([], today)).toEqual({ current: 0, longest: 0 })
    expect(streaks(['2026-01-10', '2026-01-09', '2026-01-08'], today)).toEqual({ current: 3, longest: 3 })
    // not studied yet today: the streak up to yesterday is still alive
    expect(streaks(['2026-01-09', '2026-01-08'], today).current).toBe(2)
    // a missed day breaks it
    expect(streaks(['2026-01-08', '2026-01-07'], today).current).toBe(0)
    expect(streaks(['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02', '2026-01-10'], today)).toEqual({ current: 1, longest: 4 })
  })
  it('forecasts due cards, with overdue ones counted today', () => {
    const p = (days: number, level = 2): ProgressRecord => ({ ...emptyProgress('c', String(days)), level, nextReview: new Date(2026, 0, 10 + days, 8).toISOString() })
    expect(dueForecast([p(-5), p(0), p(1), p(1), p(6), p(7), p(2, 0)], 7, today)).toEqual([2, 2, 0, 0, 0, 0, 1])
  })
  it('computes accuracy per collection', () => {
    const a = accuracyByCollection([act(1, 'a'), act(1, 'b', 'incorrect'), act(1, 'x', 'correct', 'other')])
    expect(a.get('c')).toEqual({ correct: 1, total: 2 })
    expect(a.get('other')).toEqual({ correct: 1, total: 1 })
  })
})

describe('search', () => {
  it('folds Vietnamese diacritics', () => {
    expect(fold('Đảng Cộng sản Việt Nam')).toBe('dang cong san viet nam')
  })
  it('matches without diacritics, and exactly when the query has them', () => {
    const text = 'Cương lĩnh chính trị đầu tiên của Đảng (1930)'
    expect(matcher('cuong linh 1930')(text)).toBe(true)
    expect(matcher('dang  CUONG')(text)).toBe(true) // every word, any order
    expect(matcher('cuong linh 1945')(text)).toBe(false)
    expect(matcher('Đảng')(text)).toBe(true)
    expect(matcher('đang')(text)).toBe(false) // typed diacritics must match
    expect(matcher('   ')(text)).toBe(false)
  })
})
