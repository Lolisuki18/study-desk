import { describe, expect, it } from 'vitest'
import { collections, loadCollections, loadReports, progressKey } from './index'
import { validateCollection } from '../utils/validate'
import { availableKinds, buildQuiz, canShuffle, isCorrect } from '../services/quiz/generate'
import { allEntries } from './index'

describe('bundled collections', () => {
  it('all load and validate without errors', () => {
    for (const r of loadReports) expect(r.errors, r.file).toEqual([])
    expect(collections.length).toBeGreaterThanOrEqual(2)
  })
  it('history chapters have 50 questions each with an answer matching an option', () => {
    for (const id of ['lich-su-dang-chuong-1', 'lich-su-dang-chuong-2']) {
      const c = collections.find((x) => x.id === id)!
      expect(c.items).toHaveLength(50)
    }
  })
  it('keeps item ids stable so updating content never orphans progress', () => {
    const c = collections[0]
    const edited = { ...c, description: 'changed', items: [...c.items, { ...c.items[0], id: 'extra-1' }] }
    const { collections: reloaded } = loadCollections({ './collections/x.json': edited })
    expect(progressKey(c.id, c.items[0].id)).toBe(progressKey(reloaded[0].id, reloaded[0].items[0].id))
  })
  it('rejects broken collections and duplicate ids', () => {
    expect(validateCollection({ id: 'x' }).ok).toBe(false)
    const c = collections[0]
    const bad = { ...c, items: [{ ...c.items[0], content: { ...(c.items[0].content as object), answer: 'Z' } }] }
    expect(validateCollection(bad).ok).toBe(false)
    const dup = loadCollections({ './collections/a.json': c, './collections/b.json': c })
    expect(dup.collections).toHaveLength(1)
  })
})

describe('quiz generation', () => {
  it('multiple-choice content only yields multiple choice', () => {
    expect(availableKinds(allEntries())).toEqual(['mc'])
    const qs = buildQuiz(allEntries(), { count: 10, kinds: ['mc'], randomize: true })
    expect(qs).toHaveLength(10)
    expect(qs.every((q) => q.kind === 'mc')).toBe(true)
  })
  it('generates every kind for vocabulary content', () => {
    const vocab = {
      id: 'v',
      title: 'V',
      subject: 'English',
      contentType: 'vocabulary' as const,
      description: 'd',
      items: Array.from({ length: 6 }, (_, i) => ({
        id: `w${i}`,
        type: 'vocabulary' as const,
        content: { term: `term${i}`, meaning: `meaning ${i}`, example: `She used term${i} today.` },
      })),
    }
    expect(validateCollection(vocab).ok).toBe(true)
    const entries = vocab.items.map((item) => ({ collection: vocab, item }))
    const kinds = availableKinds(entries)
    expect(kinds).toEqual(['mc', 'tf', 'fill', 'match', 'short'])
    const qs = buildQuiz(entries, { count: 6, kinds, randomize: false })
    expect(qs.length).toBeGreaterThan(0)
    const fill = buildQuiz(entries, { count: 6, kinds: ['fill'], randomize: false })
    expect(fill[0].kind).toBe('fill')
    expect(isCorrect(fill[0], 'term0')).toBe(true)
    expect(isCorrect(fill[0], 'nope')).toBe(false)
  })
})

describe('exam option shuffling', () => {
  it('keeps the right answer after shuffling A-D', () => {
    const entries = allEntries().filter((e) => e.collection.id === 'lich-su-dang-chuong-1')
    const qs = buildQuiz(entries, { count: 50, kinds: ['mc'], randomize: false, shuffleOptions: true })
    for (const q of qs) {
      if (q.kind !== 'mc') throw new Error('expected mc')
      const orig = entries.find((e) => e.item.id === q.itemId)!.item
      if (orig.type !== 'multiple-choice') throw new Error('expected mc item')
      const correctText = orig.content.options.find((o) => o.key === orig.content.answer)!.text
      expect(q.options.find((o) => o.key === q.answer)!.text).toBe(correctText)
      expect(q.options.map((o) => o.key)).toEqual(['A', 'B', 'C', 'D'])
    }
  })
  it('never reorders options that refer to other options', () => {
    expect(canShuffle([{ text: 'Cả B và C đều đúng' }, { text: '1858' }])).toBe(false)
    expect(canShuffle([{ text: 'Cả A, B, C đều đúng.' }])).toBe(false)
    expect(canShuffle([{ text: 'Cả Đảng và Nhà nước' }, { text: 'Công nhân và Cộng sản' }])).toBe(true)
  })
})

describe('multi-answer questions', () => {
  const multiCol = {
    id: 'm',
    title: 'M',
    subject: 'S',
    contentType: 'multiple-choice' as const,
    description: 'd',
    items: [
      {
        id: 'q1',
        type: 'multiple-choice' as const,
        content: { question: 'Chọn 2 đáp án', options: [{ key: 'A', text: 'a' }, { key: 'B', text: 'b' }, { key: 'C', text: 'c' }, { key: 'D', text: 'd' }], answer: 'AC' },
      },
    ],
  }
  it('validates select-all-that-apply answers', () => {
    expect(validateCollection(multiCol).ok).toBe(true)
    const bad = { ...multiCol, items: [{ ...multiCol.items[0], content: { ...multiCol.items[0].content, answer: 'AZ' } }] }
    expect(validateCollection(bad).ok).toBe(false)
  })
  it('grades by exact set, regardless of click order, and survives shuffling', () => {
    const entries = multiCol.items.map((item) => ({ collection: multiCol, item }))
    const [q] = buildQuiz(entries, { count: 1, kinds: ['mc'], randomize: false })
    expect(q.kind).toBe('mc')
    if (q.kind !== 'mc') return
    expect(isCorrect(q, 'CA')).toBe(true)
    expect(isCorrect(q, 'A')).toBe(false)
    expect(isCorrect(q, 'ABC')).toBe(false)
    for (let i = 0; i < 20; i++) {
      const [s] = buildQuiz(entries, { count: 1, kinds: ['mc'], randomize: false, shuffleOptions: true })
      if (s.kind !== 'mc') throw new Error('mc expected')
      const texts = [...s.answer].map((k) => s.options.find((o) => o.key === k)!.text).sort()
      expect(texts).toEqual(['a', 'c'])
    }
  })
})
