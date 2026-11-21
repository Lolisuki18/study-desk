import type { Entry } from '../types'
import { sameKeys } from '../utils/answers'

/** Survival mode rules, kept out of the page so they can be tested. */
export const QUESTION_TIME_LIMIT = 15 // seconds per question
export const MAX_LIVES = 3

const HIGH_SCORE_KEY = 'psh.survival.highscore'

export function getSavedHighScore(): number {
  try {
    return Number(localStorage.getItem(HIGH_SCORE_KEY) ?? '0') || 0
  } catch {
    return 0
  }
}

/** Keep the best score only. */
export function saveHighScore(score: number): void {
  try {
    if (score > getSavedHighScore()) {
      localStorage.setItem(HIGH_SCORE_KEY, String(score))
      window.dispatchEvent(new CustomEvent('survival-highscore-changed'))
    }
  } catch {
    /* ignore */
  }
}

/** A right answer is exactly the right set of options: for a select-all question one correct letter is not enough. */
export const isSurvivalCorrect = (picked: string, answer: string) => picked !== '' && sameKeys(picked, answer)

/**
 * Points for a right answer. Base: 2 per second left (at least 10). Combo: 5 more for every right answer already in a
 * row, up to 50, so a long streak is worth more than a lucky single answer.
 */
export function pointsFor(timeLeft: number, comboBefore: number): { base: number; bonus: number; total: number } {
  const base = Math.max(10, timeLeft * 2)
  const bonus = Math.min(Math.max(comboBefore, 0), 10) * 5
  return { base, bonus, total: base + bonus }
}

const questionKey = (e: Entry) => (e.item.type === 'multiple-choice' ? e.item.content.question.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim() : '')

/**
 * Multiple-choice questions to draw from, one per distinct question text. Several decks repeat the same bank, and
 * standalone decks are copies of other decks by design, so those only add questions nobody else has.
 */
export function buildSurvivalPool(entries: Entry[]): Entry[] {
  const mcs = entries.filter((e) => e.item.type === 'multiple-choice')
  const seen = new Set<string>()
  const out: Entry[] = []
  for (const standalonePass of [false, true]) {
    for (const e of mcs) {
      if (!!e.collection.standalone !== standalonePass) continue
      const k = questionKey(e)
      if (!k || seen.has(k)) continue
      seen.add(k)
      out.push(e)
    }
  }
  return out
}
