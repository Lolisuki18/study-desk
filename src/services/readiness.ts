import type { Entry, Item, ProgressRecord } from '../types'
import { chapterGroups } from './quiz/exam'

/**
 * Rough chance of answering a studied card right in an exam, by Leitner box (index = box).
 * These are plain assumptions, not measured values: a card in a higher box has been recalled
 * correctly more times in a row over longer gaps.
 */
export const RECALL_BY_BOX = [0, 0.6, 0.75, 0.85, 0.92, 0.96]
/** A card whose latest answer was wrong. */
export const RECALL_AFTER_WRONG = 0.4

/** Chance of guessing an unseen question: one in the number of options for single-answer multiple choice. */
export function guessChance(item: Item): number {
  if (item.type === 'multiple-choice') return item.content.answer.length === 1 ? 1 / Math.max(2, item.content.options.length) : 0.1
  if (item.type === 'true-false') return 0.5
  return 0.25
}

/** Estimated probability of answering this item right today. */
export function recallChance(item: Item, p?: ProgressRecord): number {
  if (!p || !p.lastStudied || p.level <= 0) return guessChance(item)
  if (p.lastResult === 'incorrect' || p.status === 'unknown') return RECALL_AFTER_WRONG
  return RECALL_BY_BOX[Math.min(p.level, RECALL_BY_BOX.length - 1)]
}

export interface ChapterReadiness {
  label: string
  total: number
  studied: number
  /** expected score on a 10-point scale for questions drawn from this chapter */
  score10: number
  /** points (out of 10, for the whole exam) lost in this chapter compared with knowing it perfectly */
  lost10: number
}

export interface Readiness {
  total: number
  studied: number
  /** expected exam score on a 10-point scale, assuming questions are drawn evenly from the whole bank */
  score10: number
  /** chapters, the one costing the most points first */
  chapters: ChapterReadiness[]
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** Expected exam score for a set of entries (normally one subject), with a per-chapter breakdown. */
export function estimateReadiness(entries: Entry[], progress: (collectionId: string, itemId: string) => ProgressRecord | undefined): Readiness {
  let sum = 0
  let studied = 0
  const chapters = chapterGroups(entries).map((g) => {
    let s = 0
    let st = 0
    for (const e of g.entries) {
      const p = progress(e.collection.id, e.item.id)
      s += recallChance(e.item, p)
      if (p?.lastStudied) st++
    }
    sum += s
    studied += st
    return { label: g.label, total: g.entries.length, studied: st, sum: s }
  })
  const total = entries.length
  return {
    total,
    studied,
    score10: total ? round1((sum / total) * 10) : 0,
    chapters: chapters
      .map((c) => ({
        label: c.label,
        total: c.total,
        studied: c.studied,
        score10: c.total ? round1((c.sum / c.total) * 10) : 0,
        lost10: total ? round1(((c.total - c.sum) / total) * 10) : 0,
      }))
      .sort((a, b) => b.lost10 - a.lost10),
  }
}
