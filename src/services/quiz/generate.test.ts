import { describe, expect, it } from 'vitest'
import type { Collection, Entry, Item } from '../../types'
import { availableKinds, buildQuiz, canShuffle, isCorrect, itemResults, type Question } from './generate'
import { allocate, chapterGroups, chapterLabel, sampleExam } from './exam'

const col = (id: string, title: string, items: Item[]): Collection => ({ id, title, subject: 'S', contentType: 'mixed', description: '', items })
const entries = (c: Collection): Entry[] => c.items.map((item) => ({ collection: c, item }))

const mc = (id: string, answer = 'B'): Item => ({
  id,
  type: 'multiple-choice',
  content: {
    question: `Q ${id}`,
    options: ['A', 'B', 'C', 'D'].map((key) => ({ key, text: `${id}-${key}` })),
    answer,
    explanation: `because ${id}`,
  },
  enrichment: { text: `extra ${id}` },
})
const theory = (n: number): Item => ({ id: `t${n}`, type: 'theory', content: { concept: `Concept ${n}`, definition: `Definition ${n}` } })
const tf: Item = { id: 'tf1', type: 'true-false', content: { statement: 'S', answer: false } }
const vocab: Item = { id: 'v1', type: 'vocabulary', content: { term: 'apple', meaning: 'táo', example: 'An Apple a day.' } }

const mcOf = (qs: Question[]) => qs.filter((q): q is Extract<Question, { kind: 'mc' }> => q.kind === 'mc')

describe('availableKinds', () => {
  it('offers only the kinds the content supports', () => {
    expect(availableKinds(entries(col('c', 'C', [mc('1'), mc('2')])))).toEqual(['mc'])
    expect(availableKinds(entries(col('c', 'C', [tf])))).toEqual(['tf'])
    expect(availableKinds(entries(col('c', 'C', [vocab])))).toEqual(['fill'])
    expect(availableKinds(entries(col('c', 'C', [1, 2, 3].map(theory))))).toEqual([])
    expect(availableKinds(entries(col('c', 'C', [1, 2, 3, 4].map(theory))))).toEqual(['mc', 'tf', 'match', 'short'])
  })
})

describe('canShuffle', () => {
  it('refuses to reorder options that refer to other options', () => {
    expect(canShuffle([{ text: 'Năm 1930' }, { text: 'Năm 1945' }])).toBe(true)
    expect(canShuffle([{ text: 'Năm 1930' }, { text: 'Cả A và B' }])).toBe(false)
    expect(canShuffle([{ text: 'Năm 1930' }, { text: 'Tất cả các ý trên' }])).toBe(false)
    expect(canShuffle([{ text: 'Năm 1930' }, { text: 'Cả ba đều đúng' }])).toBe(false)
  })
})

describe('buildQuiz', () => {
  const c = col('c', 'C', ['1', '2', '3', '4', '5'].map((id) => mc(id)))

  it('copies native multiple-choice questions verbatim and respects count', () => {
    const qs = mcOf(buildQuiz(entries(c), { count: 3, kinds: ['mc'], randomize: false }))
    expect(qs.map((q) => q.itemId)).toEqual(['1', '2', '3'])
    expect(qs[0]).toMatchObject({ collectionId: 'c', prompt: 'Q 1', answer: 'B', answerText: '1-B', explanation: 'because 1', enrichment: 'extra 1' })
    expect(qs[0].options.map((o) => o.text)).toEqual(['1-A', '1-B', '1-C', '1-D'])
  })

  it('keeps the correct answer attached to its text when options are shuffled', () => {
    for (let run = 0; run < 25; run++) {
      const [q] = mcOf(buildQuiz(entries(col('c', 'C', [mc('x', 'C')])), { count: 1, kinds: ['mc'], randomize: true, shuffleOptions: true }))
      expect(q.options.map((o) => o.key)).toEqual(['A', 'B', 'C', 'D'])
      expect(q.options.map((o) => o.text).sort()).toEqual(['x-A', 'x-B', 'x-C', 'x-D'])
      expect(q.options.find((o) => o.key === q.answer)!.text).toBe('x-C')
      expect(q.answerText).toBe('x-C')
    }
  })

  it('remaps every key of a multi-answer question', () => {
    for (let run = 0; run < 25; run++) {
      const [q] = mcOf(buildQuiz(entries(col('c', 'C', [mc('x', 'AD')])), { count: 1, kinds: ['mc'], randomize: true, shuffleOptions: true }))
      expect([...q.answer].map((k) => q.options.find((o) => o.key === k)!.text).sort()).toEqual(['x-A', 'x-D'])
      expect(q.answer).toBe([...q.answer].sort().join(''))
    }
  })

  it('leaves position-dependent options in place', () => {
    const item = mc('x')
    if (item.type === 'multiple-choice') item.content.options[3].text = 'Cả A và B'
    const [q] = mcOf(buildQuiz(entries(col('c', 'C', [item])), { count: 1, kinds: ['mc'], randomize: true, shuffleOptions: true }))
    expect(q.options.map((o) => o.text)).toEqual(['x-A', 'x-B', 'x-C', 'Cả A và B'])
    expect(q.answer).toBe('B')
  })

  it('skips items that cannot produce any of the requested kinds', () => {
    expect(buildQuiz(entries(c), { count: 5, kinds: ['tf'], randomize: false })).toEqual([])
  })

  it('builds definition questions from term/definition items with one correct option', () => {
    const t = col('t', 'T', [1, 2, 3, 4, 5].map(theory))
    const qs = mcOf(buildQuiz(entries(t), { count: 5, kinds: ['mc'], randomize: false }))
    expect(qs).toHaveLength(5)
    for (const q of qs) {
      const n = q.itemId.slice(1)
      expect(q.options).toHaveLength(4)
      expect(new Set(q.options.map((o) => o.text)).size).toBe(4)
      expect(q.options.find((o) => o.key === q.answer)!.text).toBe(`Definition ${n}`)
    }
  })

  it('groups four term/definition items into one matching question', () => {
    const t = col('t', 'T', [1, 2, 3, 4].map(theory))
    const [q] = buildQuiz(entries(t), { count: 4, kinds: ['match'], randomize: false })
    expect(q.kind).toBe('match')
    if (q.kind !== 'match') return
    expect(q.pairs.map((p) => p.left)).toEqual(['Concept 1', 'Concept 2', 'Concept 3', 'Concept 4'])
    expect([...q.rights].sort()).toEqual(q.pairs.map((p) => p.right).sort())
  })
})

describe('grading', () => {
  const base = { id: 'q', collectionId: 'c', itemId: 'i' }
  it('grades each kind', () => {
    const m: Question = { ...base, kind: 'mc', prompt: '', options: [], answer: 'AB', answerText: '' }
    expect(isCorrect(m, 'BA')).toBe(true)
    expect(isCorrect(m, 'A')).toBe(false)
    expect(isCorrect(m, undefined)).toBe(false)
    expect(isCorrect({ ...base, kind: 'tf', prompt: '', answer: false }, false)).toBe(true)
    expect(isCorrect({ ...base, kind: 'tf', prompt: '', answer: false }, undefined)).toBe(false)
    expect(isCorrect({ ...base, kind: 'short', prompt: '', answer: 'Đảng Cộng sản' }, '  đảng  cộng sản. ')).toBe(true)
    expect(isCorrect({ ...base, kind: 'short', prompt: '', answer: 'Đảng' }, 'Dang')).toBe(false) // diacritics matter
  })
  it('reports matching questions per item', () => {
    const q: Question = {
      ...base,
      kind: 'match',
      prompt: '',
      pairs: [
        { collectionId: 'c', itemId: 'a', left: 'A', right: 'ra' },
        { collectionId: 'c', itemId: 'b', left: 'B', right: 'rb' },
      ],
      rights: ['ra', 'rb'],
    }
    expect(itemResults(q, { 0: 'ra', 1: 'ra' })).toEqual([
      { collectionId: 'c', itemId: 'a', correct: true },
      { collectionId: 'c', itemId: 'b', correct: false },
    ])
    expect(isCorrect(q, { 0: 'ra', 1: 'rb' })).toBe(true)
  })
  it('lets the learner override a free-text result', () => {
    const q: Question = { ...base, kind: 'short', prompt: '', answer: 'x' }
    expect(itemResults(q, 'y')).toEqual([{ collectionId: 'c', itemId: 'i', correct: false }])
    expect(itemResults(q, 'y', true)).toEqual([{ collectionId: 'c', itemId: 'i', correct: true }])
  })
})

describe('mock exam sampling', () => {
  it('splits questions in proportion to chapter size', () => {
    expect(allocate([100, 100], 40)).toEqual([20, 20])
    expect(allocate([150, 100, 50], 40)).toEqual([20, 13, 7])
    expect(allocate([3, 1], 10)).toEqual([3, 1]) // never more than a chapter has
    expect(allocate([], 10)).toEqual([])
    expect(allocate([5, 5, 5], 1).reduce((s, n) => s + n, 0)).toBe(1)
    for (const count of [1, 7, 33, 40, 61]) {
      const out = allocate([122, 127, 151, 50, 50], count)
      expect(out.reduce((s, n) => s + n, 0)).toBe(count)
    }
  })
  it('merges a chapter with its extra bank and samples without repeats', () => {
    const a = col('a', 'Môn X – Chương 1', ['1', '2', '3', '4'].map((id) => mc(id)))
    const b = col('b', 'Môn X – Ngân hàng bổ sung – Chương 1', ['5', '6'].map((id) => mc(id)))
    const c = col('c', 'Môn X – Chương 2', ['7', '8', '9', '10', '11', '12'].map((id) => mc(id)))
    const d = col('d', 'Ôn tập chung', [mc('13')])
    expect(chapterLabel(b)).toBe('Chương 1')
    expect(chapterLabel(d)).toBe('Ôn tập chung')
    const all = [a, b, c].flatMap(entries)
    expect(chapterGroups(all).map((g) => [g.label, g.entries.length])).toEqual([
      ['Chương 1', 6],
      ['Chương 2', 6],
    ])
    const picked = sampleExam(all, 8)
    expect(picked).toHaveLength(8)
    expect(new Set(picked.map((e) => e.item.id)).size).toBe(8)
    expect(picked.filter((e) => chapterLabel(e.collection) === 'Chương 1')).toHaveLength(4)
  })
})
