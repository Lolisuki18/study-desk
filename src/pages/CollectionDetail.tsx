import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  
  
  Layers,
  ListChecks,
  RefreshCw,
  RotateCcw,
  Search,
  
  X,
} from 'lucide-react'
import { getCollection, itemTitle } from '../data'
import { collectionStats, useProgress } from '../features/learning/ProgressContext'
import { isMastered, reviewReasons } from '../services/review/srs'
import { Card, Empty, Stat } from '../components/ui'
import CramView from '../components/ui/CramView'
import { cx, pct } from '../utils'
import { getContentTypeBadge, getSubjectColor } from '../components/dashboard/CollectionCard'

type StatusFilter = 'all' | 'need' | 'mastered' | 'unknown' | 'new'

export default function CollectionDetail() {
  const { id = '' } = useParams()
  const c = getCollection(id)
  const { progress, get, resetCollection } = useProgress()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [showCram, setShowCram] = useState(false)

  // Every hook stays above the early returns below: returning early between hooks changes their number from one
  // render to the next, and React then throws and blanks the whole app (that is what the Cram button used to do).
  const filteredItems = useMemo(() => {
    if (!c) return []
    return c.items.map((it, n) => ({ it, originalIdx: n })).filter(({ it }) => {
      const p = get(c.id, it.id)
      const reasons = reviewReasons(p)
      const title = itemTitle(it).toLowerCase()
      const matchQ = title.includes(q.toLowerCase())

      if (!matchQ) return false

      if (filter === 'need') return reasons.length > 0
      if (filter === 'mastered') return isMastered(p)
      if (filter === 'unknown') return p?.status === 'unknown'
      if (filter === 'new') return !p || p.status === 'new'
      return true
    })
  }, [c, q, filter, get, progress])

  if (!c) return <Empty>Không tìm thấy bộ học "{id}".</Empty>

  if (showCram) {
    const entries = c.items.map((item) => ({ collection: c, item }))
    return <CramView entries={entries} title={`Lướt nhanh: ${c.title}`} onClose={() => setShowCram(false)} />
  }

  const st = collectionStats(c.id, c.items.map((i) => i.id), progress)
  const percent = pct(st.mastered, st.total)
  const badge = getContentTypeBadge(c.contentType)
  const BadgeIcon = badge.icon
  const subjectStyle = getSubjectColor(c.subject)

  return (
    <div>
      <Link
        to="/collections"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={14} /> Quay lại danh sách bộ học
      </Link>

      {/* Collection Header */}
      <div className="mb-6 rounded-3xl border border-line bg-card p-6 md:p-8 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={cx(
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider',
              subjectStyle,
            )}
          >
            {c.subject}
          </span>
          <span
            className={cx(
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
              badge.color,
            )}
          >
            <BadgeIcon size={12} />
            <span>{badge.label}</span>
          </span>
          <span className="text-xs text-muted font-medium">· {c.items.length} mục kiến thức</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink">{c.title}</h1>
        {c.description && (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">{c.description}</p>
        )}
        {c.source?.document && (
          <p className="mt-3 text-xs text-muted italic">Nguồn tài liệu: {c.source.document}</p>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link
            to={`/flashcards/${c.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-line bg-white dark:bg-card px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300 active:scale-[0.98] transition-all"
          >
            <Layers size={15} className="text-indigo-600 dark:text-indigo-400" />
            <span>Học thẻ ghi nhớ</span>
          </Link>
          <Link
            to={`/review?c=${c.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-line bg-white dark:bg-card px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-300 active:scale-[0.98] transition-all"
          >
            <RefreshCw size={15} className="text-amber-600 dark:text-amber-400" />
            <span>Ôn tập ({st.need})</span>
          </Link>
          <Link
            to={`/quiz/${c.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 active:scale-[0.98] transition-all"
          >
            <ListChecks size={15} />
            <span>Làm trắc nghiệm</span>
          </Link>
          <button
            onClick={() => setShowCram(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/40 px-4 py-2.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 shadow-2xs hover:bg-indigo-100 hover:border-indigo-300 active:scale-[0.98] transition-all cursor-pointer"
          >
            <BookOpen size={15} className="text-indigo-600 dark:text-indigo-400" />
            <span>Lướt nhanh (Cram)</span>
          </button>
          <button
            onClick={async () => {
              if (
                window.confirm(
                  `Học lại từ đầu "${c.title}"?\n\nTiến độ, hoạt động và lịch sử thi thử của riêng bộ này sẽ bị xoá (các bộ khác giữ nguyên). Không thể hoàn tác.`,
                )
              )
                await resetCollection(c.id)
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-line bg-white dark:bg-card px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-muted shadow-2xs hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 active:scale-[0.98] transition-all cursor-pointer"
            title="Xoá tiến độ của riêng bộ này để học lại"
          >
            <RotateCcw size={15} />
            <span>Học lại từ đầu</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat
          label="Đã thành thạo"
          value={`${st.mastered}/${st.total}`}
          tone="ok"
          hint={`${percent}% tổng nội dung`}
        />
        <Stat label="Đã học qua" value={st.studied} hint={`/ ${st.total} mục`} />
        <Stat
          label="Cần ôn lại"
          value={st.need}
          tone={st.need ? 'err' : undefined}
          hint={st.need > 0 ? 'Ưu tiên ôn tập' : 'Đang nắm tốt'}
        />
      </div>

      {/* Items List Section */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={cx(
              'rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors',
              filter === 'all' ? 'bg-slate-900 text-white' : 'border border-line bg-card text-muted hover:text-ink',
            )}
          >
            Tất cả ({c.items.length})
          </button>
          {st.need > 0 && (
            <button
              onClick={() => setFilter('need')}
              className={cx(
                'rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors',
                filter === 'need' ? 'bg-rose-600 text-white' : 'border border-line bg-card text-rose-600 hover:bg-rose-50',
              )}
            >
              Cần ôn ({st.need})
            </button>
          )}
          <button
            onClick={() => setFilter('mastered')}
            className={cx(
              'rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors',
              filter === 'mastered' ? 'bg-emerald-600 text-white' : 'border border-line bg-card text-emerald-600 hover:bg-emerald-50',
            )}
          >
            Đã thuộc ({st.mastered})
          </button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm câu hỏi…"
            className="w-52 rounded-lg border border-line bg-card pl-8 pr-7 py-1.5 text-xs outline-none focus:border-indigo-500"
          />
          {q && (
            <button onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Items Card List */}
      <Card className="divide-y divide-line/70 overflow-hidden">
        {filteredItems.length > 0 ? (
          filteredItems.map(({ it, originalIdx }) => {
            const p = get(c.id, it.id)
            const reasons = reviewReasons(p)

            return (
              <div
                key={it.id}
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50/70 transition-colors"
              >
                <span className="w-8 shrink-0 font-mono text-xs font-bold text-slate-400">
                  {originalIdx + 1}
                </span>

                <span className="min-w-0 flex-1 font-medium text-slate-800 truncate">
                  {itemTitle(it)}
                </span>

                {p?.review && (
                  <span className="shrink-0 rounded bg-amber-50 p-1 text-amber-600" title="Đã đánh dấu ôn tập">
                    <Bookmark size={13} className="fill-amber-600" />
                  </span>
                )}

                {reasons.length > 0 && (
                  <span className="shrink-0 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                    {{ unknown: 'chưa biết', incorrect: 'làm sai', marked: 'đã đánh dấu', due: 'đến hạn' }[reasons[0]]}
                  </span>
                )}

                <span
                  className={cx(
                    'w-20 shrink-0 text-right text-xs font-bold',
                    p?.status === 'known' ? 'text-emerald-600' : p?.status === 'unknown' ? 'text-rose-600' : 'text-slate-400',
                  )}
                >
                  {p?.status === 'known' ? 'Đã biết' : p?.status === 'unknown' ? 'Chưa biết' : 'Mới'}
                </span>
              </div>
            )
          })
        ) : (
          <div className="p-8 text-center text-sm text-muted">
            Không tìm thấy câu hỏi nào phù hợp với bộ lọc.
          </div>
        )}
      </Card>
    </div>
  )
}
