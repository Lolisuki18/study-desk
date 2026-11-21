/**
 * In-text highlight storage service.
 * Persists highlighted text snippets per item key (${collectionId}::${itemId}).
 */

export type HighlightColor = 'yellow' | 'green' | 'orange' | 'pink'

export interface TextHighlight {
  id: string
  text: string
  color: HighlightColor
  createdAt: string
}

export type HighlightsMap = Record<string, TextHighlight[]>

const STORAGE_KEY = 'psh.text_highlights'

let cache: HighlightsMap | null = null

function loadCache(): HighlightsMap {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    cache = raw ? JSON.parse(raw) : {}
  } catch {
    cache = {}
  }
  return cache || {}
}

function saveCache(map: HighlightsMap): void {
  cache = map
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('highlights-changed'))
  }
}

export function getItemHighlights(key: string): TextHighlight[] {
  const map = loadCache()
  return map[key] || []
}

export function addHighlight(key: string, text: string, color: HighlightColor): TextHighlight {
  const map = { ...loadCache() }
  const existing = map[key] ? [...map[key]] : []
  const trimmed = text.trim()

  // Avoid exact duplicates
  const foundIndex = existing.findIndex((h) => h.text === trimmed)
  const item: TextHighlight = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text: trimmed,
    color,
    createdAt: new Date().toISOString(),
  }

  if (foundIndex >= 0) {
    existing[foundIndex] = item // update color
  } else {
    existing.push(item)
  }

  map[key] = existing
  saveCache(map)
  return item
}

export function removeHighlight(key: string, highlightId: string): void {
  const map = { ...loadCache() }
  if (!map[key]) return
  map[key] = map[key].filter((h) => h.id !== highlightId)
  if (map[key].length === 0) {
    delete map[key]
  }
  saveCache(map)
}

export function clearItemHighlights(key: string): void {
  const map = { ...loadCache() }
  if (map[key]) {
    delete map[key]
  }
  saveCache(map)
}

export const HIGHLIGHT_COLORS: { id: HighlightColor; label: string; bgClass: string; dotClass: string }[] = [
  {
    id: 'yellow',
    label: 'Vàng chanh',
    bgClass: 'bg-amber-200/80 dark:bg-amber-500/30 text-amber-950 dark:text-amber-100 rounded px-1',
    dotClass: 'bg-amber-400 border-amber-500',
  },
  {
    id: 'green',
    label: 'Xanh ngọc',
    bgClass: 'bg-emerald-200/80 dark:bg-emerald-500/30 text-emerald-950 dark:text-emerald-100 rounded px-1',
    dotClass: 'bg-emerald-400 border-emerald-500',
  },
  {
    id: 'orange',
    label: 'Cam pastel',
    bgClass: 'bg-orange-200/80 dark:bg-orange-500/30 text-orange-950 dark:text-orange-100 rounded px-1',
    dotClass: 'bg-orange-400 border-orange-500',
  },
  {
    id: 'pink',
    label: 'Hồng phấn',
    bgClass: 'bg-pink-200/80 dark:bg-pink-500/30 text-pink-950 dark:text-pink-100 rounded px-1',
    dotClass: 'bg-pink-400 border-pink-500',
  },
]
