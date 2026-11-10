import type { Collection } from '../types'

export interface ValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}

const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const isStrArr = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === 'string')
const ITEM_TYPES = ['vocabulary', 'multiple-choice', 'true-false', 'theory', 'programming']

/** Content profile validators: one per item type. Return list of problems. */
const profiles: Record<string, (c: any) => string[]> = {
  vocabulary: (c) => [
    ...(isStr(c.term) ? [] : ['content.term is required']),
    ...(isStr(c.meaning) ? [] : ['content.meaning is required']),
    ...(c.collocations === undefined || isStrArr(c.collocations) ? [] : ['content.collocations must be string[]']),
    ...(c.synonyms === undefined || isStrArr(c.synonyms) ? [] : ['content.synonyms must be string[]']),
  ],
  'multiple-choice': (c) => {
    const p: string[] = []
    if (!isStr(c.question)) p.push('content.question is required')
    if (!Array.isArray(c.options) || c.options.length < 2) p.push('content.options needs at least 2 options')
    else {
      const keys = c.options.map((o: any) => o?.key)
      if (c.options.some((o: any) => !isStr(o?.key) || !isStr(o?.text))) p.push('every option needs key and text')
      if (new Set(keys).size !== keys.length) p.push('duplicate option keys')
      const ans = typeof c.answer === 'string' ? [...c.answer] : []
      if (!ans.length || ans.some((k: string) => !keys.includes(k)) || new Set(ans).size !== ans.length)
        p.push(`content.answer "${c.answer}" must be option key(s) ("B", or "AB" for select-all-that-apply)`)
    }
    return p
  },
  'true-false': (c) => [
    ...(isStr(c.statement) ? [] : ['content.statement is required']),
    ...(typeof c.answer === 'boolean' ? [] : ['content.answer must be boolean']),
  ],
  theory: (c) => [
    ...(isStr(c.concept) ? [] : ['content.concept is required']),
    ...(isStr(c.definition) ? [] : ['content.definition is required']),
    ...(c.points === undefined || isStrArr(c.points) ? [] : ['content.points must be string[]']),
  ],
  programming: (c) => [
    ...(isStr(c.concept) ? [] : ['content.concept is required']),
    ...(isStr(c.definition) ? [] : ['content.definition is required']),
  ],
}

export function validateCollection(raw: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const c = raw as Partial<Collection> | null
  if (!c || typeof c !== 'object') return { ok: false, errors: ['not an object'], warnings }
  for (const f of ['id', 'title', 'subject', 'description'] as const) if (!isStr(c[f])) errors.push(`"${f}" is required`)
  if (c.contentType !== 'mixed' && !ITEM_TYPES.includes(c.contentType as string)) errors.push('"contentType" is invalid')
  if (!Array.isArray(c.items) || c.items.length === 0) {
    errors.push('"items" must be a non-empty array')
    return { ok: false, errors, warnings }
  }
  const seen = new Set<string>()
  c.items.forEach((item: any, i) => {
    const label = `items[${i}]${item?.id ? ` (${item.id})` : ''}`
    if (!isStr(item?.id)) return errors.push(`${label}: id is required`)
    if (seen.has(item.id)) errors.push(`${label}: duplicate id`)
    seen.add(item.id)
    if (!ITEM_TYPES.includes(item.type)) return errors.push(`${label}: unknown type "${item.type}"`)
    if (c.contentType !== 'mixed' && item.type !== c.contentType)
      warnings.push(`${label}: type "${item.type}" differs from collection contentType "${c.contentType}"`)
    if (!item.content || typeof item.content !== 'object') return errors.push(`${label}: content is required`)
    for (const p of profiles[item.type](item.content)) errors.push(`${label}: ${p}`)
    if (item.enrichment && !isStr(item.enrichment.text)) errors.push(`${label}: enrichment.text is required`)
  })
  return { ok: errors.length === 0, errors, warnings }
}
