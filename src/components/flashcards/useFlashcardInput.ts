import { useEffect, useRef, useState } from 'react'
import type { Entry, Grade } from '../../types'
import { exitZen, isZenMode, toggleZen } from '../../utils/zen'

/** Drag the card: right = known, left = again, up = easy, a tap flips it. */
export function useCardDrag(grade: (g: Grade) => void, handleFlip: () => void) {
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)

  const handlePointerDown = (e: React.PointerEvent) => {
    if (window.getSelection()?.toString()) return
    const target = e.target as HTMLElement | null
    if (target?.closest('button, a, input, textarea, select, [data-no-drag]')) return

    dragStartRef.current = { x: e.clientX, y: e.clientY }
    setIsDragging(true)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current || !isDragging) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    setDragOffset({ x: dx, y: dy })
  }

  const handlePointerUp = () => {
    if (!dragStartRef.current) return
    const dx = dragOffset.x
    const dy = dragOffset.y

    dragStartRef.current = null
    setIsDragging(false)
    setDragOffset({ x: 0, y: 0 })

    if (dx > 100) {
      grade('good')
    } else if (dx < -100) {
      grade('again')
    } else if (dy < -90) {
      grade('easy')
    } else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      handleFlip()
    }
  }

  return { dragOffset, isDragging, handlePointerDown, handlePointerMove, handlePointerUp }
}

interface HotkeyArgs {
  done: boolean
  showCram: boolean
  flipped: boolean
  cur: Entry | undefined
  picks: Record<string, string>
  pickKey: string
  go: (d: number) => void
  grade: (g: Grade) => void
  handleFlip: () => void
  handleToggleBookmark: () => void
  handleSpeak: () => void
  pick: (key: string) => void
  setInverted: (f: (v: boolean) => boolean) => void
  setShowHelp: (f: (v: boolean) => boolean) => void
}

/** Keyboard shortcuts of the flashcard session (see the "Phím tắt" dialog). */
export function useFlashcardHotkeys({
  done, showCram, flipped, cur, picks, pickKey, go, grade, handleFlip, handleToggleBookmark, handleSpeak, pick, setInverted, setShowHelp,
}: HotkeyArgs) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // while the Cram list is on screen the hidden card must not react (it would silently record answers)
      if (done || showCram || (e.target as HTMLElement | null)?.closest?.('input,textarea,select')) return

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        go(1)
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-1)
        return
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleFlip()
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return

      const key = e.key
      const isNum1to4 = /^[1-4]$/.test(key) || /^Numpad[1-4]$/.test(e.code)
      const numVal = /^[1-4]$/.test(key) ? Number(key) : Number(e.code.replace('Numpad', ''))

      // Handle 1, 2, 3, 4 rating or answering:
      if (isNum1to4) {
        // If the card is flipped to back, OR if the question was already picked, OR if item is not multiple-choice:
        // Then 1, 2, 3, 4 MUST grade!
        if (flipped || picks[pickKey] !== undefined || cur?.item.type !== 'multiple-choice') {
          e.preventDefault()
          if (numVal === 1) grade('again')
          else if (numVal === 2) grade('hard')
          else if (numVal === 3) grade('good')
          else if (numVal === 4) grade('easy')
          return
        }

        // If card is on front and is multiple choice and not yet answered: pick option 1, 2, 3, 4
        if (cur?.item.type === 'multiple-choice' && !flipped && picks[pickKey] === undefined) {
          e.preventDefault()
          const opts = cur.item.content.options
          if (opts[numVal - 1]) pick(opts[numVal - 1].key)
          return
        }
      }

      // Letter keys A, B, C, D for picking multiple-choice options on front:
      if (cur?.item.type === 'multiple-choice' && !flipped && picks[pickKey] === undefined && /^[a-dA-D]$/.test(key)) {
        e.preventDefault()
        pick(key.toUpperCase())
        return
      }

      // Semantic rating hotkeys:
      if (key === 'u' || key === 'U' || key === 'q' || key === 'Q') {
        e.preventDefault()
        grade('again')
      } else if (key === 'h' || key === 'H') {
        e.preventDefault()
        grade('hard')
      } else if (key === 'k' || key === 'K' || key === 'd' || key === 'D') {
        e.preventDefault()
        grade('good')
      } else if (key === 'e' || key === 'E') {
        e.preventDefault()
        grade('easy')
      } else if (key === 'r' || key === 'R') {
        handleToggleBookmark()
      } else if (key === 's' || key === 'S') {
        handleSpeak()
      } else if (key === 'f' || key === 'F') {
        setInverted((v) => !v)
      } else if (key === 'z' || key === 'Z') {
        toggleZen()
      } else if (e.key === 'Escape' && isZenMode()) {
        exitZen()
      } else if (key === '?') {
        setShowHelp((s) => !s)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, grade, cur, handleToggleBookmark, handleFlip, pick, done, flipped, showCram, picks, pickKey, handleSpeak, setInverted, setShowHelp])
}
