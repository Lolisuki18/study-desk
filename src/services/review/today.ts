import type { Entry, ProgressRecord } from '../../types'
import { isStudied, priority, reviewReasons } from './srs'

export interface TodayPlan {
  /** cards whose Leitner interval has passed */
  due: Entry[]
  /** other cards needing review: answered wrong, marked unknown or bookmarked */
  wrong: Entry[]
  /** never-studied cards, added to reach the daily goal */
  fresh: Entry[]
}

/** Upper bound on review cards in one session, so a long backlog is spread over several sessions. */
export const REVIEW_CAP = 60
/** New cards offered when there is nothing to review and the goal is already met. */
export const BONUS_NEW = 10

/**
 * Today's study session: due cards first, then other cards needing review, then new cards until the
 * remaining daily goal is covered. New cards come from the subject with the nearest exam date first
 * (subjects without a date last), in the order they appear in the collections.
 */
export function buildToday(opts: {
  entries: Entry[]
  progress: (collectionId: string, itemId: string) => ProgressRecord | undefined
  /** items still to study today to reach the daily goal */
  goalLeft: number
  /** exam date per subject, YYYY-MM-DD */
  examDates?: Record<string, string>
  now?: Date
}): TodayPlan {
  const now = opts.now ?? new Date()
  const due: { e: Entry; p: ProgressRecord }[] = []
  const wrong: { e: Entry; p: ProgressRecord }[] = []
  const unseen: Entry[] = []
  for (const e of opts.entries) {
    const p = opts.progress(e.collection.id, e.item.id)
    const reasons = reviewReasons(p, now)
    // a card answered wrong is "due" at once, but it belongs with the wrong ones, not with scheduled reviews
    const missed = p?.lastResult === 'incorrect' || p?.status === 'unknown'
    if (p && reasons.includes('due') && !missed) due.push({ e, p })
    else if (p && reasons.length) wrong.push({ e, p })
    else if (!isStudied(p)) unseen.push(e)
  }
  const byPriority = (a: { p: ProgressRecord }, b: { p: ProgressRecord }) => priority(b.p, now) - priority(a.p, now)
  const dueOut = due.sort(byPriority).slice(0, REVIEW_CAP).map((x) => x.e)
  const wrongOut = wrong.sort(byPriority).slice(0, REVIEW_CAP - dueOut.length).map((x) => x.e)

  const reviewCount = dueOut.length + wrongOut.length
  const want = reviewCount === 0 && opts.goalLeft <= 0 ? BONUS_NEW : Math.max(0, opts.goalLeft - reviewCount)
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  // upcoming exam dates sort first (soonest first); past or missing dates last
  const rank = (subject: string) => {
    const d = opts.examDates?.[subject]
    return d && d >= today ? d : '9999'
  }
  const fresh = unseen
    .map((e, i) => ({ e, i }))
    .sort((a, b) => rank(a.e.collection.subject).localeCompare(rank(b.e.collection.subject)) || a.i - b.i)
    .slice(0, want)
    .map((x) => x.e)

  return { due: dueOut, wrong: wrongOut, fresh }
}
