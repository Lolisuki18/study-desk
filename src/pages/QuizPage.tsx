import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { entriesFor, getCollection } from '../data'
import type { Question } from '../services/quiz/generate'
import CollectionPicker from '../components/dashboard/CollectionPicker'
import QuizSetup, { type QuizStartOptions } from '../components/quiz/QuizSetup'
import QuizRunner, { type QuizMode } from '../components/quiz/QuizRunner'
import { Empty, PageHeader } from '../components/ui'

export default function QuizPage() {
  const { id } = useParams()
  const entries = useMemo(() => (id ? entriesFor(id) : []), [id])
  const [run, setRun] = useState<{ qs: Question[]; mode: QuizMode; n: number; opts?: QuizStartOptions } | null>(null)

  if (!id)
    return (
      <div>
        <PageHeader title="Trắc nghiệm" subtitle="Chọn bộ học để làm bài" />
        <Link
          to="/exam"
          className="mb-6 flex items-center justify-between rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/40 px-5 py-4 text-sm transition-all hover:border-indigo-400 dark:hover:border-indigo-700 hover:shadow-xs group"
        >
          <span>
            <span className="block font-bold text-indigo-950 dark:text-indigo-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Thi thử theo môn
            </span>
            <span className="text-xs text-indigo-700/80 dark:text-indigo-400">
              Đề trộn mọi chương theo tỉ lệ, tính giờ, chấm điểm theo chương
            </span>
          </span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
            Vào thi →
          </span>
        </Link>
        <CollectionPicker base="/quiz" />
      </div>
    )
  if (!entries.length) return <Empty>Không tìm thấy bộ học.</Empty>

  return (
    <div className="mx-auto max-w-3xl">
      {!run ? (
        <>
          <Link to="/quiz" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
            <ArrowLeft size={14} /> Chọn bộ khác
          </Link>
          <PageHeader title={id === 'all' ? 'Trắc nghiệm · Tất cả' : getCollection(id)?.title ?? 'Trắc nghiệm'} subtitle="Thiết lập bài làm" />
          <QuizSetup
            entries={entries}
            collectionId={id}
            title={id === 'all' ? 'Tất cả bộ học' : getCollection(id)?.title ?? id}
            onStart={(qs, mode, opts) => setRun({ qs, mode, n: 0, opts })}
          />
        </>
      ) : (
        <QuizRunner
          key={run.n}
          questions={run.qs}
          mode={run.mode}
          exam={run.n === 0 ? run.opts : undefined}
          onExit={() => setRun(null)}
          onRetry={(qs) => setRun({ qs: qs.map((q) => ({ ...q, id: `${q.id}r` })), mode: run.mode, n: run.n + 1 })}
        />
      )}
    </div>
  )
}
