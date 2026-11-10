import type { ProgressRecord } from '../../types'

/** Leitner boxes. Index = box level, value = days until next review after reaching that box. */
export const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30]
export const MAX_LEVEL = INTERVAL_DAYS.length - 1
/** Mastered = marked known / answered correctly in 2 separate rounds in a row (box 2+). */
export const MASTERED_LEVEL = 2

const DAY = 86_400_000

export function emptyProgress(collectionId: string, itemId: string): ProgressRecord {
  return {
    key: `${collectionId}::${itemId}`,
    collectionId,
    itemId,
    status: 'new',
    review: false,
    correct: 0,
    incorrect: 0,
    level: 0,
  }
}

/** Apply a right / wrong outcome using Leitner rules. Pure function. */
export function applyResult(
  p: ProgressRecord,
  correct: boolean,
  opts: { now?: Date; clearReview?: boolean } = {},
): ProgressRecord {
  const now = opts.now ?? new Date()
  if (correct) {
    const level = Math.min(MAX_LEVEL, p.level + 1)
    return {
      ...p,
      status: 'known',
      level,
      correct: p.correct + 1,
      lastResult: 'correct',
      lastStudied: now.toISOString(),
      nextReview: new Date(now.getTime() + INTERVAL_DAYS[level] * DAY).toISOString(),
      review: opts.clearReview ? false : p.review,
    }
  }
  return {
    ...p,
    status: 'unknown',
    level: 1,
    incorrect: p.incorrect + 1,
    lastResult: 'incorrect',
    lastStudied: now.toISOString(),
    nextReview: now.toISOString(), // due right away
  }
}

export const isMastered = (p?: ProgressRecord) => !!p && p.status === 'known' && p.level >= MASTERED_LEVEL
export const isDue = (p?: ProgressRecord, now = new Date()) =>
  !!p && p.level > 0 && !!p.nextReview && new Date(p.nextReview).getTime() <= now.getTime()
export const isStudied = (p?: ProgressRecord) => !!p && !!p.lastStudied

export type ReviewReason = 'unknown' | 'incorrect' | 'marked' | 'due'

export function reviewReasons(p?: ProgressRecord, now = new Date()): ReviewReason[] {
  if (!p) return []
  const r: ReviewReason[] = []
  if (p.status === 'unknown') r.push('unknown')
  if (p.lastResult === 'incorrect') r.push('incorrect')
  if (p.review) r.push('marked')
  if (isDue(p, now) && !isMastered(p)) r.push('due')
  return r
}

/** Higher = more urgent. Difficult, overdue items first. */
export function priority(p: ProgressRecord, now = new Date()): number {
  let s = p.incorrect * 2 - p.correct + (MAX_LEVEL - p.level)
  if (p.status === 'unknown') s += 3
  if (p.review) s += 2
  if (p.lastResult === 'incorrect') s += 2
  if (p.nextReview) s += Math.max(0, Math.min(10, (now.getTime() - new Date(p.nextReview).getTime()) / DAY))
  return s
}
