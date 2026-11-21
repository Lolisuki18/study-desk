import { describe, expect, it } from 'vitest'
import type { Collection, Entry, Item } from '../types'
import { buildSurvivalPool, isSurvivalCorrect, pointsFor } from './survival'

const mc = (id: string, question: string, answer = 'A'): Item => ({
  id,
  type: 'multiple-choice',
  content: { question, options: ['A', 'B', 'C'].map((key) => ({ key, text: key })), answer },
})
const col = (id: string, items: Item[], standalone = false): Collection => ({ id, title: id, subject: 'S', contentType: 'multiple-choice', description: '', items, standalone })
const entries = (...cs: Collection[]): Entry[] => cs.flatMap((c) => c.items.map((item) => ({ collection: c, item })))

describe('survival rules', () => {
  it('needs the exact set of options for a select-all question', () => {
    expect(isSurvivalCorrect('A', 'AB')).toBe(false)
    expect(isSurvivalCorrect('B', 'AB')).toBe(false)
    expect(isSurvivalCorrect('BA', 'AB')).toBe(true)
    expect(isSurvivalCorrect('ABC', 'AB')).toBe(false)
    expect(isSurvivalCorrect('A', 'A')).toBe(true)
    expect(isSurvivalCorrect('B', 'A')).toBe(false)
    expect(isSurvivalCorrect('', 'A')).toBe(false) // time ran out
  })

  it('pays more for speed and for a streak', () => {
    expect(pointsFor(15, 0)).toEqual({ base: 30, bonus: 0, total: 30 })
    expect(pointsFor(1, 0).total).toBe(10) // never below 10
    expect(pointsFor(10, 1)).toEqual({ base: 20, bonus: 5, total: 25 })
    expect(pointsFor(10, 4).bonus).toBe(20)
    expect(pointsFor(10, 99).bonus).toBe(50) // capped
    expect(pointsFor(10, -3).bonus).toBe(0)
  })

  it('draws each question text once, and lets standalone copies only fill gaps', () => {
    const a = col('a', [mc('1', 'Thủ đô là gì?'), mc('2', 'Một cộng một?')])
    const copy = col('copy', [mc('x', 'THỦ ĐÔ LÀ GÌ?!'), mc('y', 'Câu chỉ có ở bản sao')], true)
    const pool = buildSurvivalPool(entries(copy, a))
    const labels = pool.map((e) => `${e.collection.id}/${e.item.id}`)
    expect(labels).toEqual(['a/1', 'a/2', 'copy/y'])
  })

  it('ignores questions that are not multiple choice', () => {
    const c = col('t', [mc('1', 'Q1'), { id: 'tf', type: 'true-false', content: { statement: 'S', answer: true } }])
    expect(buildSurvivalPool(entries(c))).toHaveLength(1)
  })
})
