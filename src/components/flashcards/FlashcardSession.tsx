import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeftRight, Bookmark, Check, ChevronLeft, ChevronRight, HelpCircle, LayoutGrid, Maximize2, Minimize2, PauseCircle, PlayCircle, Repeat, RotateCcw, RotateCw, Shuffle, Sparkles, Star, Type, Volume1, Volume2, VolumeX, X, PartyPopper } from 'lucide-react'
import type { Entry, Grade, Item, Status } from '../../types'
import NoteBox from '../ui/NoteBox'
import { useProgress } from '../../features/learning/ProgressContext'
import { Button, Card, Empty, Modal, ProgressBar, useToast } from '../ui'
import { CardBack, CardFront } from './CardContent'
import { shuffle, cx } from '../../utils'
import { isMulti, sameKeys, toggleKey } from '../../utils/answers'
import { Link } from 'react-router-dom'
import { loadSettings, saveSettings } from '../../services/storage/settings'
import { fireConfetti } from '../../utils/confetti'
import { isSoundEnabled, playSound, setSoundEnabled } from '../../utils/sound'
import { isSpeaking, speakText, stopSpeaking } from '../../utils/speech'
import { useStarred } from '../../services/storage/starred'
import { itemTitle } from '../../data'

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

  // Touch gesture swipe state
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const [swipeHint, setSwipeHint] = useState<string | null>(null)
  const [showCardGrid, setShowCardGrid] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)
  const [reading, setReading] = useState(false)
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      playSound(g === 'again' ? 'wrong' : 'correct')

      if (picks[pickKey] !== undefined) {
        if (last) {
          setDone(true)
          playSound('fanfare')
          fireConfetti()
        } else go(1)
        return
      }

      record(
        [{ collectionId: cur.collection.id, itemId: cur.item.id, correct: g !== 'again', grade: g !== 'again' && isRepeat ? 'hard' : g }],
        mode === 'review' ? 'review' : 'flashcard',
        { clearReview: mode === 'review' },
      )
      const grew = g === 'again' && requeue()
      setFlipped(false)
      if (last && !grew) {
        setDone(true)
        playSound('fanfare')
        fireConfetti()
      } else {
        setIdx((i) => i + 1)
      }
    },
    [cur, record, go, mode, picks, pickKey, idx, order.length, isRepeat, requeue],
  )

  const handleFlip = useCallback(() => {
    playSound('flip')
    setFlipped((f) => !f)
  }, [])

  const handleToggleBookmark = useCallback(() => {
    if (!cur) return
    toggleReview(cur.collection.id, cur.item.id)
    toast.info(!p?.review ? 'Đã đánh dấu cần ôn lại' : 'Đã bỏ đánh dấu')
  }, [cur, p?.review, toggleReview, toast])

  // Touch gesture handlers (Swipe: Left = Quên, Right = Thuộc, Up = Dễ)
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStartRef.current.x
    const dy = t.clientY - touchStartRef.current.y
    const dt = Date.now() - touchStartRef.current.time
    touchStartRef.current = null

    // Ngưỡng phát hiện vuốt nhanh trong vòng 400ms
    if (dt < 450) {
      if (Math.abs(dx) > 70 && Math.abs(dy) < 50) {
        if (dx > 0) {
          setSwipeHint('Được')
          setTimeout(() => setSwipeHint(null), 500)
          grade('good')
        } else {
          setSwipeHint('Quên')
          setTimeout(() => setSwipeHint(null), 500)
          grade('again')
        }
      } else if (dy < -70 && Math.abs(dx) < 50) {
        setSwipeHint('Dễ')
        setTimeout(() => setSwipeHint(null), 500)
        grade('easy')
      }
    }
  }

  // Phím tắt bàn phím
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || (e.target as HTMLElement | null)?.closest?.('input,textarea,select')) return
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleFlip()
      } else if (e.ctrlKey || e.metaKey || e.altKey) return
      else if (e.key === 'k' || e.key === 'K') grade('good')
      else if (e.key === 'u' || e.key === 'U') grade('again')
      else if (e.key === 'h' || e.key === 'H') grade('hard')
      else if (e.key === 'e' || e.key === 'E') grade('easy')
      else if (cur?.item.type === 'multiple-choice' && /^[1-4a-dA-D]$/.test(e.key)) {
        const opts = cur.item.content.options
        const idx = /\d/.test(e.key) ? Number(e.key) - 1 : e.key.toLowerCase().charCodeAt(0) - 97
        if (opts[idx]) pick(opts[idx].key)
      } else if (e.key === 'r' || e.key === 'R') {
        handleToggleBookmark()
      } else if (e.key === 'f' || e.key === 'F') {
        setInverted((v) => !v)
      } else if (e.key === '?') {
        setShowHelp((s) => !s)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, grade, cur, handleToggleBookmark, handleFlip, pick, done, flipped])

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
      </div>

      <div className="flex items-center gap-1.5">
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

  const front = <CardFront item={cur.item} picked={picked} onPick={pick} draft={drafts[pickKey]} onConfirm={confirmPick} />
  const frontContent = inverted ? <CardBack item={cur.item} /> : front
  const backContent = inverted ? front : <CardBack item={cur.item} />

  const zoomClass = fontZoom === 'large' ? 'text-lg' : fontZoom === 'xl' ? 'text-xl' : 'text-base'

  const cardFace =
    'flip-face flex min-h-[240px] flex-col justify-between rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-card p-4 sm:min-h-[280px] sm:p-8 shadow-[0_10px_28px_-6px_rgba(15,23,42,0.08),0_3px_8px_-2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_14px_36px_-6px_rgba(15,23,42,0.12)]'

  return (
    <div className="mx-auto w-full max-w-3xl">
      {toolbar}

      {/* Thanh tiến độ */}
      <div className="mb-2 px-1">
        <ProgressBar value={((idx + 1) / order.length) * 100} className="h-2" />
      </div>

      {/* Thông tin thẻ & Tags */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-1 text-xs text-muted">
        <span className="min-w-0 basis-full truncate font-bold text-ink sm:flex-1 sm:basis-auto sm:pr-2">{cur.collection.title}</span>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {isRepeat && <span className="rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-2.5 py-0.5 font-bold text-rose-600 dark:text-rose-400">Ôn lại</span>}
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

      {/* Thẻ lật 3D có hỗ trợ Touch Gesture */}
      <div
        className="flip-scene relative cursor-pointer select-none"
        onClick={handleFlip}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="button"
        tabIndex={0}
        aria-label="Nhấn để lật thẻ"
      >
        {/* Swipe Feedback Overlay */}
        {swipeHint && (
          <div className="absolute inset-0 z-30 flex items-center justify-center rounded-3xl bg-slate-900/60 backdrop-blur-2xs text-white text-2xl font-black animate-in fade-in zoom-in-75 duration-100">
            {swipeHint}
          </div>
        )}

        <div className={cx('flip-inner relative', flipped && 'flipped')}>
          {/* Mặt trước */}
          <div className={cx(cardFace, zoomClass, flipped && 'pointer-events-none absolute inset-0 overflow-hidden')}>
            <div className="flex flex-1 flex-col justify-center">{frontContent}</div>
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
              onClick={() => grade(g)}
              title={`${hint} (phím ${k})`}
              className={cx(
                'inline-flex h-12 items-center justify-center gap-1 rounded-xl px-1 text-sm font-bold transition active:scale-95 sm:gap-1.5 cursor-pointer',
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

      <p className="mt-3 text-center text-[11px] text-muted">
        <span>Vuốt trái: Quên · Vuốt phải: Được · Vuốt lên: Dễ</span>
        <span className="hidden md:inline"> · Phím Space để lật · K được · U quên · R đánh dấu</span>
      </p>

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
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5">
                <span className="font-medium text-ink">Lật thẻ trước / sau</span>
                <kbd className="rounded-md border border-line bg-card px-2 py-1 font-mono text-xs font-bold text-ink shadow-2xs">
                  Space / Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5">
                <span className="font-medium text-ink">Được: nhớ đúng (lên 1 hộp)</span>
                <kbd className="rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-2xs">
                  K
                </kbd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5">
                <span className="font-medium text-ink">Dễ: nhớ ngay (lên 2 hộp)</span>
                <kbd className="rounded-md border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950 px-2 py-1 font-mono text-xs font-bold text-sky-700 dark:text-sky-300 shadow-2xs">
                  E
                </kbd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5">
                <span className="font-medium text-ink">Khó: nhớ chật vật (giữ hộp, ôn sớm)</span>
                <kbd className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-2 py-1 font-mono text-xs font-bold text-amber-700 dark:text-amber-300 shadow-2xs">
                  H
                </kbd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5">
                <span className="font-medium text-ink">Chưa nhớ / Quên (về Hộp 1)</span>
                <kbd className="rounded-md border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950 px-2 py-1 font-mono text-xs font-bold text-rose-700 dark:text-rose-300 shadow-2xs">
                  U
                </kbd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5">
                <span className="font-medium text-ink">Đánh dấu ôn lại</span>
                <kbd className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-2 py-1 font-mono text-xs font-bold text-amber-700 dark:text-amber-300 shadow-2xs">
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
    </div>
  )
}
