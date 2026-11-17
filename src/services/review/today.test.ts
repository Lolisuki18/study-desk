import { describe, expect, it } from 'vitest'
import type { Collection, Entry, Item, ProgressRecord } from '../../types'
import { applyResult, emptyProgress } from './srs'
import { BONUS_NEW, buildToday, REVIEW_CAP } from './today'
import { estimateReadiness, guessChance, recallChance } from '../readiness'
import { studyMinutesByDay } from '../stats'

const now = new Date(2026, 0, 10, 12)
const days = (n: number) => new Date(now.getTime() + n * 86_400_000)

const mc = (id: string): Item => ({
  id,
  type: 'multiple-choice',
  content: { question: id, options: ['A', 'B', 'C', 'D'].map((key) => ({ key, text: key })), answer: 'A' },
})
const col = (id: string, subject: string, title: string, n: number): Collection => ({
  id,
  title,
  subject,
  contentType: 'multiple-choice',
  description: '',
  items: Array.from({ length: n }, (_, i) => mc(`${id}-${i + 1}`)),
})
const entries = (...cs: Collection[]): Entry[] => cs.flatMap((c) => c.items.map((item) => ({ collection: c, item })))
const store = (records: ProgressRecord[]) => {
  const m = new Map(records.map((r) => [r.key, r]))
  return (c: string, i: string) => m.get(`${c}::${i}`)
}
const ids = (list: Entry[]) => list.map((e) => e.item.id)

describe("today's session", () => {
  const a = col('a', 'History', 'History – Chương 1', 6)
  const b = col('b', 'Politics', 'Politics – Chương 1', 6)

  it('puts due cards first, then wrong ones, then new cards up to the goal', () => {
    const due = applyResult(emptyProgress('a', 'a-1'), true, { now: days(-2) }) // box 1, due yesterday
    const wrong = applyResult(emptyProgress('a', 'a-2'), false, { now: days(-1) }) // answered wrong: goes with the wrong ones
    const marked: ProgressRecord = { ...applyResult(emptyProgress('a', 'a-3'), true, { now }), review: true } // not due, bookmarked
    const fine = applyResult(emptyProgress('a', 'a-4'), true, { now }) // studied, nothing to do
    const plan = buildToday({ entries: entries(a, b), progress: store([due, wrong, marked, fine]), goalLeft: 5, now })
    expect(ids(plan.due)).toEqual(['a-1'])
    expect(ids(plan.wrong)).toEqual(['a-2', 'a-3']) // hardest first
    // 5 to go, 3 are reviews → 2 new cards, in collection order, skipping studied ones
    expect(ids(plan.fresh)).toEqual(['a-5', 'a-6'])
  })

  it('takes new cards from the subject with the nearest upcoming exam', () => {
    const plan = buildToday({
      entries: entries(a, b),
      progress: store([]),
      goalLeft: 3,
      examDates: { History: '2026-03-01', Politics: '2026-01-20' },
      now,
    })
    expect(ids(plan.fresh)).toEqual(['b-1', 'b-2', 'b-3'])
    // an exam date in the past no longer gives priority
    const past = buildToday({ entries: entries(a, b), progress: store([]), goalLeft: 2, examDates: { Politics: '2025-12-01' }, now })
    expect(ids(past.fresh)).toEqual(['a-1', 'a-2'])
  })

  it('adds no new cards when reviews already cover the goal, and offers a few when all is done', () => {
    const due = ['a-1', 'a-2', 'a-3'].map((id) => applyResult(emptyProgress('a', id), true, { now: days(-3) }))
    expect(buildToday({ entries: entries(a), progress: store(due), goalLeft: 2, now }).fresh).toEqual([])
    const idle = buildToday({ entries: entries(col('big', 'S', 'Big', 30)), progress: store([]), goalLeft: 0, now })
    expect(idle.fresh).toHaveLength(BONUS_NEW)
  })

  it('caps the number of review cards in one session', () => {
    const big = col('big', 'S', 'Big', REVIEW_CAP + 15)
    const all = big.items.map((it) => applyResult(emptyProgress('big', it.id), true, { now: days(-5) }))
    const plan = buildToday({ entries: entries(big), progress: store(all), goalLeft: 10, now })
    expect(plan.due.length + plan.wrong.length).toBe(REVIEW_CAP)
  })
})

describe('exam readiness estimate', () => {
  const c1 = col('c1', 'S', 'S – Chương 1', 4)
  const c2 = col('c2', 'S', 'S – Chương 2', 4)

  it('treats unseen questions as a guess and studied ones by Leitner box', () => {
    expect(guessChance(mc('x'))).toBe(0.25)
    expect(recallChance(mc('x'))).toBe(0.25)
    const box2 = applyResult(applyResult(emptyProgress('c', 'x'), true, { now }), true, { now })
    expect(recallChance(mc('x'), box2)).toBe(0.75)
    expect(recallChance(mc('x'), applyResult(box2, false, { now }))).toBe(0.4)
  })

  it('scores a subject and ranks the chapters that cost the most', () => {
    expect(estimateReadiness(entries(c1, c2), store([])).score10).toBe(2.5)
    // chapter 1 fully in box 5, chapter 2 untouched
    const top = c1.items.map((it) => ({ ...applyResult(emptyProgress('c1', it.id), true, { now }), level: 5 }))
    const r = estimateReadiness(entries(c1, c2), store(top))
    expect(r.score10).toBe(6.1) // (4 × 0.96 + 4 × 0.25) / 8 × 10 = 6.05
    expect(r.studied).toBe(4)
    expect(r.chapters.map((c) => [c.label, c.studied, c.score10, c.lost10])).toEqual([
      ['Chương 2', 0, 2.5, 3.8],
      ['Chương 1', 4, 9.6, 0.2],
    ])
  })
})

describe('study time estimate', () => {
  const at = (h: number, m: number, day = 10) => ({ ts: new Date(2026, 0, day, h, m).toISOString() })
  it('sums gaps between answers and ignores breaks longer than 5 minutes', () => {
    const t = studyMinutesByDay([at(9, 0), at(9, 2), at(9, 5), at(9, 30), at(9, 31), at(8, 0, 11)])
    expect(t.get('2026-01-10')).toBe(6) // 2 + 3 + (25-minute break ignored) + 1
    expect(t.get('2026-01-11')).toBeUndefined()
  })
  it('adds the recorded duration of mock exams', () => {
    const t = studyMinutesByDay([at(9, 0), at(9, 4)], [{ ts: new Date(2026, 0, 10, 20).toISOString(), durationSec: 1800 }])
    expect(t.get('2026-01-10')).toBe(34)
  })
})
