import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Upload, X } from 'lucide-react'
import { collections } from '../data'
import CollectionCard, { CollectionsBySubject } from '../components/dashboard/CollectionCard'
import { Button, Card, PageHeader } from '../components/ui'
import { cx } from '../utils'

export default function Collections() {
  const [q, setQ] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')

  const subjects = useMemo(() => {
    const list = [...new Set(collections.map((c) => c.subject))].sort()
    return list
  }, [])

  // Đếm số lượng theo subject
  const subjectCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of collections) {
      map[c.subject] = (map[c.subject] ?? 0) + 1
    }
    return map
  }, [])

  const filteredList = useMemo(() => {
    return collections.filter((c) => {
      const matchQuery = `${c.title} ${c.subject} ${c.description}`.toLowerCase().includes(q.toLowerCase())
      const matchSubject = selectedSubject === 'all' || c.subject === selectedSubject
      return matchQuery && matchSubject
    })
  }, [q, selectedSubject])

  const totalItems = collections.reduce((acc, c) => acc + c.items.length, 0)

  return (
    <div>
      <PageHeader
        title="Bộ học của tôi"
        subtitle={`Quản lý và ôn luyện ${collections.length} bộ học (${totalItems} câu hỏi / mục kiến thức)`}
        actions={
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên, môn, mô tả…"
                className="w-44 sm:w-60 rounded-xl border border-line bg-card pl-9 pr-8 py-2 text-xs sm:text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
              />
              {q && (
                <button
                  onClick={() => setQ('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted hover:text-ink cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <Link to="/import">
              <Button variant="primary" className="py-2 px-3.5 text-xs font-bold shrink-0 cursor-pointer">
                <Upload size={14} /> Tải lên JSON
              </Button>
            </Link>
          </div>
        }
      />

      {/* Subject Filter Pills */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedSubject('all')}
          className={cx(
            'rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer',
            selectedSubject === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'border border-slate-200 dark:border-line bg-white dark:bg-card text-slate-600 dark:text-muted hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800',
          )}
        >
          Tất cả môn ({collections.length})
        </button>

        {subjects.map((sub) => {
          const count = subjectCounts[sub] ?? 0
          const active = selectedSubject === sub
          return (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={cx(
                'rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer',
                active
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'border border-slate-200 dark:border-line bg-white dark:bg-card text-slate-600 dark:text-muted hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300',
              )}
            >
              {sub} ({count})
            </button>
          )
        })}
      </div>

      {/* Collections Grid or Grouped list */}
      {filteredList.length > 0 ? (
        selectedSubject === 'all' && !q ? (
          <CollectionsBySubject list={filteredList} />
        ) : (
          <div>
            <div className="mb-3 text-xs font-medium text-muted">
              Tìm thấy {filteredList.length} bộ học phù hợp:
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filteredList.map((c) => (
                <CollectionCard key={c.id} c={c} />
              ))}
            </div>
          </div>
        )
      ) : (
        <Card className="p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-muted">
            <Search size={22} />
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-ink">Không tìm thấy bộ học nào</h3>
          <p className="mt-1 text-sm text-muted">
            Không có bộ học nào khớp với từ khoá "{q}" hoặc bộ lọc đang chọn.
          </p>
          <div className="mt-4 flex justify-center">
            <Button
              onClick={() => {
                setQ('')
                setSelectedSubject('all')
              }}
            >
              Xoá bộ lọc
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
