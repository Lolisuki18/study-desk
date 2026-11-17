import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { allEntries, progressKey } from '../data'
import { useProgress } from '../features/learning/ProgressContext'
import ItemSummary from '../components/ui/ItemSummary'
import { Card, Empty, PageHeader } from '../components/ui'
import { matcher, searchText } from '../utils/search'

const LIMIT = 50

// Built once: the bundled content never changes while the app is open.
let index: { entry: ReturnType<typeof allEntries>[number]; text: string }[] | null = null
const getIndex = () => (index ??= allEntries().map((entry) => ({ entry, text: searchText(entry.item) })))

export default function SearchPage() {
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') ?? ''
  const { notes } = useProgress()

  const results = useMemo(() => {
    if (q.trim().length < 2) return []
    const match = matcher(q)
    return getIndex()
      .filter(({ entry, text }) => {
        const note = notes.get(progressKey(entry.collection.id, entry.item.id))?.text
        return match(note ? `${text}\n${note}` : text)
      })
      .map((x) => x.entry)
  }, [q, notes])

  return (
    <div>
      <PageHeader title="Tìm kiếm" subtitle="Tìm trong câu hỏi, đáp án, giải thích và ghi chú của mọi bộ học" />
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setSp(e.target.value ? { q: e.target.value } : {}, { replace: true })}
          placeholder="Nhập từ khoá, ví dụ: cuong linh 1930"
          className="w-full rounded-xl border border-line bg-card py-3 pl-10 pr-10 text-[15px] outline-none focus:border-indigo-500"
        />
        {q && (
          <button onClick={() => setSp({}, { replace: true })} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" aria-label="Xoá từ khoá">
            <X size={16} />
          </button>
        )}
      </div>

      {q.trim().length < 2 ? (
        <Empty>Gõ ít nhất 2 ký tự. Không cần gõ dấu: “dang” sẽ khớp cả “Đảng”; gõ có dấu thì tìm đúng dấu.</Empty>
      ) : results.length === 0 ? (
        <Empty>Không tìm thấy mục nào khớp “{q}”.</Empty>
      ) : (
        <>
          <p className="mb-2 text-xs text-muted">
            {results.length} kết quả{results.length > LIMIT ? ` · đang hiện ${LIMIT} kết quả đầu, hãy gõ thêm từ khoá để thu hẹp` : ''}
          </p>
          <Card className="divide-y divide-line/70 overflow-hidden">
            {results.slice(0, LIMIT).map((e) => (
              <ItemSummary key={progressKey(e.collection.id, e.item.id)} entry={e} />
            ))}
          </Card>
        </>
      )}
    </div>
  )
}
