import type { Item } from '../types'

export interface ItemPreview {
  /** the question / term / statement */
  q: string
  /** the correct answer, ready to show */
  a: string
  /** explanation, when the source has one */
  exp?: string
}

/**
 * Question + correct answer of any item as plain text, for quick-review lists.
 * A multiple-choice answer may hold several option keys ("BD"): every one is expanded to its option text.
 */
export function previewOf(item: Item): ItemPreview {
  switch (item.type) {
    case 'multiple-choice': {
      const c = item.content
      const a = [...c.answer]
        .map((key) => {
          const option = c.options.find((o) => o.key === key)
          return option ? `${key}. ${option.text}` : key
        })
        .join('  ·  ')
      return { q: c.question, a, exp: c.explanation }
    }
    case 'true-false':
      return { q: item.content.statement, a: item.content.answer ? 'Đúng' : 'Sai', exp: item.content.explanation }
    case 'theory':
    case 'programming':
      return { q: item.content.concept, a: item.content.definition, exp: item.content.explanation }
    case 'vocabulary':
      return { q: item.content.term, a: item.content.meaning, exp: item.content.example }
  }
}
