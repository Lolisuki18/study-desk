import { describe, expect, it } from 'vitest'
import { highlightKey, resolveHighlights, segmentText, withHighlight, type TextHighlight } from './highlights'

const hl = (id: string, text: string, start: number, color: TextHighlight['color'] = 'yellow'): TextHighlight => ({ id, text, start, end: start + text.length, color, createdAt: '' })

describe('highlight ranges', () => {
  const text = 'Đảng ra đời năm 1930. Đảng lãnh đạo cách mạng.'

  it('colours only the selected occurrence, not every copy of the same words', () => {
    const second = text.indexOf('Đảng', 5)
    const segs = segmentText(text, [hl('a', 'Đảng', second)])
    expect(segs.filter((s) => s.highlight).map((s) => s.text)).toEqual(['Đảng'])
    expect(segs.map((s) => s.text).join('')).toBe(text)
    expect(segs[0].highlight).toBeUndefined() // the first "Đảng" stays plain
  })

  it('always gives back the original text when the pieces are joined', () => {
    const segs = segmentText(text, [hl('a', 'năm 1930', 11), hl('b', 'cách mạng', 35)])
    expect(segs.map((s) => s.text).join('')).toBe(text)
    expect(segs.filter((s) => s.highlight).map((s) => s.text)).toEqual(['năm 1930', 'cách mạng'])
  })

  it('moves a highlight to the nearest match when the text changed, and drops it when the words are gone', () => {
    const edited = 'Mở đầu. ' + text
    const moved = resolveHighlights(edited, [hl('a', 'năm 1930', 11)])
    expect(edited.slice(moved[0].start, moved[0].end)).toBe('năm 1930')
    expect(resolveHighlights('Nội dung khác hẳn', [hl('a', 'năm 1930', 11)])).toEqual([])
  })

  it('keeps the earlier of two overlapping ranges', () => {
    const r = resolveHighlights(text, [hl('late', 'đời năm', 8), hl('early', 'ra đời', 5)])
    expect(r).toHaveLength(1)
    expect(r[0].highlight.id).toBe('early')
  })

  it('ignores malformed stored entries', () => {
    const bad = { id: 'x', text: '', start: 0, end: 0, color: 'yellow', createdAt: '' } as TextHighlight
    const legacy = { id: 'y', text: 'Đảng', color: 'yellow', createdAt: '' } as unknown as TextHighlight
    expect(resolveHighlights(text, [bad, legacy])).toEqual([])
    expect(segmentText(text, [bad, legacy])).toEqual([{ text }])
  })

  it('replaces an overlapping highlight, which is how a colour change works', () => {
    const list = [hl('a', 'năm 1930', 11), hl('keep', 'cách mạng', 35)]
    const next = withHighlight(list, { ...hl('b', 'năm 1930', 11, 'pink') })
    expect(next.map((h) => h.id)).toEqual(['b', 'keep'])
    expect(next[0].color).toBe('pink')
    // a range that only touches the old one does not remove it
    expect(withHighlight([hl('a', 'ra đời', 5)], hl('b', ' năm', 11)).map((h) => h.id)).toEqual(['a', 'b'])
  })

  it('keeps the question and the explanation of one item apart', () => {
    expect(highlightKey('c::q-001', 'q')).not.toBe(highlightKey('c::q-001', 'e'))
  })
})
