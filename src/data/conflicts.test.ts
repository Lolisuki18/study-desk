import { describe, expect, it } from 'vitest'
import raw from './answer-conflicts.json'
import { conflictCount, conflictFor } from './conflicts'
import { collections } from './index'

const find = (collectionId: string, itemId: string) => collections.find((c) => c.id === collectionId)?.items.find((i) => i.id === itemId)

describe('answer conflicts data', () => {
  const pairs = raw as { a: { collectionId: string; itemId: string; answers: string[] }; b: { collectionId: string; itemId: string; answers: string[] } }[]

  it('lists real questions, with the answers the decks currently have (re-run import:mln131-full if this fails)', () => {
    expect(pairs.length).toBe(conflictCount)
    for (const p of pairs) {
      for (const side of [p.a, p.b]) {
        const item = find(side.collectionId, side.itemId)
        expect(item, `${side.collectionId}::${side.itemId} does not exist`).toBeDefined()
        if (item?.type !== 'multiple-choice') throw new Error('conflicts are only listed for multiple choice')
        const current = [...item.content.answer].map((k) => item.content.options.find((o) => o.key === k)!.text)
        expect(side.answers, `${side.collectionId}::${side.itemId}`).toEqual(current)
      }
    }
  })

  it('looks up both sides of a pair, and nothing else', () => {
    const p = pairs[0]
    expect(conflictFor(p.a.collectionId, p.a.itemId)).toEqual(p.b)
    expect(conflictFor(p.b.collectionId, p.b.itemId)).toEqual(p.a)
    expect(conflictFor('khong-co', 'q-1')).toBeUndefined()
  })

  it('never pairs a question with itself', () => {
    for (const p of pairs) expect(`${p.a.collectionId}::${p.a.itemId}`).not.toBe(`${p.b.collectionId}::${p.b.itemId}`)
  })
})
