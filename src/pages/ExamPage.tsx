import { useMemo, useState } from 'react'
import { Clock, FileCheck2 } from 'lucide-react'
import { allEntries, collections, examCollections, standaloneCollections } from '../data'
import { availableKinds, buildQuiz, type Question } from '../services/quiz/generate'
import { allocate, chapterGroups, sampleExam, subjectExamId } from '../services/quiz/exam'
import { loadSettings, saveSettings } from '../services/storage/settings'
import QuizRunner from '../components/quiz/QuizRunner'
import ExamHistory from '../components/quiz/ExamHistory'
import { Button, Card, Empty, PageHeader } from '../components/ui'
import { cx } from '../utils'

const DEFAULT = { count: 40, minutes: 50 }

/** Mock exam for a whole subject: fixed length and time, chapters mixed in proportion, answers shown only at the end. */
export default function ExamPage() {
  const subjects = useMemo(() => [...new Set(collections.filter((c) => !c.standalone).map((c) => c.subject))].sort(), [])
  const [subject, setSubject] = useState(subjects[0] ?? '')
  const [presets, setPresets] = useState(() => loadSettings().examPresets)
  const [run, setRun] = useState<{ qs: Question[]; n: number; limitSec?: number } | null>(null)

  const entries = useMemo(() => allEntries(examCollections(subject)), [subject])
  const left = standaloneCollections(subject)
  const groups = useMemo(() => chapterGroups(entries), [entries])
  const preset = presets[subject] ?? DEFAULT
  const n = Math.min(preset.count, entries.length)
  const alloc = allocate(groups.map((g) => g.entries.length), n)

  const update = (patch: Partial<typeof DEFAULT>) => {
    const next = { ...presets, [subject]: { ...preset, ...patch } }
    setPresets(next)
    saveSettings({ ...loadSettings(), examPresets: next })
  }

  if (!subjects.length) return <Empty>Chưa có bộ học nào để tạo đề.</Empty>

  if (run)
    return (
      <div className="mx-auto max-w-3xl">
        <QuizRunner
          key={run.n}
          questions={run.qs}
          mode="exam"
          exam={run.n === 0 ? { title: `Thi thử · ${subject}`, collectionId: subjectExamId(subject), limitSec: run.limitSec } : undefined}
          onExit={() => setRun(null)}
          onRetry={(qs) => setRun({ qs: qs.map((q) => ({ ...q, id: `${q.id}r` })), n: run.n + 1 })}
        />
      </div>
    )

  const start = () => {
    const chosen = sampleExam(entries, n)
    const qs = buildQuiz(chosen, {
      count: chosen.length,
      kinds: availableKinds(chosen).filter((k) => k !== 'match'),
      randomize: true,
      shuffleOptions: true,
      distractorPool: entries,
    })
    if (qs.length) setRun({ qs, n: 0, limitSec: preset.minutes > 0 ? Math.round(preset.minutes * 60) : undefined })
  }

  const num = 'w-20 rounded-lg border border-line bg-card px-2 py-1 text-right'

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Thi thử" subtitle="Đề trộn từ mọi chương của môn theo tỉ lệ, tính giờ, chỉ xem đáp án sau khi nộp bài" />

      <div className="mb-4 flex flex-wrap gap-2">
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => setSubject(s)}
            className={cx('rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors', s === subject ? 'border-ink bg-ink text-white' : 'border-line bg-card text-muted hover:text-ink')}
          >
            {s}
          </button>
        ))}
      </div>

      <Card className="space-y-5 p-6">
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <label className="flex items-center gap-2">
            Số câu
            <input
              type="number"
              min={1}
              max={entries.length}
              value={preset.count}
              onChange={(e) => update({ count: Math.max(1, Math.min(entries.length, Number(e.target.value) || 1)) })}
              className={num}
            />
            <span className="text-xs text-muted">/ {entries.length} câu của môn</span>
          </label>
          <label className="flex items-center gap-2">
            <Clock size={15} className="text-muted" /> Thời gian
            <input type="number" min={0} max={300} value={preset.minutes} onChange={(e) => update({ minutes: Math.max(0, Math.min(300, Number(e.target.value) || 0)) })} className={num} />
            phút <span className="text-xs text-muted">(0 = không giới hạn)</span>
          </label>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium">Phân bổ câu hỏi theo chương</div>
          <div className="divide-y divide-line rounded-xl border border-line text-sm">
            {groups.map((g, i) => (
              <div key={g.label} className="flex items-center gap-3 px-3 py-2">
                <span className="min-w-0 flex-1 truncate">{g.label}</span>
                <span className="text-xs text-muted">{g.entries.length} câu trong ngân hàng</span>
                <span className="w-16 text-right font-semibold">{alloc[i]} câu</span>
              </div>
            ))}
          </div>
          {left.length > 0 && (
            <p className="mt-2 text-xs text-muted">
              Không rút câu từ: {left.map((c) => c.title).join(', ')}. Bộ này phần lớn trùng câu với các chương ở trên; hãy làm riêng ở mục Trắc nghiệm.
            </p>
          )}
          <p className="mt-2 text-xs text-muted">Cấu trúc đề được nhớ riêng cho từng môn. Hãy chỉnh số câu và thời gian cho giống đề thi thật của bạn.</p>
        </div>

        <Button variant="primary" disabled={n === 0} onClick={start} className="px-5 py-2.5">
          <FileCheck2 size={16} /> Bắt đầu thi {n} câu
        </Button>

        <ExamHistory collectionId={subjectExamId(subject)} limit={8} compact />
      </Card>
    </div>
  )
}
