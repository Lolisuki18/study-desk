import { useMemo, useState } from 'react'
import { ArrowLeft, Check, ChevronDown, ChevronRight, Eye, EyeOff, Search, Sparkles, X } from 'lucide-react'
import type { Entry } from '../../types'
import { Card, Button } from './index'
import { previewOf } from '../../utils/preview'
import { matcher, searchText } from '../../utils/search'
import { progressKey } from '../../data'

interface Props {
  entries: Entry[]
  title?: string
  onClose?: () => void
}

/** Cards drawn at once. "All collections" is thousands of questions; the rest is one click away. */
const PAGE = 100

export default function CramView({ entries, title = 'Ôn nhanh siêu tốc (Cram Mode)', onClose }: Props) {
  const [search, setSearch] = useState('')
  const [showAllAnswers, setShowAllAnswers] = useState(false)
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [limit, setLimit] = useState(PAGE)

  // Search text is built once per list, not on every keystroke.
  const texts = useMemo(() => entries.map((e) => searchText(e.item)), [entries])

  const filtered = useMemo(() => {
    if (!search.trim()) return entries
    // same matcher as the Search page: ignores diacritics unless you type them, every word must appear
    const match = matcher(search)
    return entries.filter((_, i) => match(texts[i]))
  }, [entries, texts, search])

  const visible = filtered.slice(0, limit)
  const toggleReveal = (key: string) => setRevealed((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/50 dark:from-slate-900/80 dark:via-slate-900 dark:to-indigo-950/40 p-4 sm:p-5 rounded-3xl border border-indigo-100 dark:border-indigo-900/50">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card hover:bg-slate-100 dark:hover:bg-slate-800 text-ink cursor-pointer"
              title="Quay lại"
              aria-label="Quay lại"
            >
              <ArrowLeft size={17} />
            </button>
          )}
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <Sparkles size={13} /> Chế độ lướt nhanh
            </span>
            <h1 className="text-lg sm:text-xl font-extrabold text-ink">{title}</h1>
          </div>
        </div>

        <Button variant="outline" onClick={() => setShowAllAnswers(!showAllAnswers)} className="text-xs py-1.5 px-3">
          {showAllAnswers ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{showAllAnswers ? 'Ẩn đáp án' : 'Hiện toàn bộ đáp án'}</span>
        </Button>
      </div>

      {/* Search and summary */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setLimit(PAGE)
            }}
            placeholder="Tìm trong câu hỏi, đáp án, giải thích (không cần gõ dấu)…"
            className="w-full rounded-2xl border border-line bg-card pl-10 pr-4 py-2 text-xs text-ink placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('')
                setLimit(PAGE)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
              aria-label="Xoá từ khoá"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <span className="text-xs font-semibold text-muted shrink-0">
          Hiển thị <b>{filtered.length}</b> / {entries.length} câu
        </span>
      </div>

      {/* List items */}
      <div className="space-y-2.5">
        {visible.map((e, idx) => {
          // ids repeat between collections (q-001 exists in several), so the pair identifies a card
          const key = progressKey(e.collection.id, e.item.id)
          const { q, a, exp } = previewOf(e.item)
          const isRevealed = showAllAnswers || revealed[key]

          return (
            <Card key={key} className="p-4 transition-all hover:border-indigo-300 dark:hover:border-indigo-800">
              <button
                type="button"
                onClick={() => toggleReveal(key)}
                aria-expanded={!!isRevealed}
                className="flex w-full items-start justify-between gap-3 text-left cursor-pointer select-none"
              >
                <span className="flex items-start gap-2.5 min-w-0">
                  <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 px-1 text-[11px] font-bold text-muted">
                    {idx + 1}
                  </span>
                  <span className="min-w-0 text-sm font-semibold text-ink leading-snug">{q}</span>
                </span>
                <span className="shrink-0 text-muted">{isRevealed ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
              </button>

              {isRevealed && (
                <div className="mt-3 pt-3 border-t border-line pl-8 space-y-2">
                  <div className="inline-flex items-start gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <Check size={14} className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{a}</span>
                  </div>

                  {exp && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-line">
                      <b className="text-ink">Giải thích:</b> {exp}
                    </p>
                  )}
                </div>
              )}
            </Card>
          )
        })}

        {filtered.length > visible.length && (
          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={() => setLimit((n) => n + PAGE)}>
              Hiện thêm {Math.min(PAGE, filtered.length - visible.length)} câu (còn {filtered.length - visible.length})
            </Button>
          </div>
        )}

        {filtered.length === 0 && <div className="py-12 text-center text-xs text-muted">Không tìm thấy câu hỏi phù hợp với từ khóa "{search}".</div>}
      </div>
    </div>
  )
}
