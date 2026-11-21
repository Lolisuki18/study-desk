import type { Entry, ProgressRecord } from '../types'
import { shuffle } from '../utils'
import { recallChance } from './readiness'

export interface DrillPlan {
  /** the questions to drill, weakest first */
  entries: Entry[]
  /** of the chosen questions: never studied / answered wrong last time / the rest */
  unseen: number
  missed: number
  other: number
}

/**
 * The questions of a chapter you are least likely to get right today: never-studied ones and ones you got wrong
 * come before ones you know. Equal chances are shuffled, so a repeated drill is not always the same list.
 */
export function pickWeakest(
  entries: Entry[],
  progress: (collectionId: string, itemId: string) => ProgressRecord | undefined,
  count: number,
): DrillPlan {
  const scored = shuffle(entries).map((e) => {
    const p = progress(e.collection.id, e.item.id)
    return { e, p, chance: recallChance(e.item, p) }
  })
  scored.sort((a, b) => a.chance - b.chance)
  const chosen = scored.slice(0, Math.max(0, count))
  return {
    entries: chosen.map((x) => x.e),
    unseen: chosen.filter((x) => !x.p?.lastStudied).length,
    missed: chosen.filter((x) => x.p?.lastStudied && (x.p.lastResult === 'incorrect' || x.p.status === 'unknown')).length,
    other: chosen.filter((x) => x.p?.lastStudied && x.p.lastResult !== 'incorrect' && x.p.status !== 'unknown').length,
  }
}
