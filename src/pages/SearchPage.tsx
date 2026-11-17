import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookOpen, Search, Sparkles, X } from 'lucide-react'
import { allEntries, collections, progressKey } from '../data'
import { useProgress } from '../features/learning/ProgressContext'
import ItemSummary from '../components/ui/ItemSummary'
import { Card, Empty, PageHeader } from '../components/ui'
import { matcher, searchText } from '../utils/search'
import { cx } from '../utils'

const LIMIT = 60

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

// Built once: the bundled content never changes while the app is open.
let index: { entry: ReturnType<typeof allEntries>[number]; text: string }[] | null = null
const getIndex = () => (index ??= allEntries().map((entry) => ({ entry, text: searchText(entry.item) })))

export default function SearchPage() {
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') ?? ''
  const [selectedSubject, setSelectedSubject] = useState('all')
  const { notes } = useProgress()

  const subjects = useMemo(() => [...new Set(collections.map((c) => c.subject))].sort(), [])

  const setQuery = (val: string) => {
    if (val.trim()) setSp({ q: val }, { replace: true })
    else setSp({}, { replace: true })
  }

  const results = useMemo(() => {
    if (q.trim().length < 2) return []
    const match = matcher(q)
    return getIndex()
      .filter(({ entry, text }) => {
        if (selectedSubject !== 'all' && entry.collection.subject !== selectedSubject) {
          return false
        }
        const note = notes.get(progressKey(entry.collection.id, entry.item.id))?.text
        return match(note ? `${text}\n${note}` : text)
      })
      .map((x) => x.entry)
  }, [q, selectedSubject, notes])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tìm kiếm toàn cục"
        subtitle="Tra cứu nhanh câu hỏi, đáp án, giải thích trong mọi ngân hàng kiến thức"
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
            className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Xoá từ khoá"
          >
            <X size={16} />
          </button>
        )}
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
      {q.trim().length < 2 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-3">
            <BookOpen size={22} />
          </div>
          <h3 className="text-base font-bold text-ink">Bắt đầu tra cứu</h3>
          <p className="mt-1 max-w-md mx-auto text-xs text-muted leading-relaxed">
            Nhập ít nhất 2 ký tự. Tìm kiếm hỗ trợ gõ không dấu: “dang” sẽ khớp cả “Đảng”; gõ có dấu sẽ tìm chính xác từ khóa có dấu.
          </p>
        </Card>
      ) : results.length === 0 ? (
        <Empty>
          Không tìm thấy câu hỏi nào phù hợp với từ khóa "{q}" {selectedSubject !== 'all' ? `trong môn ${selectedSubject}` : ''}.
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
