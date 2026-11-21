import type { Collection, Item, ProgressRecord } from '../types'

/**
 * Twins: the same question stored in several collections (the "Full" decks repeat the chapter banks, and community
 * banks overlap). Progress is kept per `collectionId::itemId`, so without this a question learned in one deck still
 * looks new in its twin. Two items are twins when their wording matches (ignoring diacritics, case and punctuation)
 * AND they have the same correct answer(s): a pair whose answers disagree is a conflict, not a twin, and keeps
 * separate progress.
 */

export interface ItemRef {
  collectionId: string
  itemId: string
}

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/** Same content, same signature. null for an item that has no usable text. */
export function signatureOf(item: Item): string | null {
  switch (item.type) {
    case 'multiple-choice': {
      const c = item.content
      const answers = [...c.answer].map((k) => fold(c.options.find((o) => o.key === k)?.text ?? '')).sort()
      return answers.some((a) => !a) ? null : `mc|${fold(c.question)}|${answers.join('|')}`
    }
    case 'true-false':
      return `tf|${fold(item.content.statement)}|${item.content.answer}`
    case 'theory':
    case 'programming':
      return `th|${fold(item.content.concept)}|${fold(item.content.definition)}`
    case 'vocabulary':
      return `vo|${fold(item.content.term)}|${fold(item.content.meaning)}`
  }
}

export const refKey = (r: ItemRef) => `${r.collectionId}::${r.itemId}`

/** key → every OTHER item with the same content. Items without a twin are absent. */
export type TwinIndex = Map<string, ItemRef[]>

export function buildTwinIndex(collections: Collection[]): TwinIndex {
  const groups = new Map<string, ItemRef[]>()
  for (const c of collections) {
    for (const item of c.items) {
      const sig = signatureOf(item)
      if (!sig) continue
      const list = groups.get(sig)
      const ref = { collectionId: c.id, itemId: item.id }
      if (list) list.push(ref)
      else groups.set(sig, [ref])
    }
  }
  const index: TwinIndex = new Map()
  for (const list of groups.values()) {
    if (list.length < 2) continue
    for (const ref of list) index.set(refKey(ref), list.filter((r) => refKey(r) !== refKey(ref)))
  }
  return index
}

let cache: { source: Collection[]; index: TwinIndex } | null = null
/** The twin index of `collections`, rebuilt only when the list itself changes (an upload or a restore). */
export function getTwinIndex(collections: Collection[]): TwinIndex {
  if (!cache || cache.source !== collections) cache = { source: collections, index: buildTwinIndex(collections) }
  return cache.index
}

/** how many groups of twins, and how many items belong to one */
export function twinStats(index: TwinIndex): { groups: number; items: number } {
  const seen = new Set<string>()
  let groups = 0
  for (const [key, others] of index) {
    if (seen.has(key)) continue
    groups++
    seen.add(key)
    others.forEach((o) => seen.add(refKey(o)))
  }
  return { groups, items: index.size }
}

const rank = (p?: ProgressRecord) => (p && p.lastStudied ? p.level * 1e15 + new Date(p.lastStudied).getTime() : -1)

/**
 * One-off catch-up for progress made before twins were shared: every twin takes the schedule of the member that is
 * furthest along (highest box, then most recent). Counters of right / wrong answers are kept as they are.
 * Returns only the records that change.
 */
export function planTwinSync(progress: Map<string, ProgressRecord>, index: TwinIndex): ProgressRecord[] {
  const changes: ProgressRecord[] = []
  const done = new Set<string>()
  for (const [key, others] of index) {
    if (done.has(key)) continue
    const members = [{ key, ref: parse(key) }, ...others.map((o) => ({ key: refKey(o), ref: o }))]
    members.forEach((m) => done.add(m.key))
    const best = members.map((m) => progress.get(m.key)).reduce<ProgressRecord | undefined>((a, b) => (rank(b) > rank(a) ? b : a), undefined)
    if (!best || !best.lastStudied) continue
    for (const m of members) {
      const own = progress.get(m.key)
      // only a twin that is behind (never studied, or in a lower box) is raised; one already as far along is left alone
      if (own && own.lastStudied && own.level >= best.level) continue
      changes.push({
        key: m.key,
        collectionId: m.ref.collectionId,
        itemId: m.ref.itemId,
        review: own?.review ?? false,
        correct: own?.correct ?? 0,
        incorrect: own?.incorrect ?? 0,
        status: best.status,
        level: best.level,
        lastStudied: best.lastStudied,
        nextReview: best.nextReview,
        lastResult: best.lastResult,
      })
    }
  }
  return changes
}

function parse(key: string): ItemRef {
  const i = key.indexOf('::')
  return { collectionId: key.slice(0, i), itemId: key.slice(i + 2) }
}
