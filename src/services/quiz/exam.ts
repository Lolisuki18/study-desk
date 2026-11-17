import type { Collection, Entry } from '../../types'
import { shuffle } from '../../utils'

/** id under which a whole-subject mock exam is stored in the exam history */
export const subjectExamId = (subject: string) => `subject:${subject}`

/** "Chương 3" when the collection title names a chapter, otherwise the whole title. */
export const chapterLabel = (c: Collection) => c.title.match(/Chương\s+\d+/i)?.[0] ?? c.title

/** Group entries by chapter (collections of the same chapter, e.g. a chapter and its extra bank, are merged). */
export function chapterGroups(entries: Entry[]): { label: string; entries: Entry[] }[] {
  const map = new Map<string, Entry[]>()
  for (const e of entries) {
    const label = chapterLabel(e.collection)
    const list = map.get(label)
    if (list) list.push(e)
    else map.set(label, [e])
  }
  return [...map]
    .map(([label, list]) => ({ label, entries: list }))
    .sort((a, b) => a.label.localeCompare(b.label, 'vi', { numeric: true }))
}

/**
 * Split `count` questions over groups in proportion to their sizes (largest-remainder method).
 * Never asks a group for more than it has; the result sums to min(count, total).
 */
export function allocate(sizes: number[], count: number): number[] {
  const total = sizes.reduce((s, n) => s + n, 0)
  const want = Math.max(0, Math.min(count, total))
  if (!total) return sizes.map(() => 0)
  const quotas = sizes.map((n) => (want * n) / total)
  const out = quotas.map(Math.floor)
  let left = want - out.reduce((s, n) => s + n, 0)
  const order = quotas.map((q, i) => ({ i, frac: q - Math.floor(q) })).sort((a, b) => b.frac - a.frac || sizes[b.i] - sizes[a.i])
  for (const { i } of order) {
    if (!left) break
    if (out[i] < sizes[i]) {
      out[i]++
      left--
    }
  }
  return out
}

/** Draw a mock exam: random questions, each chapter represented in proportion to its size. */
export function sampleExam(entries: Entry[], count: number): Entry[] {
  const groups = chapterGroups(entries)
  const alloc = allocate(groups.map((g) => g.entries.length), count)
  return shuffle(groups.flatMap((g, i) => shuffle(g.entries).slice(0, alloc[i])))
}
