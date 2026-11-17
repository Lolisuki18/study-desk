import type { Item } from '../types'

/** lowercase and strip Vietnamese diacritics, so "dang" matches "Đảng". */
export const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')

/** Everything searchable in an item: question, options, answers, explanation and enrichment. */
export function searchText(item: Item): string {
  const parts: (string | undefined)[] = []
  switch (item.type) {
    case 'vocabulary': {
      const c = item.content
      parts.push(c.term, c.meaning, c.example, c.translation, ...(c.collocations ?? []), ...(c.synonyms ?? []))
      break
    }
    case 'multiple-choice':
      parts.push(item.content.question, ...item.content.options.map((o) => o.text), item.content.explanation)
      break
    case 'true-false':
      parts.push(item.content.statement, item.content.explanation)
      break
    case 'theory':
      parts.push(item.content.concept, item.content.definition, ...(item.content.points ?? []), item.content.explanation)
      break
    case 'programming':
      parts.push(item.content.concept, item.content.definition, item.content.code, item.content.explanation, item.content.application)
      break
  }
  parts.push(item.enrichment?.text)
  return parts.filter(Boolean).join('\n')
}

/**
 * Build a matcher for a query. Every word must appear. A query typed without diacritics matches
 * accent-insensitively; a query with diacritics must match them exactly.
 */
export function matcher(query: string): (text: string) => boolean {
  const q = query.trim().toLowerCase().normalize('NFC')
  const words = q.split(/\s+/).filter(Boolean)
  if (!words.length) return () => false
  const exact = fold(q) !== q
  const prep = exact ? (s: string) => s.toLowerCase().normalize('NFC') : fold
  return (text) => {
    const t = prep(text)
    return words.every((w) => t.includes(w))
  }
}
