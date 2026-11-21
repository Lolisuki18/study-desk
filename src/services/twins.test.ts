import { describe, expect, it } from 'vitest'
import type { Collection, Item, ProgressRecord } from '../types'
import { emptyProgress } from './review/srs'
import { buildTwinIndex, planTwinSync, refKey, signatureOf, twinStats } from './twins'

const mc = (id: string, question: string, options: string[], answer: string): Item => ({
  id,
  type: 'multiple-choice',
  content: { question, options: options.map((text, i) => ({ key: 'ABCD'[i], text })), answer },
})
const col = (id: string, items: Item[]): Collection => ({ id, title: id, subject: 'S', contentType: 'multiple-choice', description: '', items })

const a = col('chuong', [mc('q1', 'Đảng ra đời năm nào?', ['1930', '1945', '1954'], 'A'), mc('q2', 'Thủ đô là gì?', ['Huế', 'Hà Nội'], 'B')])
const b = col('full', [
  mc('x9', 'DANG RA DOI NAM NAO', ['1954', '1930', '1945'], 'B'), // same wording without marks, options reordered
  mc('x2', 'Thủ đô là gì?', ['Huế', 'Hà Nội'], 'A'), // same wording, DIFFERENT answer: a conflict, not a twin
])

describe('twins', () => {
  it('matches the same question across decks, ignoring diacritics, case, punctuation and option order', () => {
    const idx = buildTwinIndex([a, b])
    expect(idx.get('chuong::q1')!.map(refKey)).toEqual(['full::x9'])
    expect(idx.get('full::x9')!.map(refKey)).toEqual(['chuong::q1'])
  })

  it('keeps questions whose answers disagree apart', () => {
    const idx = buildTwinIndex([a, b])
    expect(idx.has('chuong::q2')).toBe(false)
    expect(idx.has('full::x2')).toBe(false)
    expect(signatureOf(a.items[1])).not.toBe(signatureOf(b.items[1]))
  })

  it('groups three or more copies and counts them', () => {
    const c = col('third', [mc('t1', 'Đảng ra đời năm nào?', ['1930', 'x'], 'A')])
    const idx = buildTwinIndex([a, b, c])
    expect(idx.get('chuong::q1')!.map(refKey).sort()).toEqual(['full::x9', 'third::t1'])
    expect(twinStats(idx)).toEqual({ groups: 1, items: 3 })
  })

  it('has no twins when everything is different', () => {
    expect(buildTwinIndex([a]).size).toBe(0)
  })
})

describe('planTwinSync', () => {
  const idx = buildTwinIndex([a, b])
  const rec = (key: string, level: number, last: string): ProgressRecord => ({ ...emptyProgress(key.split('::')[0], key.split('::')[1]), status: 'known', level, correct: 2, lastStudied: last, nextReview: '2030-01-01T00:00:00.000Z', lastResult: 'correct' })

  it('copies the schedule of the furthest-along twin to the other one', () => {
    const progress = new Map([['chuong::q1', rec('chuong::q1', 3, '2026-01-02T00:00:00.000Z')]])
    const plan = planTwinSync(progress, idx)
    expect(plan).toHaveLength(1)
    expect(plan[0]).toMatchObject({ key: 'full::x9', level: 3, status: 'known', correct: 0, incorrect: 0 }) // own counters stay at 0
  })

  it('does not touch a twin that is already as far along', () => {
    const progress = new Map([
      ['chuong::q1', rec('chuong::q1', 3, '2026-01-02T00:00:00.000Z')],
      ['full::x9', rec('full::x9', 3, '2026-01-05T00:00:00.000Z')],
    ])
    expect(planTwinSync(progress, idx)).toEqual([])
  })

  it('does nothing when neither twin was studied', () => {
    expect(planTwinSync(new Map(), idx)).toEqual([])
  })

  it('raises the lower twin and never lowers the higher one', () => {
    const progress = new Map([
      ['chuong::q1', rec('chuong::q1', 1, '2026-01-02T00:00:00.000Z')],
      ['full::x9', rec('full::x9', 4, '2026-01-01T00:00:00.000Z')],
    ])
    const plan = planTwinSync(progress, idx)
    expect(plan.map((p) => [p.key, p.level])).toEqual([['chuong::q1', 4]])
  })
})
