import { describe, expect, it } from 'vitest'
import type { Collection, Entry, Item, ProgressRecord } from '../types'
import { applyResult, emptyProgress } from './review/srs'
import { pickWeakest } from './drill'

const mc = (id: string): Item => ({ id, type: 'multiple-choice', content: { question: id, options: ['A', 'B', 'C', 'D'].map((key) => ({ key, text: key })), answer: 'A' } })
const col: Collection = { id: 'c', title: 'c', subject: 'S', contentType: 'multiple-choice', description: '', items: Array.from({ length: 12 }, (_, i) => mc(`q${i + 1}`)) }
const entries: Entry[] = col.items.map((item) => ({ collection: col, item }))
const now = new Date('2026-01-01T00:00:00Z')

describe('pickWeakest', () => {
  it('takes what you know least first: wrong and never-studied before well-known', () => {
    let known = emptyProgress('c', 'q1')
    for (let i = 0; i < 5; i++) known = applyResult(known, true, { now }) // box 5
    const wrong = applyResult(emptyProgress('c', 'q2'), false, { now })
    const progress = new Map<string, ProgressRecord>([
      ['c::q1', known],
      ['c::q2', wrong],
    ])
    const plan = pickWeakest(entries, (c, i) => progress.get(`${c}::${i}`), 11)
    const ids = plan.entries.map((e) => e.item.id)
    expect(ids).toHaveLength(11)
    expect(ids).not.toContain('q1') // the best-known question is the one left out
    expect(plan.unseen).toBe(10)
    expect(plan.missed).toBe(1)
    expect(plan.other).toBe(0)
  })

  it('puts a wrong answer ahead of a mastered one even when asked for few questions', () => {
    let known = emptyProgress('c', 'q1')
    for (let i = 0; i < 5; i++) known = applyResult(known, true, { now })
    const progress = new Map<string, ProgressRecord>([['c::q1', known]])
    const plan = pickWeakest(entries.slice(0, 2), (c, i) => progress.get(`${c}::${i}`), 1)
    expect(plan.entries.map((e) => e.item.id)).toEqual(['q2'])
  })

  it('handles counts larger than the chapter and zero', () => {
    expect(pickWeakest(entries, () => undefined, 99).entries).toHaveLength(12)
    expect(pickWeakest(entries, () => undefined, 0).entries).toEqual([])
  })
})
