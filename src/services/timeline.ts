/**
 * Historical timeline extraction.
 * Scans questions for years and groups the questions by year, oldest first.
 *
 * A question is attached to a year only when that year is part of what the question TEACHES: its stem, its correct
 * answer(s) and its explanation. Years that appear only in wrong options ("Năm nào? A. 1930 B. 1945 C. 1954") are
 * distractors and are ignored, otherwise the same question would show up under every option's year.
 */

import type { Entry, Item } from '../types'
import { previewOf } from '../utils/preview'

export interface TimelineMilestone {
  year: number
  dateStr?: string
  /** the stem of the most representative question for this year */
  title: string
  entries: Entry[]
}

export const MIN_YEAR = 1840
export const MAX_YEAR = 2040

// 4-digit years that stand alone: not part of 1.945 / 1,950 / 12345 and not followed by a unit ("1900 km", "2000 người")
const YEAR_REGEX = /(?<![\d.,])\b((?:18|19|20)\d{2})\b(?![.,]\d)(?!\s*(?:%|km|kg|m²|đồng|VNĐ|USD|người|tấn|ha\b|hecta|triệu|tỷ))/g
const FULL_DATE_REGEX = /\b(\d{1,2}[/-]\d{1,2}[/-](?:18|19|20)\d{2})\b/
const MONTH_YEAR_REGEX = /tháng\s+(\d{1,2})\s+(?:năm\s+)?((?:18|19|20)\d{2})/i

/** The statement and the supporting facts of an item, with the wrong material left out. */
export function timelineText(item: Item): { main: string; facts: string } {
  switch (item.type) {
    case 'multiple-choice': {
      const p = previewOf(item)
      return { main: p.q, facts: `${p.a} ${p.exp ?? ''}` }
    }
    case 'true-false':
      // a false statement may carry a wrong date: only its explanation can be trusted
      return item.content.answer ? { main: item.content.statement, facts: item.content.explanation ?? '' } : { main: '', facts: item.content.explanation ?? '' }
    case 'theory':
    case 'programming':
      return { main: item.content.concept, facts: `${item.content.definition} ${item.content.explanation ?? ''}` }
    case 'vocabulary':
      return { main: item.content.term, facts: `${item.content.meaning} ${item.content.example ?? ''}` }
  }
}

const yearsIn = (s: string) => [...s.matchAll(YEAR_REGEX)].map((m) => Number(m[1])).filter((y) => y >= MIN_YEAR && y <= MAX_YEAR)

/** Extract and sort chronological milestones from a list of entries. */
export function extractTimelineMilestones(entries: Entry[]): TimelineMilestone[] {
  const map = new Map<number, { dateStr?: string; entries: Entry[]; seen: Set<string>; titles: { text: string; inStem: boolean }[] }>()

  for (const e of entries) {
    const { main, facts } = timelineText(e.item)
    const combined = `${main} ${facts}`
    const years = new Set(yearsIn(combined))
    if (!years.size) continue
    const itemKey = `${e.collection.id}::${e.item.id}`
    const stemYears = new Set(yearsIn(main))

    for (const year of years) {
      let dateStr: string | undefined
      const full = combined.match(new RegExp(FULL_DATE_REGEX.source.replace('(?:18|19|20)\\d{2}', String(year)), ''))
      if (full) dateStr = full[1]
      else {
        const my = combined.match(MONTH_YEAR_REGEX)
        if (my && Number(my[2]) === year) dateStr = `Tháng ${my[1]}/${year}`
      }

      const slot = map.get(year) ?? { entries: [], seen: new Set<string>(), titles: [] }
      if (!slot.seen.has(itemKey)) {
        slot.seen.add(itemKey)
        slot.entries.push(e)
        if (main) slot.titles.push({ text: main, inStem: stemYears.has(year) })
        if (dateStr && !slot.dateStr) slot.dateStr = dateStr
      }
      map.set(year, slot)
    }
  }

  return [...map.keys()]
    .sort((a, b) => a - b)
    .map((year) => {
      const slot = map.get(year)!
      // prefer a question that names the year in its stem: that one describes the event
      const pick = slot.titles.find((t) => t.inStem) ?? slot.titles[0]
      const first = pick?.text || `Sự kiện năm ${year}`
      return { year, dateStr: slot.dateStr, title: first.length > 90 ? first.slice(0, 87) + '...' : first, entries: slot.entries }
    })
}
