/**
 * Historical Timeline Extraction Service.
 * Scans questions and answers for date/year milestones and groups them chronologically.
 */

import type { Entry } from '../types'
import { itemTitle } from '../data'

export interface TimelineMilestone {
  year: number
  dateStr?: string
  title: string
  entries: Entry[]
}

const YEAR_REGEX = /\b(18\d{2}|19\d{2}|20\d{2})\b/g
const FULL_DATE_REGEX = /\b(\d{1,2}[/-]\d{1,2}[/-](?:18|19|20)\d{2})\b/
const MONTH_YEAR_REGEX = /tháng\s+(\d{1,2})\s+(?:năm\s+)?((?:18|19|20)\d{2})/i

/**
 * Extracts and sorts chronological milestones from a list of entries.
 */
export function extractTimelineMilestones(entries: Entry[]): TimelineMilestone[] {
  const map = new Map<number, { dateStr?: string; entries: Entry[]; titles: string[] }>()

  entries.forEach((e) => {
    const text = itemTitle(e.item)
    const extra =
      e.item.type === 'multiple-choice'
        ? e.item.content.options.map((o) => o.text).join(' ') + ' ' + (e.item.content.explanation || '')
        : e.item.type === 'theory'
        ? e.item.content.definition
        : ''

    const combined = `${text} ${extra}`

    // Find all 4-digit years between 1800 and 2099
    const matches = combined.match(YEAR_REGEX)
    if (!matches) return

    // Deduplicate years within the same item
    const uniqueYears = Array.from(new Set(matches.map(Number))).filter((y) => y >= 1840 && y <= 2040)

    uniqueYears.forEach((year) => {
      // Look for more specific date string in prompt
      let dateStr: string | undefined
      const fullDateMatch = text.match(FULL_DATE_REGEX)
      if (fullDateMatch && fullDateMatch[1].endsWith(String(year))) {
        dateStr = fullDateMatch[1]
      } else {
        const myMatch = text.match(MONTH_YEAR_REGEX)
        if (myMatch && Number(myMatch[2]) === year) {
          dateStr = `Tháng ${myMatch[1]}/${year}`
        }
      }

      const existing = map.get(year) ?? { entries: [], titles: [] }
      // Avoid duplicate entry in same year
      if (!existing.entries.some((x) => x.item.id === e.item.id && x.collection.id === e.collection.id)) {
        existing.entries.push(e)
        existing.titles.push(text)
        if (dateStr && !existing.dateStr) {
          existing.dateStr = dateStr
        }
      }
      map.set(year, existing)
    })
  })

  // Convert to sorted array
  const sortedYears = Array.from(map.keys()).sort((a, b) => a - b)

  return sortedYears.map((year) => {
    const item = map.get(year)!
    // Create clean summary title
    const firstTitle = item.titles[0] || `Sự kiện năm ${year}`
    const cleanTitle = firstTitle.length > 90 ? firstTitle.slice(0, 87) + '...' : firstTitle

    return {
      year,
      dateStr: item.dateStr,
      title: cleanTitle,
      entries: item.entries,
    }
  })
}
