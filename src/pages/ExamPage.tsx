import { useMemo, useState } from 'react'
import { Award, Clock, FileCheck2, Sparkles, TrendingUp, Zap } from 'lucide-react'
import { allEntries, collections, examCollections, standaloneCollections } from '../data'
import { useProgress } from '../features/learning/ProgressContext'
import { availableKinds, buildQuiz, type Question } from '../services/quiz/generate'
import { allocate, chapterGroups, sampleExam, subjectExamId } from '../services/quiz/exam'
import { loadSettings, saveSettings } from '../services/storage/settings'
import QuizRunner from '../components/quiz/QuizRunner'
import ExamHistory from '../components/quiz/ExamHistory'
import { Button, Card, Empty, PageHeader } from '../components/ui'
import { cx } from '../utils'

const DEFAULT = { count: 40, minutes: 50 }

const PRESETS_LIST = [
  { label: 'Đề chuẩn đại học', sub: '40 câu · 50 phút', count: 40, minutes: 50, icon: FileCheck2 },
  { label: 'Luyện tốc độ', sub: '20 câu · 20 phút', count: 20, minutes: 20, icon: Zap },
  { label: 'Tổng ôn Marathon', sub: '60 câu · 75 phút', count: 60, minutes: 75, icon: Sparkles },
]

/** Mock exam for a whole subject: fixed length and time, chapters mixed in proportion, answers shown only at the end. */
export default function ExamPage() {
  const { exams } = useProgress()
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

  // Subject past exams history
  const examId = subjectExamId(subject)
  const subjectExams = useMemo(() => exams.filter((e) => e.collectionId === examId), [exams, examId])
  const bestScore = subjectExams.length ? Math.max(...subjectExams.map((e) => e.score10)) : null
  const lastScore = subjectExams.at(-1)?.score10 ?? null
  const avgScore = subjectExams.length
    ? (subjectExams.reduce((sum, e) => sum + e.score10, 0) / subjectExams.length).toFixed(1)
    : null

  const update = (patch: Partial<typeof DEFAULT>) => {
    const next = { ...presets, [subject]: { ...preset, ...patch } }
    setPresets(next)
    saveSettings({ ...loadSettings(), examPresets: next })
  }

  const applyPreset = (count: number, minutes: number) => {
    update({ count: Math.min(count, entries.length), minutes })
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

  const num = 'w-24 rounded-xl border border-line bg-card px-3 py-1.5 text-right font-bold text-ink outline-none focus:border-indigo-500'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Thi thử chuẩn hóa"
        subtitle="Đề trộn từ mọi chương theo tỉ lệ chuẩn, tính giờ thi thật, chấm điểm chi tiết sau khi nộp bài"
      />

      {/* Subject Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => setSubject(s)}
            className={cx(
              'rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer',
              s === subject
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'border border-line bg-card text-muted hover:text-ink hover:border-slate-300 dark:hover:border-slate-700',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Subject Stats Overview (if has history) */}
      {subjectExams.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-line bg-card p-3.5 text-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Lần thi gần nhất</div>
            <div className="mt-1 text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              {lastScore} <span className="text-xs font-semibold text-muted">/10</span>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-card p-3.5 text-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Điểm cao nhất</div>
            <div className="mt-1 text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {bestScore} <span className="text-xs font-semibold text-muted">/10</span>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-card p-3.5 text-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Điểm trung bình</div>
            <div className="mt-1 text-xl font-black font-mono text-amber-600 dark:text-amber-400">
              {avgScore} <span className="text-xs font-semibold text-muted">/10</span>
            </div>
          </div>
        </div>
      )}

      {/* Exam Configuration Card */}
      <Card className="space-y-6 p-5 sm:p-7">
        {/* Quick Presets */}
        <div>
          <div className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted">
            Chọn nhanh cấu hình thi thử
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {PRESETS_LIST.map((p) => {
              const Icon = p.icon
              const isSelected = preset.count === p.count && preset.minutes === p.minutes
              return (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p.count, p.minutes)}
                  className={cx(
                    'flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-left transition-all cursor-pointer',
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-xs'
                      : 'border-line bg-card hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/40',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted'} />
                    <span className={cx('text-xs font-bold', isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-ink')}>
                      {p.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted font-medium pl-6">{p.sub}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom Count & Time Inputs */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-1 border-t border-line text-sm">
          <label className="flex items-center gap-2 font-medium text-ink">
            <span>Số câu:</span>
            <input
              type="number"
              min={1}
              max={entries.length}
              value={preset.count}
              onChange={(e) => update({ count: Math.max(1, Math.min(entries.length, Number(e.target.value) || 1)) })}
              className={num}
            />
            <span className="text-xs text-muted font-normal">/ {entries.length} câu trong ngân hàng</span>
          </label>

          <label className="flex items-center gap-2 font-medium text-ink">
            <Clock size={16} className="text-muted" />
            <span>Thời gian:</span>
            <input
              type="number"
              min={0}
              max={300}
              value={preset.minutes}
              onChange={(e) => update({ minutes: Math.max(0, Math.min(300, Number(e.target.value) || 0)) })}
              className={num}
            />
            <span>phút</span>
            <span className="text-xs text-muted font-normal">(0 = không giới hạn)</span>
          </label>
        </div>

        {/* Chapter Breakdown */}
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
            Phân bổ số câu lấy ngẫu nhiên theo từng chương
          </div>
          <div className="divide-y divide-line rounded-2xl border border-line text-sm overflow-hidden bg-slate-50/40 dark:bg-slate-900/30">
            {groups.map((g, i) => (
              <div key={g.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{g.label}</span>
                <span className="text-xs text-muted shrink-0">{g.entries.length} câu</span>
                <span className="w-16 text-right font-bold text-indigo-600 dark:text-indigo-400 shrink-0 font-mono">
                  {alloc[i]} câu
                </span>
              </div>
            ))}
          </div>
          {left.length > 0 && (
            <p className="mt-2 text-[11px] text-muted italic">
              * Không rút câu từ các bộ: {left.map((c) => c.title).join(', ')} do các bộ này có câu trùng với các chương trên.
            </p>
          )}
        </div>

        {/* Start Action Button */}
        <div className="pt-2">
          <Button
            variant="primary"
            disabled={n === 0}
            onClick={start}
            className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold shadow-md shadow-indigo-500/20"
          >
            <FileCheck2 size={18} /> Bắt đầu bài thi {n} câu
          </Button>
        </div>

        {/* Exam History for this Subject */}
        <div className="pt-3 border-t border-line">
          <ExamHistory collectionId={subjectExamId(subject)} limit={8} compact />
        </div>
      </Card>
    </div>
  )
}
