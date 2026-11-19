import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, BookOpen, CheckCircle, FileText, Search, Sparkles, Star, X } from 'lucide-react'
import { allEntries, collections, progressKey } from '../data'
import { useProgress } from '../features/learning/ProgressContext'
import { useStarred } from '../services/storage/starred'
import ItemSummary from '../components/ui/ItemSummary'
import { Card, Empty, PageHeader } from '../components/ui'
import { matcher, searchText } from '../utils/search'
import { cx } from '../utils'

const LIMIT = 80

const QUICK_TAGS = [
  'Cương lĩnh 1930',
  'Sứ mệnh lịch sử',
  'Thời kỳ quá độ',
  'Đại hội VI 1986',
  'Giai cấp công nhân',
  'Dân chủ XHCN',
  'Liên minh công nông',
  'Cách mạng tháng Tám',
]

type FilterType = 'all' | 'starred' | 'explanation' | 'mistakes' | 'mastered'

// Built once: the bundled content never changes while the app is open.
let index: { entry: ReturnType<typeof allEntries>[number]; text: string }[] | null = null
const getIndex = () => (index ??= allEntries().map((entry) => ({ entry, text: searchText(entry.item) })))

export default function SearchPage() {
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') ?? ''
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const { notes, progress } = useProgress()
  const { isStarred } = useStarred()

  const subjects = useMemo(() => [...new Set(collections.map((c) => c.subject))].sort(), [])

  const setQuery = (val: string) => {
    if (val.trim()) setSp({ q: val }, { replace: true })
    else setSp({}, { replace: true })
  }

  const hasSearch = q.trim().length >= 2 || filterType !== 'all'

  const results = useMemo(() => {
    if (!hasSearch) return []
    const match = q.trim().length >= 2 ? matcher(q) : null

    return getIndex()
      .filter(({ entry, text }) => {
        if (selectedSubject !== 'all' && entry.collection.subject !== selectedSubject) {
          return false
        }

        const key = progressKey(entry.collection.id, entry.item.id)
        const p = progress.get(key)
        const note = notes.get(key)?.text

        if (match && !match(note ? `${text}\n${note}` : text)) {
          return false
        }

        if (filterType === 'starred') {
          if (!isStarred(entry.collection.id, entry.item.id)) return false
        } else if (filterType === 'explanation') {
          const hasExp = ('explanation' in entry.item.content && !!entry.item.content.explanation) || !!entry.item.enrichment
          if (!hasExp) return false
        } else if (filterType === 'mistakes') {
          if (!p || p.incorrect < 1) return false
        } else if (filterType === 'mastered') {
          if (!p || p.level < 2 || p.status !== 'known') return false
        }

        return true
      })
      .map((x) => x.entry)
  }, [hasSearch, q, selectedSubject, filterType, progress, notes, isStarred])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tìm kiếm toàn cục & Bộ sưu tập"
        subtitle="Tra cứu nhanh câu hỏi, đáp án, lọc câu hỏi sao vàng ôn tủ và câu có giải thích chi tiết"
      />

      {/* Search Input Box */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập từ khóa tìm kiếm (VD: cuong linh 1930, giai cap cong nhan, dai hoi VI…)"
          className="w-full rounded-2xl border border-line bg-card py-3.5 pl-11 pr-11 text-[15px] font-medium text-ink outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 shadow-xs"
        />
        {q && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Xoá từ khoá"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Smart Quick Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-muted font-bold mr-1">Bộ lọc nhanh:</span>
        <button
          onClick={() => setFilterType('all')}
          className={cx(
            'rounded-xl px-2.5 py-1 font-semibold transition-all cursor-pointer',
            filterType === 'all'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
              : 'border border-line bg-card text-muted hover:text-ink',
          )}
        >
          Tất cả
        </button>
        <button
          onClick={() => setFilterType(filterType === 'starred' ? 'all' : 'starred')}
          className={cx(
            'rounded-xl px-2.5 py-1 font-semibold transition-all cursor-pointer flex items-center gap-1 border',
            filterType === 'starred'
              ? 'bg-amber-500 border-amber-600 text-white shadow-2xs font-bold'
              : 'border-line bg-card text-muted hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400',
          )}
        >
          <Star size={13} className={cx(filterType === 'starred' && 'fill-white')} />
          <span>Đã gắn sao (Ôn tủ)</span>
        </button>
        <button
          onClick={() => setFilterType(filterType === 'explanation' ? 'all' : 'explanation')}
          className={cx(
            'rounded-xl px-2.5 py-1 font-semibold transition-all cursor-pointer flex items-center gap-1 border',
            filterType === 'explanation'
              ? 'bg-indigo-600 border-indigo-700 text-white shadow-2xs font-bold'
              : 'border-line bg-card text-muted hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400',
          )}
        >
          <FileText size={13} />
          <span>Có giải thích chi tiết</span>
        </button>
        <button
          onClick={() => setFilterType(filterType === 'mistakes' ? 'all' : 'mistakes')}
          className={cx(
            'rounded-xl px-2.5 py-1 font-semibold transition-all cursor-pointer flex items-center gap-1 border',
            filterType === 'mistakes'
              ? 'bg-rose-600 border-rose-700 text-white shadow-2xs font-bold'
              : 'border-line bg-card text-muted hover:border-rose-400 hover:text-rose-600 dark:hover:text-rose-400',
          )}
        >
          <AlertCircle size={13} />
          <span>Từng trả lời sai</span>
        </button>
        <button
          onClick={() => setFilterType(filterType === 'mastered' ? 'all' : 'mastered')}
          className={cx(
            'rounded-xl px-2.5 py-1 font-semibold transition-all cursor-pointer flex items-center gap-1 border',
            filterType === 'mastered'
              ? 'bg-emerald-600 border-emerald-700 text-white shadow-2xs font-bold'
              : 'border-line bg-card text-muted hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400',
          )}
        >
          <CheckCircle size={13} />
          <span>Đã thuộc (Thành thạo)</span>
        </button>
      </div>

      {/* Quick Search Suggestions */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="inline-flex items-center gap-1 font-semibold text-muted mr-1">
          <Sparkles size={13} className="text-amber-500" />
          <span>Gợi ý:</span>
        </span>
        {QUICK_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setQuery(tag)}
            className="rounded-xl border border-line bg-card px-2.5 py-1 text-xs font-semibold text-muted hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Subject Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-line pb-3">
        <button
          onClick={() => setSelectedSubject('all')}
          className={cx(
            'rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
            selectedSubject === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'border border-line bg-card text-muted hover:text-ink',
          )}
        >
          Tất cả môn
        </button>
        {subjects.map((sub) => (
          <button
            key={sub}
            onClick={() => setSelectedSubject(sub)}
            className={cx(
              'rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
              selectedSubject === sub
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'border border-line bg-card text-muted hover:text-ink',
            )}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* Results View */}
      {!hasSearch ? (
        <Card className="p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-3">
            <BookOpen size={22} />
          </div>
          <h3 className="text-base font-bold text-ink">Bắt đầu tra cứu hoặc chọn bộ lọc</h3>
          <p className="mt-1 max-w-md mx-auto text-xs text-muted leading-relaxed">
            Nhập ít nhất 2 ký tự (hỗ trợ cả tiếng Việt không dấu và có dấu) hoặc bấm chọn nhanh bộ lọc phía trên (như <b><Star size={12} className="inline -mt-0.5" /> Đã gắn sao</b>) để xem danh sách câu hỏi.
          </p>
        </Card>
      ) : results.length === 0 ? (
        <Empty>
          Không tìm thấy câu hỏi nào phù hợp {q ? `với từ khóa "${q}"` : ''}{' '}
          {selectedSubject !== 'all' ? `trong môn ${selectedSubject}` : ''}{' '}
          {filterType !== 'all' ? `với bộ lọc đã chọn` : ''}.
        </Empty>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-muted font-medium px-1">
            <span>
              Tìm thấy <b className="text-ink font-bold">{results.length}</b> kết quả phù hợp
            </span>
            {results.length > LIMIT && (
              <span>Đang hiển thị {LIMIT} kết quả đầu tiên</span>
            )}
          </div>
          <Card className="divide-y divide-line/70 overflow-hidden shadow-xs">
            {results.slice(0, LIMIT).map((e) => (
              <ItemSummary key={progressKey(e.collection.id, e.item.id)} entry={e} />
            ))}
          </Card>
        </div>
      )}
    </div>
  )
}
