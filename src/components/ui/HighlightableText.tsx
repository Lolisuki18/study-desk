import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Trash2, X } from 'lucide-react'
import {
  addHighlight,
  getHighlights,
  HIGHLIGHT_COLORS,
  highlightKey,
  removeHighlight,
  segmentText,
  type HighlightColor,
  type HighlightField,
  type TextHighlight,
} from '../../services/storage/highlights'
import { cx } from '../../utils'

interface Props {
  text: string
  /** `${collectionId}::${itemId}` */
  itemKey: string
  /** which text of the item this is: the question ('q') or the explanation ('e') */
  field?: HighlightField
  className?: string
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3'
}

interface Pending {
  start: number
  end: number
  text: string
  x: number
  y: number
  below: boolean
  /** set when the toolbar was opened by clicking an existing highlight */
  active?: TextHighlight
}

/**
 * Text you can highlight with the mouse or a finger. Select words to get a small colour toolbar; click a
 * highlight to change its colour or remove it. Highlights are kept per question / explanation and come back every
 * time the item is shown.
 */
export default function HighlightableText({ text, itemKey, field = 'q', className, as: Component = 'div' }: Props) {
  const key = highlightKey(itemKey, field)
  const wrapRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const [highlights, setHighlights] = useState<TextHighlight[]>(() => getHighlights(key))
  const [pending, setPending] = useState<Pending | null>(null)

  useEffect(() => {
    const sync = () => setHighlights(getHighlights(key))
    sync()
    setPending(null)
    window.addEventListener('highlights-changed', sync)
    return () => window.removeEventListener('highlights-changed', sync)
  }, [key])

  // The toolbar goes away when you click elsewhere, press Esc, or the selection disappears (it must never offer
  // to colour words that are no longer selected).
  useEffect(() => {
    if (!pending) return
    const onPointerDown = (e: Event) => {
      if (!barRef.current?.contains(e.target as Node)) setPending(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPending(null)
    }
    const onSelection = () => {
      if (!pending.active && window.getSelection()?.isCollapsed) setPending(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    document.addEventListener('selectionchange', onSelection)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('selectionchange', onSelection)
    }
  }, [pending])

  const place = (rect: DOMRect): Pick<Pending, 'x' | 'y' | 'below'> => {
    const wrap = wrapRef.current!.getBoundingClientRect()
    const x = Math.min(Math.max(rect.left - wrap.left + rect.width / 2, 100), Math.max(wrap.width - 100, 100))
    // above the selection, where it hides no text; underneath only when the selection is at the very top of the screen
    return rect.top > 64 ? { x, y: rect.top - wrap.top, below: false } : { x, y: rect.bottom - wrap.top, below: true }
  }

  /** Read the current selection as a character range of `text`. */
  const readSelection = () => {
    const el = textRef.current
    const sel = window.getSelection()
    if (!el || !sel || sel.rangeCount === 0 || sel.isCollapsed) return
    const range = sel.getRangeAt(0)
    if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) return
    if (el.textContent !== text) return // the DOM is not exactly this text (should not happen): do not guess offsets

    const before = document.createRange()
    before.selectNodeContents(el)
    before.setEnd(range.startContainer, range.startOffset)
    const raw = range.toString()
    const lead = raw.length - raw.trimStart().length
    const trail = raw.length - raw.trimEnd().length
    const start = before.toString().length + lead
    const end = before.toString().length + raw.length - trail
    if (end - start < 2) return
    setPending({ start, end, text: text.slice(start, end), ...place(range.getBoundingClientRect()) })
  }

  // after a touch the browser needs a moment to finish the selection
  const onSelectEnd = () => setTimeout(readSelection, 30)

  const apply = (color: HighlightColor) => {
    if (!pending) return
    addHighlight(key, pending.start, pending.end, pending.text, color)
    window.getSelection()?.removeAllRanges()
    setPending(null)
  }

  const openOn = (h: TextHighlight, el: HTMLElement) => {
    setPending({ start: h.start, end: h.end, text: h.text, active: h, ...place(el.getBoundingClientRect()) })
  }

  const segments = segmentText(text, highlights)

  return (
    <div ref={wrapRef} className="relative">
      <Component ref={textRef as never} onMouseUp={onSelectEnd} onTouchEnd={onSelectEnd} onKeyUp={(e: ReactKeyboardEvent) => e.shiftKey && onSelectEnd()} className={cx('select-text', className)}>
        {segments.map((seg, i) => {
          const h = seg.highlight
          if (!h) return seg.text
          const def = HIGHLIGHT_COLORS.find((c) => c.id === h.color) ?? HIGHLIGHT_COLORS[0]
          return (
            <mark
              key={`${h.id}-${i}`}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation() // a click on a highlight must not flip the flashcard
                openOn(h, e.currentTarget)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openOn(h, e.currentTarget)
                }
              }}
              className={cx(def.bgClass, 'cursor-pointer transition-opacity hover:opacity-85 [box-decoration-break:clone]')}
              title="Bấm để đổi màu hoặc xoá đánh dấu"
            >
              {seg.text}
            </mark>
          )
        })}
      </Component>

      {/* the toolbar lives beside the text, not inside it (a <div> in a <p> is invalid, and it would join the text) */}
      {pending && (
        <div
          ref={barRef}
          role="toolbar"
          aria-label="Đánh dấu chữ"
          style={{ left: `${pending.x}px`, top: `${pending.y}px` }}
          onMouseDown={(e) => e.preventDefault()} // keep the text selected while a colour is clicked
          onClick={(e) => e.stopPropagation()}
          className={cx(
            'absolute z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-slate-300 bg-white/95 px-2.5 py-1.5 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95',
            pending.below ? 'mt-2' : '-translate-y-full -mt-2',
          )}
        >
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => apply(c.id)}
              className={cx(
                'h-5 w-5 cursor-pointer rounded-full border border-white shadow-xs transition-transform hover:scale-125 dark:border-slate-900',
                c.dotClass,
                pending.active?.color === c.id && 'ring-2 ring-indigo-500 ring-offset-1',
              )}
              title={`Đánh dấu: ${c.label}`}
              aria-label={`Đánh dấu ${c.label}`}
            />
          ))}

          {pending.active && (
            <button
              type="button"
              onClick={() => {
                removeHighlight(key, pending.active!.id)
                setPending(null)
              }}
              className="ml-1 cursor-pointer rounded-full p-1 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
              title="Xoá đánh dấu này"
              aria-label="Xoá đánh dấu này"
            >
              <Trash2 size={13} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setPending(null)}
            className="ml-0.5 cursor-pointer rounded-full p-1 text-muted transition-colors hover:text-ink"
            title="Đóng"
            aria-label="Đóng"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
