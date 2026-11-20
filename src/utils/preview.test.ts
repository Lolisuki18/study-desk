import { describe, expect, it } from 'vitest'
import type { Item } from '../types'
import { previewOf } from './preview'

const mc = (answer: string): Item => ({
  id: 'x',
  type: 'multiple-choice',
  content: {
    question: 'Câu hỏi?',
    options: [
      { key: 'A', text: 'Một' },
      { key: 'B', text: 'Hai' },
      { key: 'C', text: 'Ba' },
      { key: 'D', text: 'Bốn' },
    ],
    answer,
    explanation: 'Vì thế.',
  },
})

describe('previewOf', () => {
  it('expands a single multiple-choice answer to its option text', () => {
    expect(previewOf(mc('C'))).toEqual({ q: 'Câu hỏi?', a: 'C. Ba', exp: 'Vì thế.' })
  })

  it('expands every key of a select-all answer instead of printing the letters', () => {
    expect(previewOf(mc('BD')).a).toBe('B. Hai  ·  D. Bốn')
  })

  it('falls back to the bare key when the option is missing', () => {
    expect(previewOf(mc('E')).a).toBe('E')
  })

  it('covers the other item types', () => {
    expect(previewOf({ id: 't', type: 'true-false', content: { statement: 'S', answer: false } })).toEqual({ q: 'S', a: 'Sai', exp: undefined })
    expect(previewOf({ id: 'c', type: 'theory', content: { concept: 'K', definition: 'D' } })).toEqual({ q: 'K', a: 'D', exp: undefined })
    expect(previewOf({ id: 'v', type: 'vocabulary', content: { term: 'apple', meaning: 'táo', example: 'An apple.' } })).toEqual({ q: 'apple', a: 'táo', exp: 'An apple.' })
  })
})
