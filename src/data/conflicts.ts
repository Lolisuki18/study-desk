import raw from './answer-conflicts.json'

/**
 * Questions that appear in two decks with DIFFERENT answer keys. The pairs are found while the "Full" decks are
 * imported (scripts/import-mln131-full.mjs) and listed in docs/mln131-full-doi-chieu.md; this file is what the app
 * reads to warn the learner. Neither key is assumed right: only the textbook can tell.
 */
export interface ConflictSide {
  collectionId: string
  itemId: string
  /** the correct answer(s) as text */
  answers: string[]
}

const pairs = raw as { a: ConflictSide; b: ConflictSide }[]
const other = new Map<string, ConflictSide>()
for (const p of pairs) {
  other.set(`${p.a.collectionId}::${p.a.itemId}`, p.b)
  other.set(`${p.b.collectionId}::${p.b.itemId}`, p.a)
}

/** The other deck's version of this question, when the two disagree about the answer. */
export const conflictFor = (collectionId: string, itemId: string): ConflictSide | undefined => other.get(`${collectionId}::${itemId}`)

export const conflictCount = pairs.length
