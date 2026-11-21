import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Play, Target } from 'lucide-react'
import { allEntries, examCollections } from '../data'
import { useProgress } from '../features/learning/ProgressContext'
import { chapterGroups } from '../services/quiz/exam'
import { availableKinds, buildQuiz, type Question } from '../services/quiz/generate'
import { pickWeakest } from '../services/drill'
import QuizRunner from '../components/quiz/QuizRunner'
import { Button, Card, Empty, PageHeader } from '../components/ui'
import { cx } from '../utils'

const SIZES = [10, 20, 30]

/** Drill: a practice quiz made of the questions of one chapter that you are least likely to get right. */
export default function DrillPage() {
  const [sp] = useSearchParams()
  const subject = sp.get('subject') ?? ''
  const chapter = sp.get('chapter') ?? ''
  const { get } = useProgress()
  const [size, setSize] = useState(20)
  const [run, setRun] = useState<{ qs: Question[]; n: number } | null>(null)

  const group = useMemo(() => chapterGroups(allEntries(examCollections(subject))).find((g) => g.label === chapter), [subject, chapter])

  const start = () => {
    if (!group) return
    const plan = pickWeakest(group.entries, get, size)
    const kinds = availableKinds(plan.entries).filter((k) => k !== 'match')
    const qs = buildQuiz(plan.entries, { count: plan.entries.length, kinds, randomize: true, distractorPool: group.entries })
    if (qs.length) setRun({ qs, n: 0 })
  }

  if (!group)
    return (
      <div>
        <PageHeader title="Luyện chương yếu" />
        <Empty>Không tìm thấy chương này. Hãy chọn một chương từ mục "Mức sẵn sàng thi" ở Tổng quan.</Empty>
      </div>
    )

  if (run)
    return (
      <div className="mx-auto max-w-3xl">
        <QuizRunner
          key={run.n}
          questions={run.qs}
          mode="practice"
          onExit={() => setRun(null)}
          onRetry={(qs) => setRun({ qs: qs.map((q) => ({ ...q, id: `${q.id}r` })), n: run.n + 1 })}
        />
      </div>
    )

  const preview = pickWeakest(group.entries, get, size)

  return (
    <div className="mx-auto max-w-xl">
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} /> Tổng quan
      </Link>
      <PageHeader title={`Luyện ${chapter}`} subtitle={`${subject}: các câu bạn ít có khả năng làm đúng nhất`} />

      <Card className="space-y-5 p-6">
        <div>
          <div className="mb-2 text-sm font-medium">Số câu</div>
          <div className="flex gap-2">
            {SIZES.map((n) => (
              <button
                key={n}
                onClick={() => setSize(n)}
                className={cx('cursor-pointer rounded-lg border px-4 py-1.5 text-sm font-semibold', size === n ? 'border-ink bg-ink text-white' : 'border-line bg-card hover:bg-bg')}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-slate-50/70 p-4 text-sm dark:bg-slate-800/40">
          <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-ink">
            <Target size={15} className="text-indigo-600" /> Bài này gồm {preview.entries.length} câu của {chapter}
          </div>
          <ul className="space-y-0.5 text-xs text-muted">
            <li>
              <b className="text-ink">{preview.missed}</b> câu bạn trả lời sai hoặc chưa nhớ
            </li>
            <li>
              <b className="text-ink">{preview.unseen}</b> câu chưa học
            </li>
            <li>
              <b className="text-ink">{preview.other}</b> câu đã biết nhưng chưa chắc
            </li>
          </ul>
          <p className="mt-2 text-xs text-muted">Chương có {group.entries.length} câu. Mỗi lần bấm Bắt đầu, các câu ngang độ khó được chọn lại ngẫu nhiên.</p>
        </div>

        <Button variant="primary" disabled={!preview.entries.length} onClick={start} className="px-5 py-2.5">
          <Play size={16} /> Bắt đầu luyện
        </Button>
      </Card>
    </div>
  )
}
