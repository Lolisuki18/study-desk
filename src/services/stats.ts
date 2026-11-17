import type { ActivityRecord, ProgressRecord } from '../types'
import { dayKey } from '../utils'

const DAY = 86_400_000
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const parseKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

export interface DayStat {
  /** answers given that day */
  answers: number
  correct: number
  /** distinct items touched that day */
  items: Set<string>
}

/** Activity grouped by local calendar day (key YYYY-MM-DD). */
export function dailyActivity(activity: ActivityRecord[]): Map<string, DayStat> {
  const map = new Map<string, DayStat>()
  for (const a of activity) {
    const k = dayKey(a.ts)
    let d = map.get(k)
    if (!d) map.set(k, (d = { answers: 0, correct: 0, items: new Set() }))
    d.answers++
    if (a.result === 'correct') d.correct++
    d.items.add(`${a.collectionId}::${a.itemId}`)
  }
  return map
}

/**
 * Study streaks in days. `current` counts back from today; a day not studied yet today does not break
 * the streak (it still counts from yesterday).
 */
export function streaks(days: Iterable<string>, today = new Date()): { current: number; longest: number } {
  const set = new Set(days)
  let current = 0
  let d = startOfDay(today)
  if (!set.has(dayKey(d))) d = addDays(d, -1)
  while (set.has(dayKey(d))) {
    current++
    d = addDays(d, -1)
  }
  let longest = 0
  let run = 0
  let prev: Date | null = null
  for (const k of [...set].sort()) {
    const cur = parseKey(k)
    run = prev && Math.round((cur.getTime() - prev.getTime()) / DAY) === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
    prev = cur
  }
  return { current, longest }
}

/** How many cards fall due on each of the next `days` days. Index 0 = today, including everything overdue. */
export function dueForecast(progress: Iterable<ProgressRecord>, days = 7, now = new Date()): number[] {
  const out = Array.from({ length: days }, () => 0)
  const today = startOfDay(now).getTime()
  for (const p of progress) {
    if (!p.nextReview || p.level <= 0) continue
    const idx = Math.max(0, Math.round((startOfDay(new Date(p.nextReview)).getTime() - today) / DAY))
    if (idx < days) out[idx]++
  }
  return out
}

/** Right / total answers per collection, from the activity log. */
export function accuracyByCollection(activity: ActivityRecord[]): Map<string, { correct: number; total: number }> {
  const map = new Map<string, { correct: number; total: number }>()
  for (const a of activity) {
    let s = map.get(a.collectionId)
    if (!s) map.set(a.collectionId, (s = { correct: 0, total: 0 }))
    s.total++
    if (a.result === 'correct') s.correct++
  }
  return map
}

/** Two answers further apart than this belong to different study sittings. */
const MAX_GAP_MS = 5 * 60_000

/**
 * Estimated study time per day, in minutes. There is no stopwatch: the time is the sum of the gaps
 * between consecutive answers on the same day (gaps over 5 minutes are treated as a break and ignored),
 * plus the recorded duration of mock exams, whose answers are all saved at once when the exam ends.
 */
export function studyMinutesByDay(activity: { ts: string }[], exams: { ts: string; durationSec: number }[] = []): Map<string, number> {
  const ms = new Map<string, number>()
  const add = (k: string, v: number) => ms.set(k, (ms.get(k) ?? 0) + v)
  const times = activity.map((a) => new Date(a.ts).getTime()).sort((a, b) => a - b)
  for (let i = 1; i < times.length; i++) {
    const gap = times[i] - times[i - 1]
    if (gap > 0 && gap <= MAX_GAP_MS && dayKey(new Date(times[i])) === dayKey(new Date(times[i - 1]))) add(dayKey(new Date(times[i])), gap)
  }
  for (const e of exams) add(dayKey(e.ts), e.durationSec * 1000)
  return new Map([...ms].map(([k, v]) => [k, Math.round(v / 60_000)]))
}

export const fmtMinutes = (m: number) => (m < 60 ? `${m} phút` : `${Math.floor(m / 60)} giờ ${m % 60} phút`)
