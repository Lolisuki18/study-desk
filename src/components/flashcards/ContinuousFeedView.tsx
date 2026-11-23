import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  HelpCircle,
  RotateCw,
  Search,
  Sparkles,
  Star,
  Volume2,
  X,
} from 'lucide-react'
import type { Entry, Grade, Item, MultipleChoiceContent } from '../../types'
import { Card, Button, ProgressBar, useToast } from '../ui'
import { useProgress } from '../../features/learning/ProgressContext'
import { useStarred } from '../../services/storage/starred'
import { itemTitle } from '../../data'
import { cx } from '../../utils'
import { isMulti } from '../../utils/answers'
import { playSound } from '../../utils/sound'
import { playMechSound } from '../../utils/mechSound'
import { haptic } from '../../utils/haptic'
import { speakText } from '../../utils/speech'
import { Enrichment } from './CardContent'
import HighlightableText from '../ui/HighlightableText'
import AnswerNote from '../ui/AnswerNote'

export type CardTheme = 'default' | 'paper' | 'midnight'
export type CardFont = 'sans' | 'serif' | 'mono'

interface Props {
  entries: Entry[]
  title?: string
  onSwitchToFlip: () => void
  cardTheme: CardTheme
  cardFont: CardFont
}

const GRADES: { g: Grade; label: string; cls: string }[] = [
  { g: 'again', label: 'Quên', cls: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900' },
  { g: 'hard', label: 'Khó', cls: 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900' },
  { g: 'good', label: 'Được', cls: 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900' },
  { g: 'easy', label: 'Dễ', cls: 'bg-sky-50 text-sky-800 hover:bg-sky-100 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900' },
]

export default function ContinuousFeedView({ entries, title, onSwitchToFlip, cardTheme, cardFont }: Props) {
  const { get, record, toggleReview } = useProgress()
  const { isStarred, toggle: toggleStar } = useStarred()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'known' | 'unknown' | 'starred'>('all')
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [showAll, setShowAll] = useState(false)
  const [recentRated, setRecentRated] = useState<Record<string, Grade>>({})

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const p = get(e.collection.id, e.item.id)
      const starred = isStarred(e.collection.id, e.item.id)

      if (filter === 'known' && p?.status !== 'known') return false
      if (filter === 'unknown' && p?.status !== 'unknown') return false
      if (filter === 'starred' && !starred) return false

      if (search.trim()) {
        const text = (itemTitle(e.item) + ' ' + (e.item.type === 'multiple-choice' ? e.item.content.explanation ?? '' : '')).toLowerCase()
        return text.includes(search.toLowerCase().trim())
      }
      return true
    })
  }, [entries, search, filter, get, isStarred])

  const toggleItem = (key: string) => {
    setRevealed((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleShowAllToggle = () => {
    const next = !showAll
    setShowAll(next)
    const map: Record<string, boolean> = {}
    filteredEntries.forEach((e) => {
      map[`${e.collection.id}::${e.item.id}`] = next
    })
    setRevealed(map)
  }

  const handleGrade = (e: Entry, g: Grade) => {
    const key = `${e.collection.id}::${e.item.id}`
    playSound(g === 'again' ? 'wrong' : 'correct')
    haptic(g === 'again' ? 'error' : 'success')
    playMechSound('keydown')

    record(
      [{ collectionId: e.collection.id, itemId: e.item.id, correct: g !== 'again', grade: g }],
      'flashcard'
    )

    setRecentRated((prev) => ({ ...prev, [key]: g }))
    toast.success(`Đã đánh giá: ${g === 'again' ? 'Quên' : g === 'hard' ? 'Khó' : g === 'good' ? 'Được' : 'Dễ'}`)
  }

  const fontClass = cardFont === 'serif' ? 'font-serif' : cardFont === 'mono' ? 'font-mono' : 'font-sans'

  return (
    <div className={cx('mx-auto w-full max-w-3xl space-y-4 pb-16', fontClass)}>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 dark:border-line bg-card p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchToFlip}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-line bg-slate-50 dark:bg-slate-800 text-ink hover:bg-slate-100 transition-colors cursor-pointer"
            title="Quay lại chế độ lật thẻ 3D"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <Sparkles size={13} />
              <span>Chế độ cuộn liên tục (Feed View)</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-ink">{title || 'Danh sách thẻ ghi nhớ'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleShowAllToggle}
            className="text-xs py-1.5 px-3"
          >
            {showAll ? <EyeOff size={14} /> : <Eye size={14} />}
            <span className="hidden sm:inline">{showAll ? 'Ẩn tất cả đáp án' : 'Hiện tất cả đáp án'}</span>
          </Button>

          <Button
            variant="primary"
            onClick={onSwitchToFlip}
            className="text-xs py-1.5 px-3.5"
          >
            <RotateCw size={14} />
            <span>Chế độ lật thẻ</span>
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-slate-200 dark:border-line bg-card p-3 shadow-2xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm nội dung thẻ..."
            className="w-full rounded-xl border border-slate-200 dark:border-line bg-slate-50 dark:bg-slate-800/70 py-1.5 pl-9 pr-3 text-xs text-ink outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1">
          {(['all', 'known', 'unknown', 'starred'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={cx(
                'rounded-xl px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer',
                filter === mode
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-muted hover:text-ink'
              )}
            >
              {mode === 'all' ? 'Tất cả' : mode === 'known' ? 'Đã thuộc' : mode === 'unknown' ? 'Chưa nhớ' : 'Có sao ★'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Count */}
      <div className="flex items-center justify-between px-1 text-xs text-muted font-medium">
        <span>Hiển thị {filteredEntries.length} / {entries.length} thẻ</span>
        <span>Chạm vào thẻ để mở đáp án & đánh giá nhanh</span>
      </div>

      {/* Feed Card List */}
      <div className="space-y-3.5">
        {filteredEntries.map((e, index) => {
          const itemKey = `${e.collection.id}::${e.item.id}`
          const isOpen = !!revealed[itemKey] || showAll
          const p = get(e.collection.id, e.item.id)
          const starred = isStarred(e.collection.id, e.item.id)
          const rated = recentRated[itemKey]

          return (
            <div
              key={itemKey}
              className={cx(
                'rounded-3xl border transition-all duration-200 p-4 sm:p-5 shadow-xs',
                cardTheme === 'paper'
                  ? 'bg-[#faf6ed] dark:bg-[#1a1917] border-[#e8dfcf] dark:border-[#2e2c28] text-[#2c2825] dark:text-[#ede7de]'
                  : cardTheme === 'midnight'
                  ? 'bg-[#030712] border-slate-800/80 text-slate-100'
                  : 'bg-card border-slate-200 dark:border-line text-ink'
              )}
            >
              {/* Item Top Meta */}
              <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100 dark:border-line/60">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold text-muted truncate max-w-[200px] sm:max-w-xs">
                    {e.collection.title}
                  </span>
                  {p && p.level > 0 && (
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-muted">
                      Hộp {p.level}/5
                    </span>
                  )}
                  {rated && (
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 animate-in fade-in">
                      ✓ Đã lưu ({rated === 'again' ? 'Quên' : rated === 'hard' ? 'Khó' : rated === 'good' ? 'Được' : 'Dễ'})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      speakText(itemTitle(e.item))
                    }}
                    className="p-1.5 text-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Đọc câu hỏi"
                  >
                    <Volume2 size={14} />
                  </button>

                  <button
                    onClick={() => toggleStar(e.collection.id, e.item.id)}
                    className={cx(
                      'p-1.5 rounded-lg transition-colors cursor-pointer',
                      starred
                        ? 'text-amber-500 fill-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                        : 'text-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                    title="Gắn sao ưu tiên"
                  >
                    <Star size={14} className={starred ? 'fill-amber-500' : ''} />
                  </button>

                  <button
                    onClick={() => {
                      toggleReview(e.collection.id, e.item.id)
                      toast.info(!p?.review ? 'Đã đánh dấu cần ôn lại' : 'Đã bỏ đánh dấu')
                    }}
                    className={cx(
                      'p-1.5 rounded-lg transition-colors cursor-pointer',
                      p?.review
                        ? 'text-rose-500 fill-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        : 'text-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                    title="Đánh dấu cần ôn"
                  >
                    <Bookmark size={14} className={p?.review ? 'fill-rose-500' : ''} />
                  </button>
                </div>
              </div>

              {/* Question Body */}
              <div
                onClick={() => toggleItem(itemKey)}
                className="cursor-pointer group"
              >
                {e.item.type === 'multiple-choice' && (
                  <div className="space-y-2">
                    <HighlightableText
                      text={e.item.content.question}
                      itemKey={itemKey}
                      field="q"
                      className="text-base font-bold text-ink leading-relaxed group-hover:text-indigo-600 transition-colors"
                      as="div"
                    />

                    {/* Options Preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {e.item.content.options.map((o) => {
                        const isCorrect = isOpen && e.item.type === 'multiple-choice' && e.item.content.answer.includes(o.key)
                        return (
                          <div
                            key={o.key}
                            className={cx(
                              'flex items-center gap-2.5 rounded-xl border p-2 text-xs transition-colors',
                              isCorrect
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-bold'
                                : 'border-slate-200/80 dark:border-line bg-slate-50/50 dark:bg-slate-800/30 text-ink'
                            )}
                          >
                            <span
                              className={cx(
                                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black',
                                isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-muted'
                              )}
                            >
                              {o.key}
                            </span>
                            <span className="truncate">{o.text}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {e.item.type === 'vocabulary' && (
                  <div>
                    <span className="text-xl font-black text-ink">{e.item.content.term}</span>
                    {e.item.content.pronunciation && (
                      <span className="ml-2 font-mono text-xs text-muted">{e.item.content.pronunciation}</span>
                    )}
                  </div>
                )}

                {e.item.type === 'true-false' && (
                  <div className="text-base font-bold text-ink">{e.item.content.statement}</div>
                )}

                {e.item.type === 'theory' && (
                  <div className="text-base font-extrabold text-ink">{e.item.content.concept}</div>
                )}

                {/* Disclosure Bar */}
                <div className="mt-3 flex items-center justify-between pt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span className="flex items-center gap-1">
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {isOpen ? 'Thu gọn đáp án & giải thích' : 'Xem đáp án & giải thích'}
                  </span>
                  {!isOpen && <span className="text-muted font-normal text-[11px]">Bấm để mở</span>}
                </div>
              </div>

              {/* Revealed Answer Box */}
              {isOpen && (
                <div className="mt-3.5 space-y-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-3.5 sm:p-4 animate-in fade-in duration-150">
                  {e.item.type === 'multiple-choice' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 size={15} />
                        <span>Đáp án đúng: {e.item.content.answer}</span>
                      </div>

                      {e.item.content.explanation && (
                        <div className="rounded-xl border border-slate-200 dark:border-line bg-card p-3 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                          <HighlightableText
                            text={e.item.content.explanation}
                            itemKey={itemKey}
                            field="e"
                            as="p"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {e.item.type === 'vocabulary' && (
                    <div className="space-y-1.5 text-sm">
                      <div className="font-extrabold text-emerald-600 text-base">{e.item.content.meaning}</div>
                      {e.item.content.example && (
                        <p className="italic text-xs text-muted">"{e.item.content.example}"</p>
                      )}
                    </div>
                  )}

                  {e.item.type === 'true-false' && (
                    <div className="text-sm font-bold text-emerald-600">
                      Đáp án: {e.item.content.answer ? 'Đúng' : 'Sai'}
                    </div>
                  )}

                  {e.item.type === 'theory' && (
                    <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                      {e.item.content.definition}
                    </div>
                  )}

                  <Enrichment item={e.item} />
                  <AnswerNote itemKey={itemKey} />

                  {/* Quick Rating Buttons directly on card */}
                  <div className="pt-2 border-t border-indigo-100/60 dark:border-indigo-900/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-muted">Đánh giá nhanh thẻ này:</span>
                      <div className="grid grid-cols-4 gap-1 sm:gap-2">
                        {GRADES.map(({ g, label, cls }) => (
                          <button
                            key={g}
                            onClick={() => handleGrade(e, g)}
                            className={cx(
                              'rounded-xl border px-2.5 py-1 text-xs font-bold transition-transform active:scale-95 cursor-pointer',
                              cls
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filteredEntries.length === 0 && (
          <div className="py-12 text-center text-muted">
            Không tìm thấy thẻ nào khớp với từ khóa tìm kiếm hoặc bộ lọc.
          </div>
        )}
      </div>
    </div>
  )
}
