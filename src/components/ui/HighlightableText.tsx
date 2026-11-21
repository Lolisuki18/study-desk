import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  addHighlight,
  getItemHighlights,
  HIGHLIGHT_COLORS,
  removeHighlight,
  type HighlightColor,
  type TextHighlight,
} from '../../services/storage/highlights'
import { cx } from '../../utils'
import { Trash2, X } from 'lucide-react'

interface Props {
  text: string
  itemKey: string // `${collectionId}::${itemId}`
  className?: string
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3'
}

export default function HighlightableText({ text, itemKey, className, as: Component = 'div' }: Props) {
  const containerRef = useRef<HTMLElement>(null)
  const [highlights, setHighlights] = useState<TextHighlight[]>(() => getItemHighlights(itemKey))
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null)
  const [activeHighlight, setActiveHighlight] = useState<TextHighlight | null>(null)

  useEffect(() => {
    setHighlights(getItemHighlights(itemKey))
    setSelection(null)
    setActiveHighlight(null)
  }, [itemKey])

  useEffect(() => {
    const handleChanged = () => {
      setHighlights(getItemHighlights(itemKey))
    }
    window.addEventListener('highlights-changed', handleChanged)
    return () => window.removeEventListener('highlights-changed', handleChanged)
  }, [itemKey])

  // Handle text selection
  const handleMouseUp = () => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !containerRef.current) {
      return
    }

    const selectedStr = sel.toString().trim()
    if (selectedStr.length < 2) {
      return
    }

    // Check if selection is inside container
    if (!containerRef.current.contains(sel.anchorNode) || !containerRef.current.contains(sel.focusNode)) {
      return
    }

    try {
      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()

      setSelection({
        text: selectedStr,
        x: Math.max(10, rect.left - containerRect.left + rect.width / 2),
        y: Math.max(0, rect.top - containerRect.top - 40),
      })
      setActiveHighlight(null)
    } catch {
      // ignore getRangeAt error
    }
  }

  const applyColor = (color: HighlightColor) => {
    if (!selection) return
    addHighlight(itemKey, selection.text, color)
    window.getSelection()?.removeAllRanges()
    setSelection(null)
  }

  const handleHighlightClick = (e: React.MouseEvent, h: TextHighlight) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 }
    setActiveHighlight(h)
    setSelection({
      text: h.text,
      x: rect.left - containerRect.left + rect.width / 2,
      y: Math.max(0, rect.top - containerRect.top - 40),
    })
  }

  // Render text with highlights
  const renderHighlightedContent = (): ReactNode[] => {
    if (!highlights || highlights.length === 0) {
      return [text]
    }

    // Sort highlights by length descending to match longest phrases first
    const sorted = [...highlights].sort((a, b) => b.text.length - a.text.length)
    const escaped = sorted.map((h) => h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi')

    const parts = text.split(regex)
    return parts.map((part, i) => {
      const matched = sorted.find((h) => h.text.toLowerCase() === part.toLowerCase())
      if (matched) {
        const colorDef = HIGHLIGHT_COLORS.find((c) => c.id === matched.color) || HIGHLIGHT_COLORS[0]
        return (
          <mark
            key={i}
            onClick={(e) => handleHighlightClick(e, matched)}
            className={cx(
              colorDef.bgClass,
              'cursor-pointer transition-opacity hover:opacity-85 font-inherit decoration-clone',
            )}
            title="Bấm để đổi màu hoặc xoá đánh dấu"
          >
            {part}
          </mark>
        )
      }
      return part
    })
  }

  return (
    <Component
      ref={containerRef as any}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
      className={cx('relative select-text', className)}
    >
      {renderHighlightedContent()}

      {/* Floating Highlight Toolbar */}
      {selection && (
        <div
          style={{ left: `${selection.x}px`, top: `${selection.y}px` }}
          className="absolute z-30 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 px-2.5 py-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => applyColor(c.id)}
              className={cx(
                'h-5 w-5 rounded-full border border-white dark:border-slate-900 transition-transform hover:scale-125 cursor-pointer shadow-xs',
                c.dotClass,
              )}
              title={`Đánh dấu: ${c.label}`}
            />
          ))}

          {activeHighlight && (
            <button
              onClick={() => {
                removeHighlight(itemKey, activeHighlight.id)
                setSelection(null)
                setActiveHighlight(null)
              }}
              className="ml-1 p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition-colors cursor-pointer"
              title="Xoá đánh dấu này"
            >
              <Trash2 size={13} />
            </button>
          )}

          <button
            onClick={() => {
              setSelection(null)
              setActiveHighlight(null)
            }}
            className="ml-0.5 p-1 text-muted hover:text-ink rounded-full transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </Component>
  )
}
