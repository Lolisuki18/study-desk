/**
 * In-text highlights, stored per text field of an item.
 *
 * A highlight is a character range (`start`, `end`) of one string, plus the snippet it covered. The snippet lets a
 * highlight survive an edit of the source text (it is searched again, nearest to the old position) and be dropped
 * when the words are gone, instead of painting the wrong letters.
 *
 * Storage key = `${collectionId}::${itemId}#${field}`: the question and the explanation of the same item are
 * separate texts, so a range in one must never colour the other.
 */

export type HighlightColor = 'yellow' | 'green' | 'orange' | 'pink'
export type HighlightField = 'q' | 'e'

export interface TextHighlight {
  id: string
  start: number
  end: number
  /** the covered text, kept to validate / relocate the range */
  text: string
  color: HighlightColor
  createdAt: string
}

export type HighlightsMap = Record<string, TextHighlight[]>

const STORAGE_KEY = 'psh.text_highlights'

export const highlightKey = (itemKey: string, field: HighlightField) => `${itemKey}#${field}`

// ---------------------------------------------------------------------------------------------- pure range logic

export interface ResolvedHighlight {
  start: number
  end: number
  highlight: TextHighlight
}

/**
 * Turn stored highlights into valid, non-overlapping ranges of `text`.
 * A range whose snippet no longer sits at its position is searched again (nearest match); if the words are gone the
 * highlight is dropped. When two ranges overlap the earlier one wins.
 */
export function resolveHighlights(text: string, list: TextHighlight[]): ResolvedHighlight[] {
  const found: ResolvedHighlight[] = []
  for (const h of list) {
    if (!h.text || typeof h.start !== 'number') continue
    if (text.slice(h.start, h.end) === h.text) {
      found.push({ start: h.start, end: h.end, highlight: h })
      continue
    }
    let best = -1
    for (let i = text.indexOf(h.text); i >= 0; i = text.indexOf(h.text, i + 1)) {
      if (best < 0 || Math.abs(i - h.start) < Math.abs(best - h.start)) best = i
    }
    if (best >= 0) found.push({ start: best, end: best + h.text.length, highlight: h })
  }
  found.sort((a, b) => a.start - b.start || b.end - a.end)
  const out: ResolvedHighlight[] = []
  for (const r of found) if (!out.length || r.start >= out[out.length - 1].end) out.push(r)
  return out
}

export interface Segment {
  text: string
  highlight?: TextHighlight
}

/** Cut `text` into plain and highlighted pieces, in order. Joining the pieces gives `text` back. */
export function segmentText(text: string, list: TextHighlight[]): Segment[] {
  const out: Segment[] = []
  let pos = 0
  for (const r of resolveHighlights(text, list)) {
    if (r.start > pos) out.push({ text: text.slice(pos, r.start) })
    out.push({ text: text.slice(r.start, r.end), highlight: r.highlight })
    pos = r.end
  }
  if (pos < text.length) out.push({ text: text.slice(pos) })
  return out.length ? out : [{ text }]
}

/** `list` with `h` added; any existing highlight that overlaps its range is replaced (colour changes work this way). */
export function withHighlight(list: TextHighlight[], h: TextHighlight): TextHighlight[] {
  return [...list.filter((x) => x.end <= h.start || x.start >= h.end), h].sort((a, b) => a.start - b.start)
}

// ---------------------------------------------------------------------------------------------- storage

let cache: HighlightsMap | null = null

function load(): HighlightsMap {
  if (cache) return cache
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    cache = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  } catch {
    cache = {}
  }
  return cache ?? {}
}

function save(map: HighlightsMap): void {
  cache = map
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* storage full or blocked: highlights then last until the page closes */
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('highlights-changed'))
}

export function getHighlights(key: string): TextHighlight[] {
  return (load()[key] ?? []).filter((h) => typeof h.start === 'number' && typeof h.end === 'number')
}

export function addHighlight(key: string, start: number, end: number, text: string, color: HighlightColor): TextHighlight {
  const h: TextHighlight = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    start,
    end,
    text,
    color,
    createdAt: new Date().toISOString(),
  }
  save({ ...load(), [key]: withHighlight(getHighlights(key), h) })
  return h
}

export function removeHighlight(key: string, highlightId: string): void {
  const map = { ...load() }
  const rest = (map[key] ?? []).filter((h) => h.id !== highlightId)
  if (rest.length) map[key] = rest
  else delete map[key]
  save(map)
}

/** Everything, for the backup file. */
export const getAllHighlights = (): HighlightsMap => ({ ...load() })

/** Replace everything (restore from a backup). */
export function replaceAllHighlights(map: HighlightsMap): void {
  save(map && typeof map === 'object' ? { ...map } : {})
}

export const HIGHLIGHT_COLORS: { id: HighlightColor; label: string; bgClass: string; dotClass: string }[] = [
  { id: 'yellow', label: 'Vàng chanh', bgClass: 'bg-amber-200/80 dark:bg-amber-500/30 text-amber-950 dark:text-amber-100 rounded px-0.5', dotClass: 'bg-amber-400 border-amber-500' },
  { id: 'green', label: 'Xanh ngọc', bgClass: 'bg-emerald-200/80 dark:bg-emerald-500/30 text-emerald-950 dark:text-emerald-100 rounded px-0.5', dotClass: 'bg-emerald-400 border-emerald-500' },
  { id: 'orange', label: 'Cam pastel', bgClass: 'bg-orange-200/80 dark:bg-orange-500/30 text-orange-950 dark:text-orange-100 rounded px-0.5', dotClass: 'bg-orange-400 border-orange-500' },
  { id: 'pink', label: 'Hồng phấn', bgClass: 'bg-pink-200/80 dark:bg-pink-500/30 text-pink-950 dark:text-pink-100 rounded px-0.5', dotClass: 'bg-pink-400 border-pink-500' },
]
