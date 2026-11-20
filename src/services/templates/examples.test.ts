import { describe, expect, it } from 'vitest'
import type { Collection, Entry } from '../../types'
import { TEMPLATES } from './examples'
import { SLUG, validateCollection } from '../../utils/validate'
import { availableKinds, buildQuiz } from '../quiz/generate'
import { isBundledId } from '../../data'

const asEntries = (c: Collection): Entry[] => c.items.map((item) => ({ collection: c, item }))
// what the learner really gets: the sample is downloaded as a file and uploaded again
const roundTrip = (t: (typeof TEMPLATES)[number]) => JSON.parse(JSON.stringify(t.data)) as Collection

describe('JSON template library', () => {
  it('has one template per content type', () => {
    expect(TEMPLATES.map((t) => t.id).sort()).toEqual(['mixed', 'multiple-choice', 'programming', 'theory', 'true-false', 'vocabulary'])
  })

  it.each(TEMPLATES.map((t) => [t.id, t] as const))('%s passes the importer validation without errors or warnings', (_, t) => {
    const r = validateCollection(roundTrip(t))
    expect(r.errors).toEqual([])
    expect(r.warnings).toEqual([])
  })

  it('uses unique, well-formed ids that never clash with a bundled collection', () => {
    const ids = TEMPLATES.map((t) => roundTrip(t).id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(id).toMatch(SLUG)
      expect(isBundledId(id), id).toBe(false)
    }
  })

  it('every template yields a playable quiz', () => {
    for (const t of TEMPLATES) {
      const c = roundTrip(t)
      const entries = asEntries(c)
      const kinds = availableKinds(entries)
      const qs = buildQuiz(entries, { count: entries.length, kinds, randomize: false, distractorPool: entries })
      expect(qs.length, t.id).toBeGreaterThan(0)
    }
  })

  it('the theory and programming samples are big enough for the matching exercise their description promises', () => {
    for (const id of ['theory', 'programming']) {
      const c = roundTrip(TEMPLATES.find((t) => t.id === id)!)
      expect(c.items.length, id).toBeGreaterThanOrEqual(4)
      expect(availableKinds(asEntries(c)), id).toEqual(expect.arrayContaining(['match', 'mc', 'short']))
    }
  })

  it('answers of the multiple-choice sample point at real options (including the select-all one)', () => {
    const c = roundTrip(TEMPLATES.find((t) => t.id === 'multiple-choice')!)
    const answers = c.items.map((i) => (i.type === 'multiple-choice' ? i.content.answer : ''))
    expect(answers).toEqual(['A', 'ABC'])
  })
})

describe('importer validation rules', () => {
  const base = () => roundTrip(TEMPLATES[0])

  it('requires a hyphenated lowercase collection id', () => {
    for (const bad of ['Triết học 1', 'triet hoc', 'Triet-Hoc', '-x', 'x-', 'a--b']) {
      const c = { ...base(), id: bad }
      expect(validateCollection(c).errors.join(' '), bad).toContain('"id" must use lowercase')
    }
    expect(validateCollection({ ...base(), id: 'triet-hoc-chuong-1' }).ok).toBe(true)
  })

  it('rejects an item id containing "::" (progress keys are collectionId::itemId)', () => {
    const c = base()
    c.items[0] = { ...c.items[0], id: 'a::b' }
    expect(validateCollection(c).errors.join(' ')).toContain('must not contain "::"')
  })

  it('knows which ids ship with the app', () => {
    expect(isBundledId('cnxhkh-mln131-full')).toBe(true)
    expect(isBundledId('khong-co-bo-nay')).toBe(false)
  })
})
