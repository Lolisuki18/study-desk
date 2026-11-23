/**
 * Helper services and data aggregators for IELTS & English learning.
 */

import { getLoadedCollections } from '../../data'
import type { Collection, Entry, Item, VocabularyContent } from '../../types'

export type IeltsBandTarget = '6.0' | '6.5' | '7.0' | '7.5' | '8.0+'

const IELTS_TARGET_KEY = 'psh.ielts.target_band'
const SPELLING_MISTAKES_KEY = 'psh.ielts.spelling_mistakes'

export interface SpellingMistakeRecord {
  term: string
  meaning: string
  wrongAttempts: string[]
  lastWrongAt: string
  failCount: number
}

export function getIeltsTargetBand(): IeltsBandTarget {
  try {
    return (localStorage.getItem(IELTS_TARGET_KEY) as IeltsBandTarget) || '7.0'
  } catch {
    return '7.0'
  }
}

export function setIeltsTargetBand(band: IeltsBandTarget): void {
  try {
    localStorage.setItem(IELTS_TARGET_KEY, band)
  } catch {}
}

export function isEnglishCollection(c: Collection): boolean {
  const s = (c.subject + ' ' + c.title + ' ' + c.id).toLowerCase()
  return (
    s.includes('tiếng anh') ||
    s.includes('english') ||
    s.includes('ielts') ||
    s.includes('oxford') ||
    s.includes('toeic') ||
    c.contentType === 'vocabulary'
  )
}

export function getEnglishCollections(): Collection[] {
  return getLoadedCollections().filter(isEnglishCollection)
}

export function getEnglishEntries(): Entry[] {
  const cols = getEnglishCollections()
  const entries: Entry[] = []
  for (const c of cols) {
    for (const item of c.items) {
      if (item.type === 'vocabulary') {
        entries.push({ collection: c, item })
      }
    }
  }
  return entries
}

export interface CollocationPair {
  id: string
  collocation: string
  term: string
  meaning: string
  example?: string
  collectionTitle: string
}

export function getAllCollocations(): CollocationPair[] {
  const entries = getEnglishEntries()
  const pairs: CollocationPair[] = []
  for (const e of entries) {
    if (e.item.type === 'vocabulary' && e.item.content.collocations?.length) {
      for (const col of e.item.content.collocations) {
        pairs.push({
          id: `${e.item.id}::${col}`,
          collocation: col,
          term: e.item.content.term,
          meaning: e.item.content.meaning,
          example: e.item.content.example,
          collectionTitle: e.collection.title,
        })
      }
    }
  }
  return pairs
}

export function getSpellingMistakes(): SpellingMistakeRecord[] {
  try {
    const raw = localStorage.getItem(SPELLING_MISTAKES_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SpellingMistakeRecord[]
  } catch {
    return []
  }
}

export function recordSpellingMistake(term: string, typed: string, meaning: string): void {
  try {
    const list = getSpellingMistakes()
    const existing = list.find((m) => m.term.toLowerCase() === term.toLowerCase())
    const now = new Date().toISOString()
    if (existing) {
      existing.failCount++
      existing.lastWrongAt = now
      if (!existing.wrongAttempts.includes(typed)) {
        existing.wrongAttempts.push(typed)
      }
    } else {
      list.unshift({
        term,
        meaning,
        wrongAttempts: [typed],
        lastWrongAt: now,
        failCount: 1,
      })
    }
    localStorage.setItem(SPELLING_MISTAKES_KEY, JSON.stringify(list.slice(0, 100)))
  } catch {}
}

export function removeSpellingMistake(term: string): void {
  try {
    const list = getSpellingMistakes().filter((m) => m.term.toLowerCase() !== term.toLowerCase())
    localStorage.setItem(SPELLING_MISTAKES_KEY, JSON.stringify(list))
  } catch {}
}
