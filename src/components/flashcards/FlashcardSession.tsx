import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeftRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  HelpCircle,
  LayoutGrid,
  Lightbulb,
  List,
  Maximize2,
  Minimize2,
  Palette,
  PauseCircle,
  PlayCircle,
  Repeat,
  RotateCcw,
  RotateCw,
  Shuffle,
  Sparkles,
  Star,
  Type,
  Volume1,
  Volume2,
  VolumeX,
  X,
  PartyPopper,
} from 'lucide-react'
import type { Entry, Grade, Item, Status } from '../../types'
import NoteBox from '../ui/NoteBox'
import CramView from '../ui/CramView'
import ContinuousFeedView, { type CardTheme, type CardFont } from './ContinuousFeedView'
import { useProgress } from '../../features/learning/ProgressContext'
import { Button, Card, Empty, Modal, ProgressBar, useToast } from '../ui'
import { CardBack, CardFront } from './CardContent'
import { shuffle, cx } from '../../utils'
import { isMulti, sameKeys, toggleKey } from '../../utils/answers'
import { Link } from 'react-router-dom'
import { loadSettings, saveSettings } from '../../services/storage/settings'
import { fireConfetti } from '../../utils/confetti'
import { isSoundEnabled, playSound, setSoundEnabled } from '../../utils/sound'
import { playMechSound } from '../../utils/mechSound'
import { haptic } from '../../utils/haptic'
import { exitZen, isZenMode, toggleZen, useZen } from '../../utils/zen'
import { isSpeaking, speakText, stopSpeaking } from '../../utils/speech'
import { useStarred } from '../../services/storage/starred'
import { itemTitle } from '../../data'
import { isLeech } from '../../services/review/srs'

type Filter = 'all' | Status | 'review'
const FILTERS: { v: Filter; label: string }[] = [
  { v: 'all', label: 'Tất cả thẻ' },
  { v: 'new', label: 'Thẻ mới' },
  { v: 'unknown', label: 'Chưa nhớ' },
  { v: 'known', label: 'Đã thuộc' },
  { v: 'review', label: 'Cần ôn lại' },
]

const GRADES: { g: Grade; label: string; hint: string; k: string; cls: string; icon?: typeof Check }[] = [
  { g: 'again', label: 'Quên', hint: 'Chưa nhớ: về hộp 1, ôn lại ngay', k: '1', cls: 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900/60', icon: X },
  { g: 'hard', label: 'Khó', hint: 'Nhớ nhưng chật vật: giữ nguyên hộp, ôn lại sớm hơn', k: '2', cls: 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-900/60' },
  { g: 'good', label: 'Được', hint: 'Nhớ đúng: lên 1 hộp', k: '3', cls: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600', icon: Check },
  { g: 'easy', label: 'Dễ', hint: 'Nhớ ngay lập tức: lên 2 hộp', k: '4', cls: 'bg-sky-100 text-sky-800 hover:bg-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:hover:bg-sky-900/60' },
]

/** learn-until-known: a card answered wrong comes back this many cards later */
const REQUEUE_GAP = 3
type Slot = { e: Entry; repeat: boolean }

interface Props {
  entries: Entry[]
  /** 'review' mode keeps the given order, hides filters and clears the review flag on success */
  mode?: 'study' | 'review'
  /** study mode: remember the deck order and the current card under this key, so the next visit resumes there */
  resumeKey?: string
}

/** Where the learner stopped: the deck order (item keys), the filter and the current card. */
interface Resume {
  filter: Filter
  shuffled: boolean
  keys: string[]
  cur: string
}
const resumeStorageKey = (k: string) => `psh.flashcards.resume.${k}`
const entryKey = (e: Entry) => `${e.collection.id}::${e.item.id}`

function loadResume(resumeKey: string | undefined, entries: Entry[]): Resume | null {
  if (!resumeKey) return null
  try {
    const r = JSON.parse(localStorage.getItem(resumeStorageKey(resumeKey)) ?? 'null') as Resume | null
    if (!r || !Array.isArray(r.keys) || !r.keys.length) return null
    const known = new Set(entries.map(entryKey))
    return r.keys.every((k) => known.has(k)) && r.keys.includes(r.cur) ? r : null
  } catch {
    return null
  }
}

function getTextToSpeak(item: Item, back: boolean): string {
  if (back) {
    if (item.type === 'multiple-choice') {
      const ans = [...item.content.answer].map((k) => item.content.options.find((o) => o.key === k)?.text).filter(Boolean).join(', ')
      return `Đáp án: ${ans}. ${item.content.explanation ?? ''}`
    }
    if (item.type === 'true-false') {
      return `Đáp án: ${item.content.answer ? 'Đúng' : 'Sai'}. ${item.content.explanation ?? ''}`
    }
    if (item.type === 'theory' || item.type === 'programming') {
      return `${item.content.definition}. ${item.content.explanation ?? ''}`
    }
    if (item.type === 'vocabulary') {
      return `${item.content.meaning}. ${item.content.example ?? ''}`
    }
  } else {
    if (item.type === 'multiple-choice') return item.content.question
    if (item.type === 'true-false') return item.content.statement
    if (item.type === 'theory' || item.type === 'programming') return item.content.concept
    if (item.type === 'vocabulary') return item.content.term
  }
  return ''
}

export default function FlashcardSession({ entries, mode = 'study', resumeKey }: Props) {
  const { get, record, toggleReview } = useProgress()
  const { toast } = useToast()
  const useResume = mode === 'study' ? resumeKey : undefined
  const [resume, setResume] = useState<Resume | null>(() => loadResume(useResume, entries))
  const [filter, setFilter] = useState<Filter>(() => resume?.filter ?? 'all')
  const [shuffled, setShuffled] = useState(() => resume?.shuffled ?? (mode === 'study' && loadSettings().shuffleFlashcards))
  const [seed, setSeed] = useState(0)
  const [idx, setIdx] = useState(() => (resume ? Math.max(0, resume.keys.indexOf(resume.cur)) : 0))
  const [flipped, setFlipped] = useState(false)
  const [inverted, setInverted] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [sound, setSound] = useState(isSoundEnabled)
  const [fontZoom, setFontZoom] = useState<'normal' | 'large' | 'xl'>(() => {
    try {
      return (localStorage.getItem('psh.fontzoom') as 'normal' | 'large' | 'xl') || 'normal'
    } catch {
      return 'normal'
    }
  })

  // Display mode, Card Theme & Typography
  const [viewMode, setViewMode] = useState<'flip' | 'feed'>(() => {
    try {
      return (localStorage.getItem('psh.flashcards.view_mode') as 'flip' | 'feed') || 'flip'
    } catch {
      return 'flip'
    }
  })

  const [cardTheme, setCardTheme] = useState<CardTheme>(() => {
    try {
      return (localStorage.getItem('psh.card_theme') as CardTheme) || 'default'
    } catch {
      return 'default'
    }
  })

  const [cardFont, setCardFont] = useState<CardFont>(() => {
    try {
      return (localStorage.getItem('psh.card_font') as CardFont) || 'sans'
    } catch {
      return 'sans'
    }
  })

  const [sessionStreak, setSessionStreak] = useState(0)
  const [sessionKnownCount, setSessionKnownCount] = useState(0)
  const [sessionAgainCount, setSessionAgainCount] = useState(0)
  const [peekHint, setPeekHint] = useState(false)
  const [showThemeSettings, setShowThemeSettings] = useState(false)

  // Interactive Drag / Swipe physics
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)

  const toggleViewMode = () => {
    const next = viewMode === 'flip' ? 'feed' : 'flip'
    setViewMode(next)
    try {
      localStorage.setItem('psh.flashcards.view_mode', next)
    } catch {}
  }

  const changeTheme = (t: CardTheme) => {
    setCardTheme(t)
    try {
      localStorage.setItem('psh.card_theme', t)
    } catch {}
  }

  const changeFont = (f: CardFont) => {
    setCardFont(f)
    try {
      localStorage.setItem('psh.card_font', f)
    } catch {}
  }

  // Touch gesture swipe state
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const [swipeHint, setSwipeHint] = useState<string | null>(null)
  const [showCardGrid, setShowCardGrid] = useState(false)
  const [showCram, setShowCram] = useState(false)
  const zenMode = useZen()
  const [autoPlay, setAutoPlay] = useState(false)
  const [reading, setReading] = useState(false)
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      exitZen()
    }
  }, [])

  // Dừng đọc TTS và dọn dẹp khi đổi thẻ
  useEffect(() => {
    stopSpeaking()
    setReading(false)
  }, [idx, flipped])

  // Xử lý đọc Text-to-Speech
  const handleSpeak = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (isSpeaking() || reading) {
      stopSpeaking()
      setReading(false)
    } else if (cur) {
      const text = getTextToSpeak(cur.item, inverted ? !flipped : flipped)
      setReading(true)
      speakText(text, () => setReading(false))
    }
  }

  const getRef = useRef(get)
  getRef.current = get

  const deck = useMemo(() => {
    if (resume) {
      const byKey = new Map(entries.map((e) => [entryKey(e), e]))
      return resume.keys.map((k) => byKey.get(k)!)
    }
    let list = entries
    if (filter !== 'all')
      list = list.filter((e) => {
        const p = getRef.current(e.collection.id, e.item.id)
        if (filter === 'review') return !!p?.review
        return (p?.status ?? 'new') === filter
      })
    return shuffled ? shuffle(list) : list
  }, [entries, filter, shuffled, seed, resume])

  const [learn, setLearn] = useState(() => loadSettings().learnUntilKnown)
  const [order, setOrder] = useState<Slot[]>(() => deck.map((e) => ({ e, repeat: false })))
  const [repeats, setRepeats] = useState(0)
  const [done, setDone] = useState(false)

  // Chế độ tự động phát (Auto-Play Slideshow)
  useEffect(() => {
    if (!autoPlay || done) {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
      return
    }

    autoTimerRef.current = setTimeout(() => {
      if (!flipped) {
        setFlipped(true)
      } else {
        if (idx < order.length - 1) {
          setFlipped(false)
          setIdx((i) => i + 1)
        } else {
          setAutoPlay(false)
        }
      }
    }, 4000)

    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
    }
  }, [autoPlay, flipped, idx, order.length, done])

  useEffect(() => {
    setIdx(resume ? Math.max(0, resume.keys.indexOf(resume.cur)) : 0)
    setFlipped(false)
    setOrder(deck.map((e) => ({ e, repeat: false })))
    setRepeats(0)
    setDone(false)
  }, [deck])

  const slot = order[idx]
  const cur = slot?.e
  const isRepeat = !!slot?.repeat
  const p = cur ? get(cur.collection.id, cur.item.id) : undefined
  const { isStarred, toggle: toggleStar } = useStarred()

  const [picks, setPicks] = useState<Record<string, string>>({})
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  useEffect(() => {
    setPicks({})
    setDrafts({})
  }, [deck])

  const curKey = cur ? entryKey(cur) : ''
  useEffect(() => {
    if (!useResume) return
    try {
      if (done || !curKey) localStorage.removeItem(resumeStorageKey(useResume))
      else {
        const r: Resume = { filter, shuffled, keys: deck.map(entryKey), cur: curKey }
        localStorage.setItem(resumeStorageKey(useResume), JSON.stringify(r))
      }
    } catch {}
  }, [useResume, done, curKey, filter, shuffled, deck])

  const pickKey = cur ? `${idx}::${cur.collection.id}::${cur.item.id}` : ''
  const picked = picks[pickKey]

  const requeue = useCallback(() => {
    if (!learn || !cur) return false
    setOrder((o) => {
      const at = Math.min(o.length, idx + 1 + REQUEUE_GAP)
      return [...o.slice(0, at), { e: cur, repeat: true }, ...o.slice(at)]
    })
    setRepeats((n) => n + 1)
    return true
  }, [learn, cur, idx])

  const commitPick = useCallback(
    (keys: string) => {
      if (!cur || cur.item.type !== 'multiple-choice') return
      const correct = sameKeys(keys, cur.item.content.answer)
      playSound(correct ? 'correct' : 'wrong')
      setPicks((s) => ({ ...s, [pickKey]: keys }))
      record(
        [{ collectionId: cur.collection.id, itemId: cur.item.id, correct, grade: correct && isRepeat ? 'hard' : undefined }],
        mode === 'review' ? 'review' : 'flashcard',
        { clearReview: mode === 'review' },
      )
      if (!correct) requeue()
    },
    [cur, pickKey, record, mode, isRepeat, requeue],
  )

  const pick = useCallback(
    (key: string) => {
      if (!cur || cur.item.type !== 'multiple-choice' || picks[pickKey] !== undefined) return
      if (isMulti(cur.item.content.answer)) setDrafts((d) => ({ ...d, [pickKey]: toggleKey(d[pickKey] ?? '', key) }))
      else commitPick(key)
    },
    [cur, picks, pickKey, commitPick],
  )

  const confirmPick = useCallback(() => {
    if (drafts[pickKey]) commitPick(drafts[pickKey])
  }, [drafts, pickKey, commitPick])

  const go = useCallback(
    (d: number) => {
      playSound('click')
      setFlipped(false)
      setIdx((i) => Math.min(order.length - 1, Math.max(0, i + d)))
    },
    [order.length],
  )

  const grade = useCallback(
    (g: Grade) => {
      if (!cur) return
      const last = idx >= order.length - 1
      if (g === 'again') {
        playSound('wrong')
        haptic('error')
        setSessionStreak(0)
        setSessionAgainCount((n) => n + 1)
      } else {
        playSound('correct')
        haptic(g === 'hard' ? 'medium' : 'success')
        setSessionStreak((s) => s + 1)
        setSessionKnownCount((n) => n + 1)
      }
      playMechSound('keydown')

      record(
        [{ collectionId: cur.collection.id, itemId: cur.item.id, correct: g !== 'again', grade: g !== 'again' && isRepeat ? 'hard' : g }],
        mode === 'review' ? 'review' : 'flashcard',
        { clearReview: mode === 'review' },
      )
      const grew = g === 'again' && requeue()
      setFlipped(false)
      setPeekHint(false)
      if (last && !grew) {
        setDone(true)
        playSound('fanfare')
        fireConfetti()
      } else {
        setIdx((i) => i + 1)
      }
    },
    [cur, record, mode, idx, order.length, isRepeat, requeue],
  )

  const handleFlip = useCallback(() => {
    playSound('flip')
    playMechSound('space')
    haptic('light')
    setFlipped((f) => !f)
  }, [])

  const handleToggleBookmark = useCallback(() => {
    if (!cur) return
    toggleReview(cur.collection.id, cur.item.id)
    toast.info(!p?.review ? 'Đã đánh dấu cần ôn lại' : 'Đã bỏ đánh dấu')
  }, [cur, p?.review, toggleReview, toast])

  // Pointer Drag Physics Handlers (Mouse & Touch)
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

  // Phím tắt bàn phím
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
  }, [go, grade, cur, handleToggleBookmark, handleFlip, pick, done, flipped, showCram, picks, pickKey, handleSpeak])

  const toggleSound = () => {
    const next = !sound
    setSound(next)
    setSoundEnabled(next)
    toast.info(next ? 'Đã bật âm thanh hiệu ứng' : 'Đã tắt âm thanh')
  }

  const cycleFontZoom = () => {
    const next = fontZoom === 'normal' ? 'large' : fontZoom === 'large' ? 'xl' : 'normal'
    setFontZoom(next)
    try {
      localStorage.setItem('psh.fontzoom', next)
    } catch {}
  }

  const pill = (active: boolean) =>
    cx(
      'inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer select-none sm:min-h-0',
      active ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700',
    )

  const toolbar = (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-card px-3 py-2 shadow-xs">
      <div className="flex flex-wrap items-center gap-1.5">
        {mode === 'study' && (
          <>
            <select
              value={filter}
              onChange={(e) => {
                setResume(null)
                setFilter(e.target.value as Filter)
              }}
              className="rounded-xl bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-ink outline-none hover:bg-slate-100 cursor-pointer"
              aria-label="Lọc theo trạng thái"
            >
              {FILTERS.map((f) => (
                <option key={f.v} value={f.v}>
                  {f.label}
                </option>
              ))}
            </select>
            <button
              className={pill(shuffled)}
              onClick={() => {
                setResume(null)
                setShuffled((s) => !s)
                setSeed((s) => s + 1)
              }}
            >
              <Shuffle size={13} /> <span className="hidden sm:inline">Trộn thẻ</span>
            </button>
            <button className={pill(inverted)} onClick={() => setInverted((v) => !v)} title="Đảo mặt trước / sau (phím F)">
              <ArrowLeftRight size={13} /> <span className="hidden sm:inline">Đảo mặt</span>
            </button>
          </>
        )}
        <button
          className={pill(learn)}
          onClick={() => {
            saveSettings({ ...loadSettings(), learnUntilKnown: !learn })
            setLearn(!learn)
          }}
          title="Lặp lại thẻ sai đến khi nhớ mới hoàn thành phiên"
        >
          <Repeat size={13} /> <span className="hidden sm:inline">Học đến khi thuộc</span>
        </button>

        <button
          className={pill(autoPlay)}
          onClick={() => setAutoPlay((a) => !a)}
          title="Tự động lật và chuyển câu sau 4 giây"
        >
          {autoPlay ? <PauseCircle size={13} className="text-amber-400 animate-pulse" /> : <PlayCircle size={13} />}
          <span className="hidden sm:inline">{autoPlay ? 'Dừng phát' : 'Tự động phát'}</span>
        </button>

        <button
          className={cx(
            'inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer select-none sm:min-h-0',
            viewMode === 'feed'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          )}
          onClick={toggleViewMode}
          title="Chuyển sang chế độ cuộn danh sách liên tục (Continuous Feed View)"
        >
          <List size={13} />
          <span className="hidden sm:inline">Cuộn liên tục</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Nút tùy chỉnh Nền thẻ & Kiểu chữ */}
        <button
          onClick={() => setShowThemeSettings(true)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink cursor-pointer"
          title="Giao diện nền thẻ & kiểu chữ (Theme & Typography)"
        >
          <Palette size={16} />
        </button>

        {/* Nút đọc Text-to-Speech */}
        <button
          onClick={handleSpeak}
          className={cx(
            'inline-flex h-8 w-8 items-center justify-center rounded-xl transition-colors cursor-pointer',
            reading ? 'bg-indigo-600 text-white animate-pulse' : 'text-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink'
          )}
          title={reading ? 'Dừng đọc (đang phát giọng nói)' : 'Đọc to nội dung thẻ (Text-to-Speech)'}
        >
          <Volume1 size={16} />
        </button>

        {/* Nút xem danh sách lưới tất cả thẻ */}
        <button
          onClick={() => setShowCardGrid(true)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink cursor-pointer"
          title="Xem bảng danh sách thẻ trong phiên"
        >
          <LayoutGrid size={16} />
        </button>
        {/* Nút chỉnh cỡ chữ zoom */}
        <button
          onClick={cycleFontZoom}
          className="inline-flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-bold text-muted transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink cursor-pointer"
          title={`Đổi cỡ chữ hiển thị (${fontZoom})`}
        >
          <Type size={14} />
          <span className="uppercase text-[10px]">{fontZoom}</span>
        </button>

        {/* Nút lướt nhanh Cram Mode */}
        <button
          onClick={() => setShowCram(true)}
          className="inline-flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-900/40 cursor-pointer"
          title="Chế độ lướt nhanh siêu tốc (Cram Mode)"
        >
          <BookOpen size={14} />
          <span className="hidden sm:inline text-[11px]">Lướt nhanh</span>
        </button>

        {/* Nút Focus Zen Mode */}
        <button
          onClick={toggleZen}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink cursor-pointer"
          title={zenMode ? 'Thoát tập trung' : 'Chế độ tập trung (Zen Mode)'}
        >
          {zenMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>

        {/* Nút bật tắt âm thanh */}
        <button
          onClick={toggleSound}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink cursor-pointer"
          title={sound ? 'Tắt âm thanh' : 'Bật âm thanh'}
        >
          {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* Nút trợ giúp phím tắt */}
        <button
          onClick={() => setShowHelp((s) => !s)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink cursor-pointer"
          title="Phím tắt (?)"
        >
          <HelpCircle size={16} />
        </button>

        {/* Bộ đếm vị trí thẻ */}
        <span className="rounded-xl bg-slate-900 dark:bg-slate-100 px-3 py-1.5 font-mono text-xs font-bold text-white dark:text-slate-900 shadow-2xs">
          {order.length ? `${Math.min(idx + 1, order.length)} / ${order.length}` : '0 / 0'}
        </span>
      </div>
    </div>
  )

  if (showCram) {
    return <CramView entries={entries} onClose={() => setShowCram(false)} />
  }

  if (viewMode === 'feed') {
    return (
      <ContinuousFeedView
        entries={deck}
        title={cur ? cur.collection.title : undefined}
        onSwitchToFlip={() => setViewMode('flip')}
        cardTheme={cardTheme}
        cardFont={cardFont}
      />
    )
  }

  const getHintText = (item: Item): string => {
    if (item.type === 'multiple-choice') {
      const keys = [...item.content.answer].join(', ')
      const expSnippet = item.content.explanation ? ` · ${item.content.explanation.split('.')[0]}` : ''
      return `Đáp án thuộc nhóm [ ${keys} ]${expSnippet}`
    }
    if (item.type === 'vocabulary') {
      return `Bắt đầu bằng "${item.content.meaning.slice(0, 4)}..." (${item.content.partOfSpeech || 'Từ vựng'})`
    }
    if (item.type === 'true-false') {
      return 'Gợi ý: Đọc kỹ mốc thời gian hoặc từ ngữ khẳng định/phủ định trong mệnh đề.'
    }
    if (item.type === 'theory') {
      return `Khái niệm liên quan đến: "${item.content.definition.slice(0, 30)}..."`
    }
    return 'Hãy nhớ lại các ý chính đã học trong giáo trình.'
  }

  if (done)
    return (
      <div className="mx-auto w-full max-w-2xl py-4">
        {toolbar}
        <Card className="p-8 sm:p-12 text-center animate-in zoom-in-95 duration-200">
          <PartyPopper size={56} className="mx-auto animate-bounce text-amber-500" />
          <h2 className="mt-4 text-2xl font-extrabold text-ink">Hoàn thành xuất sắc!</h2>
          <p className="mt-2 text-sm text-muted max-w-md mx-auto leading-relaxed">
            Bạn đã hoàn thành toàn bộ {order.length - repeats} thẻ trong phiên học
            {repeats > 0 ? `, trong đó có ${repeats} lượt ôn lặp lại để ghi nhớ chắc chắn.` : ', không trả lời sai thẻ nào.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              onClick={() => {
                setResume(null)
                setSeed((s) => s + 1)
              }}
              className="py-2.5 px-5"
            >
              <RotateCcw size={15} /> Học lại bộ thẻ này
            </Button>
            <Link to="/">
              <Button variant="primary" className="py-2.5 px-6">
                Về Tổng quan
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )

  if (!order.length || !cur)
    return (
      <div className="mx-auto w-full max-w-2xl">
        {toolbar}
        <Empty>{mode === 'review' ? 'Tuyệt vời! Không còn mục nào cần ôn hôm nay' : 'Không có thẻ nào khớp bộ lọc này.'}</Empty>
      </div>
    )

  const statusLabel = p?.status === 'known' ? 'Đã thuộc' : p?.status === 'unknown' ? 'Chưa nhớ' : 'Mới'
  const currentKey = `${cur.collection.id}::${cur.item.id}`

  const front = <CardFront item={cur.item} itemKey={currentKey} picked={picked} onPick={pick} draft={drafts[pickKey]} onConfirm={confirmPick} />
  const frontContent = inverted ? <CardBack item={cur.item} itemKey={currentKey} /> : front
  const backContent = inverted ? front : <CardBack item={cur.item} itemKey={currentKey} />

  const zoomClass = fontZoom === 'large' ? 'text-lg' : fontZoom === 'xl' ? 'text-xl' : 'text-base'

  const themeClass =
    cardTheme === 'paper'
      ? 'bg-[#faf6ed] dark:bg-[#1a1917] border-[#e8dfcf] dark:border-[#2e2c28] text-[#2c2825] dark:text-[#ede7de] shadow-[0_12px_32px_-6px_rgba(180,160,120,0.18)]'
      : cardTheme === 'midnight'
      ? 'bg-[#030712] border-slate-800 text-slate-100 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.6)] ring-1 ring-indigo-500/10'
      : 'bg-card border-slate-200/90 dark:border-slate-800 text-ink shadow-[0_10px_28px_-6px_rgba(15,23,42,0.08),0_3px_8px_-2px_rgba(15,23,42,0.04)]'

  const fontClass = cardFont === 'serif' ? 'font-serif' : cardFont === 'mono' ? 'font-mono' : 'font-sans'

  const cardFace = cx(
    'flip-face flex min-h-[250px] flex-col justify-between rounded-3xl border p-4 sm:min-h-[290px] sm:p-8 transition-shadow',
    themeClass,
    fontClass,
  )

  const dragRotate = isDragging ? dragOffset.x * 0.04 : 0
  const dragX = isDragging ? dragOffset.x : 0
  const dragY = isDragging ? dragOffset.y * 0.35 : 0

  const cardTransformStyle = isDragging
    ? {
        transform: `translate3d(${dragX}px, ${dragY}px, 0) rotate(${dragRotate}deg)`,
        transition: 'none',
      }
    : {
        transform: 'translate3d(0, 0, 0) rotate(0deg)',
        transition: 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }

  return (
    <div className={cx('mx-auto w-full max-w-3xl', fontClass)}>
      {toolbar}

      {/* Live Session HUD */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/80 dark:border-line bg-card/80 px-3.5 py-2 backdrop-blur-md shadow-2xs text-xs font-semibold">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400" title="Số thẻ đã đánh giá thuộc trong phiên này">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span>{sessionKnownCount} Thuộc</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400" title="Số thẻ cần ôn lại trong phiên này">
            <span className="flex h-2 w-2 rounded-full bg-rose-500" />
            <span>{sessionAgainCount} Cần ôn</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted" title="Số thẻ còn lại trong cọc">
            <span className="flex h-2 w-2 rounded-full bg-slate-400" />
            <span>{Math.max(0, order.length - idx)} Còn lại</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {sessionStreak > 1 && (
            <div className="flex items-center gap-1 text-amber-500 font-bold animate-in fade-in">
              <Flame size={14} className="fill-amber-500" />
              <span>Chuỗi {sessionStreak}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-muted font-mono text-[11px]" title="Ước tính thời gian học còn lại">
            <Clock size={12} />
            <span>~{Math.max(1, Math.ceil((order.length - idx) * 0.15))} phút</span>
          </div>
        </div>
      </div>

      {/* Thanh tiến độ */}
      <div className="mb-2 px-1">
        <ProgressBar value={((idx + 1) / order.length) * 100} className="h-2" />
      </div>

      {/* Thông tin thẻ & Tags */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-1 text-xs text-muted">
        <span className="min-w-0 basis-full truncate font-bold text-ink sm:flex-1 sm:basis-auto sm:pr-2">{cur.collection.title}</span>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {isRepeat && <span className="rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-2.5 py-0.5 font-bold text-rose-600 dark:text-rose-400">Ôn lại</span>}
          {isLeech(p) && (
            <span
              className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
              title={`Bạn đã sai thẻ này ${p!.incorrect} lần. Thử đặt một mẹo nhớ riêng bằng nút Thêm ghi chú.`}
            >
              Ngoan cố ({p!.incorrect} lần sai)
            </span>
          )}
          {p && p.level > 0 && (
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 px-2.5 py-0.5 font-bold text-indigo-700 dark:text-indigo-300">
              Hộp {p.level}/5
            </span>
          )}
          <span
            className={cx(
              'rounded-full px-2.5 py-0.5 font-bold border',
              p?.status === 'known' && 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300',
              p?.status === 'unknown' && 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300',
              p?.status !== 'known' && p?.status !== 'unknown' && 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300',
            )}
          >
            {statusLabel}
          </span>
          <button
            onClick={() => {
              if (cur) {
                toggleStar(cur.collection.id, cur.item.id)
                playSound('click')
              }
            }}
            className={cx(
              'inline-flex h-9 items-center justify-center gap-1 rounded-full px-3 font-bold transition-colors cursor-pointer border sm:h-auto sm:px-2.5 sm:py-0.5',
              cur && isStarred(cur.collection.id, cur.item.id)
                ? 'bg-amber-500 border-amber-600 text-white'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 hover:bg-amber-100',
            )}
            title="Đánh dấu sao câu hỏi trọng tâm (Ôn tủ)"
          >
            <Star size={13} className={cx(cur && isStarred(cur.collection.id, cur.item.id) && 'fill-white')} />
            <span className="hidden sm:inline">{cur && isStarred(cur.collection.id, cur.item.id) ? 'Đã gắn sao' : 'Gắn sao'}</span>
          </button>
          <button
            onClick={handleToggleBookmark}
            className={cx(
              'inline-flex h-9 items-center justify-center gap-1 rounded-full px-3 font-bold transition-colors cursor-pointer border sm:h-auto sm:px-2.5 sm:py-0.5',
              p?.review
                ? 'bg-rose-500 border-rose-600 text-white'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-100',
            )}
            title="Đánh dấu cần ôn lại (phím R)"
          >
            <Bookmark size={13} className={cx(p?.review && 'fill-white')} /> <span className="hidden sm:inline">{p?.review ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
          </button>
        </div>
      </div>

      {/* Thẻ lật 3D có cọc xếp tầng & Pointer Drag Physics */}
      <div className="relative select-text">
        {/* Layer 3 (farthest behind) */}
        {order.length - idx > 3 && (
          <div
            className={cx(
              'absolute inset-x-6 -top-4 h-full rounded-3xl border opacity-30 shadow-xs pointer-events-none transition-all duration-300 transform scale-[0.96]',
              cardTheme === 'paper'
                ? 'bg-[#ede5d5] dark:bg-[#151413] border-[#ded3be] dark:border-[#242220]'
                : cardTheme === 'midnight'
                ? 'bg-[#02050b] border-slate-900'
                : 'bg-slate-200/60 dark:bg-slate-800/40 border-slate-300/40 dark:border-slate-700/40'
            )}
          />
        )}

        {/* Layer 2 (middle behind) */}
        {order.length - idx > 2 && (
          <div
            className={cx(
              'absolute inset-x-4 -top-2.5 h-full rounded-3xl border opacity-55 shadow-xs pointer-events-none transition-all duration-300 transform scale-[0.98]',
              cardTheme === 'paper'
                ? 'bg-[#f4edd0] dark:bg-[#181715] border-[#e2d7c4] dark:border-[#2a2825]'
                : cardTheme === 'midnight'
                ? 'bg-[#050914] border-slate-800'
                : 'bg-slate-100/80 dark:bg-slate-800/60 border-slate-300/60 dark:border-slate-700/60'
            )}
          />
        )}

        {/* Layer 1 (immediately behind) */}
        {order.length - idx > 1 && (
          <div
            className={cx(
              'absolute inset-x-2 -top-1 h-full rounded-3xl border opacity-80 shadow-sm pointer-events-none transition-all duration-300',
              cardTheme === 'paper'
                ? 'bg-[#f9f4ea] dark:bg-[#1a1917] border-[#e7dece] dark:border-[#2e2c28]'
                : cardTheme === 'midnight'
                ? 'bg-[#080d1a] border-slate-800'
                : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
            )}
          />
        )}

        {/* Main Card Scene */}
        <div
          style={cardTransformStyle}
          className="flip-scene relative cursor-pointer touch-pan-y"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          role="button"
          tabIndex={0}
          aria-label="Nhấn để lật thẻ hoặc vuốt để đánh giá"
        >
          {/* Dynamic Drag Stamp Indicators */}
          {dragOffset.x > 45 && (
            <div
              style={{ opacity: Math.min(1, (dragOffset.x - 45) / 55) }}
              className="absolute top-5 left-5 z-40 rounded-2xl border-4 border-emerald-500 bg-emerald-500/25 px-4 py-1.5 text-lg font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 shadow-lg -rotate-12 pointer-events-none"
            >
              ĐÃ THUỘC ✓
            </div>
          )}
          {dragOffset.x < -45 && (
            <div
              style={{ opacity: Math.min(1, (-dragOffset.x - 45) / 55) }}
              className="absolute top-5 right-5 z-40 rounded-2xl border-4 border-rose-500 bg-rose-500/25 px-4 py-1.5 text-lg font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 shadow-lg rotate-12 pointer-events-none"
            >
              CẦN ÔN ✗
            </div>
          )}
          {dragOffset.y < -45 && Math.abs(dragOffset.x) < 45 && (
            <div
              style={{ opacity: Math.min(1, (-dragOffset.y - 45) / 45) }}
              className="absolute top-5 inset-x-0 mx-auto w-fit z-40 rounded-2xl border-4 border-sky-500 bg-sky-500/25 px-4 py-1.5 text-lg font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 shadow-lg pointer-events-none"
            >
              RẤT DỄ
            </div>
          )}

          <div className={cx('flip-inner relative', flipped && 'flipped')}>
            {/* Mặt trước */}
            <div className={cx(cardFace, zoomClass, flipped && 'pointer-events-none absolute inset-0 overflow-hidden')}>
              <div className="flex flex-1 flex-col justify-center">{frontContent}</div>

              {/* Peek Hint button on front */}
              {!flipped && !inverted && (
                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPeekHint((h) => !h)
                    }}
                    className={cx(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors cursor-pointer border',
                      peekHint
                        ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                        : 'bg-slate-100/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-muted hover:text-ink hover:bg-slate-200/60'
                    )}
                  >
                    <Lightbulb size={13} className={peekHint ? 'fill-amber-500 text-amber-500' : ''} />
                    <span>{peekHint ? 'Ẩn gợi ý' : 'Gợi ý từ khóa'}</span>
                  </button>
                </div>
              )}

              {/* Hint Box */}
              {peekHint && !flipped && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="mt-3 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200 animate-in fade-in zoom-in-95"
                >
                  {getHintText(cur.item)}
                </div>
              )}

              <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted sm:mt-6">
                <RotateCw size={12} />
                <span>Chạm thẻ</span>
                <span className="hidden items-center gap-1.5 sm:inline-flex">
                  hoặc nhấn <kbd className="rounded-md border border-line bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink">Space</kbd>
                </span>
                <span>để lật</span>
              </div>
            </div>

            {/* Mặt sau */}
            <div className={cx(cardFace, zoomClass, 'flip-back', !flipped && 'pointer-events-none absolute inset-0 overflow-hidden')}>
              <div className="flex flex-1 flex-col justify-center">{backContent}</div>
              <div className="mt-6 hidden items-center justify-center gap-1.5 text-[11px] font-medium text-muted sm:flex">
                <span>Đánh giá:</span>
                <kbd className="rounded-md bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-600 dark:text-rose-300">1 Quên</kbd>
                <kbd className="rounded-md bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-700 dark:text-amber-300">2 Khó</kbd>
                <kbd className="rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">3 Được</kbd>
                <kbd className="rounded-md bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-sky-700 dark:text-sky-300">4 Dễ</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Dock: 4 nút tự tin + Trước / Sau */}
      <div className="sticky bottom-[calc(var(--bottom-nav-h)+0.5rem)] z-20 mt-3.5 flex items-center gap-2 rounded-2xl border border-line bg-card p-2 shadow-lg md:static md:bottom-auto md:shadow-xs">
        <button
          onClick={() => go(-1)}
          disabled={idx === 0}
          aria-label="Thẻ trước"
          className="inline-flex h-12 items-center justify-center gap-1 rounded-xl bg-slate-50 dark:bg-slate-800 px-3 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 sm:px-4 cursor-pointer"
        >
          <ChevronLeft size={18} /> <span className="hidden sm:inline">Trước</span>
        </button>

        {/* 4 mức tự tin */}
        <div className="grid flex-1 grid-cols-4 gap-1.5 sm:gap-2">
          {GRADES.map(({ g, label, hint, k, cls, icon: Icon }) => (
            <button
              key={g}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                grade(g)
              }}
              title={`${hint} (phím ${k})`}
              className={cx(
                'inline-flex h-12 items-center justify-center gap-1 rounded-xl px-1 text-sm font-bold transition active:scale-95 sm:gap-1.5 cursor-pointer shadow-2xs select-none',
                cls,
              )}
            >
              {Icon && <Icon size={16} strokeWidth={2.75} className="hidden sm:block" />}
              <span>{label}</span>
              <kbd className="hidden rounded bg-white/40 dark:bg-slate-900/40 px-1.5 font-mono text-[10px] md:inline">{k}</kbd>
            </button>
          ))}
        </div>

        <button
          onClick={() => go(1)}
          disabled={idx >= order.length - 1}
          aria-label="Thẻ sau"
          className="inline-flex h-12 items-center justify-center gap-1 rounded-xl bg-slate-50 dark:bg-slate-800 px-3 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 sm:px-4 cursor-pointer"
        >
          <span className="hidden sm:inline">Sau</span> <ChevronRight size={18} />
        </button>
      </div>

      <NoteBox collectionId={cur.collection.id} itemId={cur.item.id} className="mt-3.5" />

      {/* Visual Hotkeys Bar */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono font-bold text-ink">
          Space
        </span>
        <span>Lật mặt</span>
        <span className="text-slate-300 dark:text-slate-700">·</span>

        <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.5 font-mono font-bold text-rose-700 dark:text-rose-300">
          1 Quên
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 font-mono font-bold text-amber-800 dark:text-amber-300">
          2 Khó
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 font-mono font-bold text-emerald-800 dark:text-emerald-300">
          3 Được
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 dark:bg-sky-950/60 px-1.5 py-0.5 font-mono font-bold text-sky-800 dark:text-sky-300">
          4 Dễ
        </span>
        <span className="text-slate-300 dark:text-slate-700">·</span>

        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono font-bold text-ink">
          ← →
        </span>
        <span>Trước/Sau</span>
        <span className="text-slate-300 dark:text-slate-700">·</span>

        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono font-bold text-ink">
          S
        </span>
        <span>Đọc to</span>
      </div>

      {/* Card Grid Drawer Modal */}
      <Modal open={showCardGrid} onClose={() => setShowCardGrid(false)} title="Danh sách thẻ trong phiên">
        <div className="max-h-[60vh] overflow-y-auto space-y-3 pt-1">
          <p className="text-xs text-muted">
            Nhấn vào số thẻ để nhảy nhanh tới câu đó. Màu xanh: Đã thuộc, Đỏ: Chưa nhớ / Hộp 1, Xám: Mới.
          </p>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 pt-1">
            {order.map((slot, i) => {
              const it = slot.e.item
              const p = get(slot.e.collection.id, it.id)
              const isCur = i === idx
              return (
                <button
                  key={`${slot.e.collection.id}::${it.id}::${i}`}
                  onClick={() => {
                    setIdx(i)
                    setFlipped(false)
                    setShowCardGrid(false)
                  }}
                  title={itemTitle(it)}
                  className={cx(
                    'flex flex-col items-center justify-center h-12 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer',
                    isCur && 'ring-2 ring-indigo-500 scale-105 z-10 font-black shadow-md',
                    p?.status === 'known'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : p?.status === 'unknown'
                      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                      : 'bg-slate-100 dark:bg-slate-800 border-line text-muted'
                  )}
                >
                  <span>{i + 1}</span>
                  {p?.level ? <span className="text-[9px] font-normal opacity-70">H{p.level}</span> : null}
                </button>
              )
            })}
          </div>
        </div>
      </Modal>

      {/* Keyboard Shortcuts Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-line bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-ink">Phím tắt nhanh</h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="rounded-lg p-1 text-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5">
                <span className="font-medium text-ink">Lật thẻ trước / sau</span>
                <kbd className="rounded-md border border-line bg-card px-2 py-1 font-mono text-xs font-bold text-ink shadow-2xs">
                  Space / Enter
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5">
                <span className="font-medium text-ink">Đánh giá 1: Quên (về Hộp 1)</span>
                <kbd className="rounded-md border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950 px-2 py-1 font-mono text-xs font-bold text-rose-700 dark:text-rose-300 shadow-2xs">
                  1 hoặc U
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5">
                <span className="font-medium text-ink">Đánh giá 2: Khó (ôn sớm)</span>
                <kbd className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-2 py-1 font-mono text-xs font-bold text-amber-700 dark:text-amber-300 shadow-2xs">
                  2 hoặc H
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5">
                <span className="font-medium text-ink">Đánh giá 3: Được (lên 1 hộp)</span>
                <kbd className="rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-2xs">
                  3 hoặc K
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5">
                <span className="font-medium text-ink">Đánh giá 4: Dễ (lên 2 hộp)</span>
                <kbd className="rounded-md border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950 px-2 py-1 font-mono text-xs font-bold text-sky-700 dark:text-sky-300 shadow-2xs">
                  4 hoặc E
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5">
                <span className="font-medium text-ink">Chọn đáp án trắc nghiệm ở mặt trước</span>
                <kbd className="rounded-md border border-line bg-card px-2 py-1 font-mono text-xs font-bold text-ink shadow-2xs">
                  A, B, C, D (hoặc 1-4)
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5">
                <span className="font-medium text-ink">Đọc to câu hỏi (Text-to-Speech)</span>
                <kbd className="rounded-md border border-line bg-card px-2 py-1 font-mono text-xs font-bold text-ink shadow-2xs">
                  S
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5">
                <span className="font-medium text-ink">Đánh dấu sao / Cần ôn lại</span>
                <kbd className="rounded-md border border-line bg-card px-2 py-1 font-mono text-xs font-bold text-ink shadow-2xs">
                  R
                </kbd>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5">
                <span className="font-medium text-ink">Đảo mặt trước / sau</span>
                <kbd className="rounded-md border border-line bg-card px-2 py-1 font-mono text-xs font-bold text-ink shadow-2xs">
                  F
                </kbd>
              </div>
            </div>
            <Button variant="primary" className="mt-5 w-full py-2.5" onClick={() => setShowHelp(false)}>
              Đã hiểu
            </Button>
          </div>
        </div>
      )}

      {/* Theme & Typography Modal */}
      <Modal open={showThemeSettings} onClose={() => setShowThemeSettings(false)} title="Giao diện nền thẻ & Kiểu chữ">
        <div className="space-y-4 pt-1">
          {/* Card Themes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">
              Màu nền thẻ học (Theme)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => changeTheme('default')}
                className={cx(
                  'flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 text-xs font-bold transition-all cursor-pointer',
                  cardTheme === 'default'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-line bg-card text-muted hover:text-ink'
                )}
              >
                <div className="h-6 w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
                <span>Trắng sáng</span>
              </button>

              <button
                type="button"
                onClick={() => changeTheme('paper')}
                className={cx(
                  'flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 text-xs font-bold transition-all cursor-pointer',
                  cardTheme === 'paper'
                    ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                    : 'border-slate-200 dark:border-line bg-card text-muted hover:text-ink'
                )}
              >
                <div className="h-6 w-full rounded-lg bg-[#faf6ed] dark:bg-[#1a1917] border border-[#e8dfcf] dark:border-[#2e2c28]" />
                <span>Giấy kem ấm</span>
              </button>

              <button
                type="button"
                onClick={() => changeTheme('midnight')}
                className={cx(
                  'flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 text-xs font-bold transition-all cursor-pointer',
                  cardTheme === 'midnight'
                    ? 'border-indigo-500 bg-slate-900 text-white'
                    : 'border-slate-200 dark:border-line bg-card text-muted hover:text-ink'
                )}
              >
                <div className="h-6 w-full rounded-lg bg-[#030712] border border-slate-800" />
                <span>Tối OLED</span>
              </button>
            </div>
          </div>

          {/* Typography */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">
              Kiểu chữ hiển thị (Typography)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => changeFont('sans')}
                className={cx(
                  'rounded-xl border-2 p-2.5 text-xs font-sans font-bold transition-all cursor-pointer text-center',
                  cardFont === 'sans'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-line bg-card text-muted hover:text-ink'
                )}
              >
                Sans-serif
                <span className="block text-[10px] font-normal opacity-70">Hiện đại</span>
              </button>

              <button
                type="button"
                onClick={() => changeFont('serif')}
                className={cx(
                  'rounded-xl border-2 p-2.5 text-xs font-serif font-bold transition-all cursor-pointer text-center',
                  cardFont === 'serif'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-line bg-card text-muted hover:text-ink'
                )}
              >
                Serif
                <span className="block text-[10px] font-normal opacity-70">Sách giáo khoa</span>
              </button>

              <button
                type="button"
                onClick={() => changeFont('mono')}
                className={cx(
                  'rounded-xl border-2 p-2.5 text-xs font-mono font-bold transition-all cursor-pointer text-center',
                  cardFont === 'mono'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-line bg-card text-muted hover:text-ink'
                )}
              >
                Monospace
                <span className="block text-[10px] font-normal opacity-70">Kỹ thuật</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
