import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeftRight,
  Bookmark,
  Repeat,
  Check,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  RotateCcw,
  RotateCw,
  Shuffle,
  Sparkles,
  X,
} from 'lucide-react'
import type { Entry, Grade, Status } from '../../types'
import NoteBox from '../ui/NoteBox'
import { useProgress } from '../../features/learning/ProgressContext'
import { Button, Card, Empty, ProgressBar } from '../ui'
import { CardBack, CardFront } from './CardContent'
import { shuffle, cx } from '../../utils'
import { isMulti, sameKeys, toggleKey } from '../../utils/answers'
import { Link } from 'react-router-dom'
import { loadSettings, saveSettings } from '../../services/storage/settings'

type Filter = 'all' | Status | 'review'
const FILTERS: { v: Filter; label: string }[] = [
  { v: 'all', label: 'Tất cả thẻ' },
  { v: 'new', label: 'Thẻ mới' },
  { v: 'unknown', label: 'Chưa nhớ' },
  { v: 'known', label: 'Đã thuộc' },
  { v: 'review', label: 'Cần ôn lại' },
]

const GRADES: { g: Grade; label: string; hint: string; k: string; cls: string; icon?: typeof Check }[] = [
  { g: 'again', label: 'Quên', hint: 'Chưa nhớ: về hộp 1, ôn lại ngay', k: 'U', cls: 'bg-rose-100 text-rose-700 hover:bg-rose-200', icon: X },
  { g: 'hard', label: 'Khó', hint: 'Nhớ nhưng chật vật: giữ nguyên hộp, ôn lại sớm hơn', k: 'H', cls: 'bg-amber-100 text-amber-800 hover:bg-amber-200' },
  { g: 'good', label: 'Được', hint: 'Nhớ đúng: lên 1 hộp', k: 'K', cls: 'bg-emerald-500 text-white shadow-md shadow-emerald-200 hover:bg-emerald-600', icon: Check },
  { g: 'easy', label: 'Dễ', hint: 'Nhớ ngay lập tức: lên 2 hộp', k: 'E', cls: 'bg-sky-100 text-sky-800 hover:bg-sky-200' },
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
    // content changed (cards removed): the saved order is no longer reliable
    return r.keys.every((k) => known.has(k)) && r.keys.includes(r.cur) ? r : null
  } catch {
    return null
  }
}

export default function FlashcardSession({ entries, mode = 'study', resumeKey }: Props) {
  const { get, record, toggleReview } = useProgress()
  const useResume = mode === 'study' ? resumeKey : undefined
  // restored once; any change of filter / shuffle / restart drops it and builds a fresh deck
  const [resume, setResume] = useState<Resume | null>(() => loadResume(useResume, entries))
  const [filter, setFilter] = useState<Filter>(() => resume?.filter ?? 'all')
  const [shuffled, setShuffled] = useState(() => resume?.shuffled ?? (mode === 'study' && loadSettings().shuffleFlashcards))
  const [seed, setSeed] = useState(0)
  const [idx, setIdx] = useState(() => (resume ? Math.max(0, resume.keys.indexOf(resume.cur)) : 0))
  const [flipped, setFlipped] = useState(false)
  const [inverted, setInverted] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const getRef = useRef(get)
  getRef.current = get

  // The deck is a snapshot: changing a card's status must not make it vanish mid-session.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, filter, shuffled, seed, resume])

  // The running order starts as the deck; in learn-until-known mode wrong cards are re-inserted further down.
  const [learn, setLearn] = useState(() => loadSettings().learnUntilKnown)
  const [order, setOrder] = useState<Slot[]>(() => deck.map((e) => ({ e, repeat: false })))
  const [repeats, setRepeats] = useState(0)
  const [done, setDone] = useState(false)

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

  // Answers picked directly on multiple-choice cards. A pick is graded once; Known/Unknown then only moves on.
  // Multi-answer questions ("AB") collect a draft selection first and are graded when confirmed.
  const [picks, setPicks] = useState<Record<string, string>>({})
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  useEffect(() => {
    setPicks({})
    setDrafts({})
  }, [deck])
  // Remember where the learner is (study mode only); cleared when the deck is finished.
  const curKey = cur ? entryKey(cur) : ''
  useEffect(() => {
    if (!useResume) return
    try {
      if (done || !curKey) localStorage.removeItem(resumeStorageKey(useResume))
      else {
        const r: Resume = { filter, shuffled, keys: deck.map(entryKey), cur: curKey }
        localStorage.setItem(resumeStorageKey(useResume), JSON.stringify(r))
      }
    } catch {
      /* storage unavailable: just don't resume */
    }
  }, [useResume, done, curKey, filter, shuffled, deck])

  const pickKey = cur ? `${idx}::${cur.collection.id}::${cur.item.id}` : ''
  const picked = picks[pickKey]
  /** Put the current card back into the queue a few cards later. Returns whether it was re-queued. */
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
      setPicks((s) => ({ ...s, [pickKey]: keys }))
      record(
        // a card that already failed in this session only earns "hard": right after a miss is not real recall
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
      setFlipped(false)
      setIdx((i) => Math.min(order.length - 1, Math.max(0, i + d)))
    },
    [order.length],
  )

  const grade = useCallback(
    (g: Grade) => {
      if (!cur) return
      const last = idx >= order.length - 1
      if (picks[pickKey] !== undefined) {
        // already graded by the pick: don't count the same card twice
        if (last) setDone(true)
        else go(1)
        return
      }
      record(
        [{ collectionId: cur.collection.id, itemId: cur.item.id, correct: g !== 'again', grade: g !== 'again' && isRepeat ? 'hard' : g }],
        mode === 'review' ? 'review' : 'flashcard',
        { clearReview: mode === 'review' },
      )
      const grew = g === 'again' && requeue()
      setFlipped(false)
      if (last && !grew) setDone(true)
      else setIdx((i) => i + 1) // the queue is at least one longer than idx here
    },
    [cur, record, go, mode, picks, pickKey, idx, order.length, isRepeat, requeue],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || (e.target as HTMLElement | null)?.closest?.('input,textarea,select')) return
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
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
        if (cur) toggleReview(cur.collection.id, cur.item.id)
      } else if (e.key === 'f' || e.key === 'F') {
        setInverted((v) => !v)
      } else if (e.key === '?') {
        setShowHelp((s) => !s)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, grade, cur, toggleReview, pick, done])

  const pill = (active: boolean) =>
    cx(
      'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors',
      active ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100',
    )

  const toolbar = (
    <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-white px-2.5 py-2 shadow-xs">
      <div className="flex flex-wrap items-center gap-1.5">
        {mode === 'study' && (
          <>
            <select
              value={filter}
              onChange={(e) => {
                setResume(null)
                setFilter(e.target.value as Filter)
              }}
              className="rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-100"
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
              <Shuffle size={13} /> Trộn thẻ
            </button>
            {shuffled && (
              <button
                className={pill(false)}
                onClick={() => {
                  setResume(null)
                  setSeed((s) => s + 1)
                }}
                title="Trộn lại"
              >
                <RotateCcw size={13} />
              </button>
            )}
            <button className={pill(inverted)} onClick={() => setInverted((v) => !v)} title="Đảo mặt trước / sau (phím F)">
              <ArrowLeftRight size={13} /> Đảo mặt
            </button>
          </>
        )}
        <button
          className={pill(learn)}
          onClick={() => {
            saveSettings({ ...loadSettings(), learnUntilKnown: !learn })
            setLearn(!learn)
          }}
          title="Thẻ trả lời sai sẽ quay lại sau vài thẻ, lặp đến khi bạn nhớ mới xong phiên"
        >
          <Repeat size={13} /> Học đến khi thuộc
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setShowHelp((s) => !s)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
          title="Phím tắt (?)"
        >
          <HelpCircle size={16} />
        </button>
        <span className="rounded-xl bg-slate-900 px-3 py-1.5 font-mono text-xs font-bold text-white">
          {order.length ? `${Math.min(idx + 1, order.length)} / ${order.length}` : '0 / 0'}
        </span>
      </div>
    </div>
  )

  if (done)
    return (
      <>
        {toolbar}
        <Card className="p-8 text-center">
          <div className="text-4xl">🎉</div>
          <h2 className="mt-2 text-xl font-bold text-ink">Xong phiên học</h2>
          <p className="mt-2 text-sm text-muted">
            Bạn đã đi hết {order.length - repeats} thẻ
            {repeats > 0 ? `, trong đó có ${repeats} lượt phải ôn lại vì trả lời sai.` : ', không sai thẻ nào.'}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button
              onClick={() => {
                setResume(null)
                setSeed((s) => s + 1)
              }}
            >
              <RotateCcw size={15} /> Học lại bộ thẻ này
            </Button>
            <Link to="/">
              <Button variant="primary">Về Tổng quan</Button>
            </Link>
          </div>
        </Card>
      </>
    )

  if (!order.length || !cur)
    return (
      <>
        {toolbar}
        <Empty>{mode === 'review' ? 'Tuyệt vời! Không còn mục nào cần ôn hôm nay 🎉' : 'Không có thẻ nào khớp bộ lọc này.'}</Empty>
      </>
    )

  const statusLabel = p?.status === 'known' ? 'Đã thuộc' : p?.status === 'unknown' ? 'Chưa nhớ' : 'Mới'

  const front = <CardFront item={cur.item} picked={picked} onPick={pick} draft={drafts[pickKey]} onConfirm={confirmPick} />
  const frontContent = inverted ? <CardBack item={cur.item} /> : front
  const backContent = inverted ? front : <CardBack item={cur.item} />

  const cardFace =
    'flip-face flex min-h-[260px] flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_10px_28px_-6px_rgba(15,23,42,0.08),0_3px_8px_-2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_14px_36px_-6px_rgba(15,23,42,0.12)] md:p-7'

  return (
    <div className="mx-auto w-full max-w-3xl">
      {toolbar}

      {/* thanh tiến độ ôm sát mép thẻ */}
      <div className="mb-2 px-1">
        <ProgressBar value={((idx + 1) / order.length) * 100} />
      </div>

      {/* thông tin thẻ */}
      <div className="mb-2 flex items-center justify-between px-1 text-xs text-muted">
        <span className="truncate pr-2 font-semibold text-slate-600">{cur.collection.title}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          {isRepeat && <span className="rounded-full bg-rose-50 px-2.5 py-0.5 font-bold text-rose-600">Ôn lại</span>}
          {p && p.level > 0 && (
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 font-bold text-indigo-700">Hộp {p.level}/5</span>
          )}
          <span
            className={cx(
              'rounded-full px-2.5 py-0.5 font-bold',
              p?.status === 'known' && 'bg-emerald-50 text-emerald-700',
              p?.status === 'unknown' && 'bg-rose-50 text-rose-700',
              p?.status !== 'known' && p?.status !== 'unknown' && 'bg-slate-100 text-slate-600',
            )}
          >
            {statusLabel}
          </span>
          <button
            onClick={() => toggleReview(cur.collection.id, cur.item.id)}
            className={cx(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold transition-colors',
              p?.review ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
            )}
            title="Đánh dấu cần ôn lại (phím R)"
          >
            <Bookmark size={11} className={cx(p?.review && 'fill-white')} /> {p?.review ? 'Đã đánh dấu' : 'Đánh dấu'}
          </button>
        </div>
      </div>

      {/* thẻ lật 3D */}
      <div
        className="flip-scene cursor-pointer select-none"
        onClick={() => setFlipped((f) => !f)}
        role="button"
        tabIndex={0}
        aria-label="Nhấn để lật thẻ"
      >
        <div className={cx('flip-inner relative', flipped && 'flipped')}>
          {/* mặt không hiển thị bị rút khỏi luồng bố cục, để thẻ chỉ cao bằng mặt đang xem */}
          <div className={cx(cardFace, flipped && 'pointer-events-none absolute inset-0 overflow-hidden')}>
            <div className="flex flex-1 flex-col justify-center">{frontContent}</div>
            <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400">
              <RotateCw size={12} />
              <span>Nhấn vào thẻ hoặc</span>
              <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">Space</kbd>
              <span>để lật</span>
            </div>
          </div>

          <div className={cx(cardFace, 'flip-back', !flipped && 'pointer-events-none absolute inset-0 overflow-hidden')}>
            <div className="flex flex-1 flex-col justify-center">{backContent}</div>
            <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400">
              <span>Tự đánh giá:</span>
              <kbd className="rounded-md bg-rose-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-600">U Quên</kbd>
              <kbd className="rounded-md bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-700">H Khó</kbd>
              <kbd className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700">K Được</kbd>
              <kbd className="rounded-md bg-sky-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-sky-700">E Dễ</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Action Dock: một thanh điều khiển ngay dưới thẻ */}
      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-line bg-white p-2 shadow-sm">
        <button
          onClick={() => go(-1)}
          disabled={idx === 0}
          aria-label="Thẻ trước"
          className="inline-flex h-12 items-center justify-center gap-1 rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 sm:px-4"
        >
          <ChevronLeft size={18} /> <span className="hidden sm:inline">Trước</span>
        </button>

        {/* 4 mức tự tin: Quên về hộp 1 · Khó giữ hộp, ôn lại sớm · Được lên 1 hộp · Dễ lên 2 hộp */}
        <div className="grid flex-1 grid-cols-4 gap-1.5 sm:gap-2">
          {GRADES.map(({ g, label, hint, k, cls, icon: Icon }) => (
            <button
              key={g}
              onClick={() => grade(g)}
              title={`${hint} (phím ${k})`}
              className={cx(
                'inline-flex h-12 items-center justify-center gap-1 rounded-xl px-1 text-sm font-bold transition active:scale-95 sm:gap-1.5',
                cls,
              )}
            >
              {Icon && <Icon size={16} strokeWidth={2.75} className="hidden sm:block" />}
              <span>{label}</span>
              <kbd className="hidden rounded bg-white/50 px-1.5 font-mono text-[10px] md:inline">{k}</kbd>
            </button>
          ))}
        </div>

        <button
          onClick={() => go(1)}
          disabled={idx >= order.length - 1}
          aria-label="Thẻ sau"
          className="inline-flex h-12 items-center justify-center gap-1 rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 sm:px-4"
        >
          <span className="hidden sm:inline">Sau</span> <ChevronRight size={18} />
        </button>
      </div>

      <NoteBox collectionId={cur.collection.id} itemId={cur.item.id} className="mt-3" />

      <p className="mt-3 text-center text-[11px] text-slate-400">
        Space lật · U quên · H khó · K được · E dễ · R đánh dấu · ← → chuyển thẻ · A–D hoặc 1–4 chọn đáp án
      </p>

      {/* Keyboard Shortcuts Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e?.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-600" />
                <h3 className="text-base font-bold text-ink">Phím tắt nhanh</h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="rounded-lg p-1 text-muted hover:bg-slate-100 hover:text-ink transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
                <span className="font-medium text-slate-700">Lật thẻ trước / sau</span>
                <kbd className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs font-bold shadow-2xs">
                  Space / Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
                <span className="font-medium text-slate-700">Được: nhớ đúng (lên 1 hộp)</span>
                <kbd className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 font-mono text-xs font-bold text-emerald-700 shadow-2xs">
                  K
                </kbd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
                <span className="font-medium text-slate-700">Dễ: nhớ ngay (lên 2 hộp)</span>
                <kbd className="rounded-md border border-sky-200 bg-sky-50 px-2 py-1 font-mono text-xs font-bold text-sky-700 shadow-2xs">
                  E
                </kbd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
                <span className="font-medium text-slate-700">Khó: nhớ chật vật (giữ hộp, ôn sớm)</span>
                <kbd className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 font-mono text-xs font-bold text-amber-700 shadow-2xs">
                  H
                </kbd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
                <span className="font-medium text-slate-700">Chưa nhớ / Quên (về Hộp 1)</span>
                <kbd className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 font-mono text-xs font-bold text-rose-700 shadow-2xs">
                  U
                </kbd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
                <span className="font-medium text-slate-700">Đánh dấu ôn lại</span>
                <kbd className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 font-mono text-xs font-bold text-amber-700 shadow-2xs">
                  R
                </kbd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
                <span className="font-medium text-slate-700">Chuyển thẻ Trước / Sau</span>
                <kbd className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs font-bold shadow-2xs">
                  ← / →
                </kbd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
                <span className="font-medium text-slate-700">Đảo mặt trước / sau</span>
                <kbd className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs font-bold shadow-2xs">
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
