import { useMemo, useState } from 'react'
import { Check, Clock, FileCheck2, Settings2, Sparkles, Zap } from 'lucide-react'
import { allEntries, collections, examCollections, standaloneCollections } from '../data'
import { useProgress } from '../features/learning/ProgressContext'
import { availableKinds, buildQuiz, type Question } from '../services/quiz/generate'
import { allocate, chapterGroups, sampleExam, subjectExamId } from '../services/quiz/exam'
import { loadSettings, saveSettings } from '../services/storage/settings'
import { useStarred } from '../services/storage/starred'
import QuizRunner from '../components/quiz/QuizRunner'
import ExamHistory from '../components/quiz/ExamHistory'
import { Button, Card, Empty, PageHeader } from '../components/ui'
import { cx, shuffle } from '../utils'

const DEFAULT = { count: 40, minutes: 50 }

const PRESETS_LIST = [
  { label: 'Đề chuẩn đại học', sub: '40 câu · 50 phút', count: 40, minutes: 50, icon: FileCheck2 },
  { label: 'Luyện tốc độ', sub: '20 câu · 20 phút', count: 20, minutes: 20, icon: Zap },
  { label: 'Tổng ôn Marathon', sub: '60 câu · 75 phút', count: 60, minutes: 75, icon: Sparkles },
]

type PoolType = 'all' | 'unseen' | 'weak' | 'starred'

/** Mock exam with standard whole-subject mode and custom midterm/chapter builder mode. */
export default function ExamPage() {
  const { exams, get } = useProgress()
  const { isStarred } = useStarred()
  const subjects = useMemo(() => [...new Set(collections.filter((c) => !c.standalone).map((c) => c.subject))].sort(), [])
  const [subject, setSubject] = useState(subjects[0] ?? '')
  const [examMode, setExamMode] = useState<'standard' | 'custom'>('standard')
  const [presets, setPresets] = useState(() => loadSettings().examPresets)
  const [run, setRun] = useState<{ qs: Question[]; n: number; limitSec?: number; title: string } | null>(null)

  // Custom mode states
  const [selectedChapters, setSelectedChapters] = useState<string[]>([])
  const [poolType, setPoolType] = useState<PoolType>('all')
  const [customCount, setCustomCount] = useState(25)
  const [customMinutes, setCustomMinutes] = useState(30)

  const rawEntries = useMemo(() => allEntries(examCollections(subject)), [subject])
  const left = standaloneCollections(subject)
  const groups = useMemo(() => chapterGroups(rawEntries), [rawEntries])

  // Reset selected chapters when subject changes
  const allChapterLabels = useMemo(() => groups.map((g) => g.label), [groups])
  const activeChapters = selectedChapters.length > 0 ? selectedChapters : allChapterLabels

  const preset = presets[subject] ?? DEFAULT
  const n = Math.min(preset.count, rawEntries.length)
  const alloc = allocate(groups.map((g) => g.entries.length), n)

  // Filtered pool for Custom Mode
  const customPool = useMemo(() => {
    let pool = rawEntries.filter((e) => {
      const g = groups.find((grp) => grp.entries.some((item) => item.item.id === e.item.id))
      return g ? activeChapters.includes(g.label) : true
    })

    if (poolType === 'unseen') {
      pool = pool.filter((e) => {
        const p = get(e.collection.id, e.item.id)
        return !p || !p.lastStudied
      })
    } else if (poolType === 'weak') {
      pool = pool.filter((e) => {
        const p = get(e.collection.id, e.item.id)
        return p && p.level <= 2
      })
    } else if (poolType === 'starred') {
      pool = pool.filter((e) => isStarred(e.collection.id, e.item.id))
    }

    return pool
  }, [rawEntries, groups, activeChapters, poolType, get, isStarred])

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
    update({ count: Math.min(count, rawEntries.length), minutes })
  }

  const toggleChapter = (ch: string) => {
    setSelectedChapters((prev) => {
      const current = prev.length > 0 ? prev : allChapterLabels
      if (current.includes(ch)) {
        const next = current.filter((x) => x !== ch)
        return next.length === 0 ? [allChapterLabels[0]] : next
      } else {
        return [...current, ch]
      }
    })
  }

  if (!subjects.length) return <Empty>Chưa có bộ học nào để tạo đề.</Empty>

  if (run)
    return (
      <div className="mx-auto max-w-3xl">
        <QuizRunner
          key={run.n}
          questions={run.qs}
          mode="exam"
          exam={run.n === 0 ? { title: run.title, collectionId: subjectExamId(subject), limitSec: run.limitSec } : undefined}
          onExit={() => setRun(null)}
          onRetry={(qs) => setRun({ ...run, qs: qs.map((q) => ({ ...q, id: `${q.id}r` })), n: run.n + 1 })}
        />
      </div>
    )

  const startStandard = () => {
    const chosen = sampleExam(rawEntries, n)
    const qs = buildQuiz(chosen, {
      count: chosen.length,
      kinds: availableKinds(chosen).filter((k) => k !== 'match'),
      randomize: true,
      shuffleOptions: true,
      distractorPool: rawEntries,
    })
    if (qs.length)
      setRun({
        qs,
        n: 0,
        title: `Thi thử chuẩn · ${subject}`,
        limitSec: preset.minutes > 0 ? Math.round(preset.minutes * 60) : undefined,
      })
  }

  const startCustom = () => {
    const countToTake = Math.min(customCount, customPool.length)
    const chosen = shuffle(customPool).slice(0, countToTake)
    const qs = buildQuiz(chosen, {
      count: chosen.length,
      kinds: availableKinds(chosen).filter((k) => k !== 'match'),
      randomize: true,
      shuffleOptions: true,
      distractorPool: rawEntries,
    })
    if (qs.length)
      setRun({
        qs,
        n: 0,
        title: `Thi tùy biến (${activeChapters.join(', ')}) · ${subject}`,
        limitSec: customMinutes > 0 ? Math.round(customMinutes * 60) : undefined,
      })
  }

  const num =
    'w-24 rounded-xl border border-line bg-card px-3 py-1.5 text-right font-bold text-ink outline-none focus:border-indigo-500'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Thi thử chuẩn hóa & Tùy biến"
        subtitle="Mô phỏng kỳ thi chính thức, chọn chương ôn thi giữa kỳ, chấm điểm và phân tích nhịp độ"
      />

      {/* Subject Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => {
              setSubject(s)
              setSelectedChapters([])
            }}
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

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-slate-100 dark:bg-slate-800/60 p-1">
        <button
          onClick={() => setExamMode('standard')}
          className={cx(
            'flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer',
            examMode === 'standard'
              ? 'bg-white dark:bg-card text-ink shadow-xs'
              : 'text-muted hover:text-ink',
          )}
        >
          <FileCheck2 size={16} />
          <span>Đề chuẩn hóa ngẫu nhiên</span>
        </button>
        <button
          onClick={() => setExamMode('custom')}
          className={cx(
            'flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer',
            examMode === 'custom'
              ? 'bg-white dark:bg-card text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-muted hover:text-ink',
          )}
        >
          <Settings2 size={16} />
          <span>Tạo đề tùy biến (Ôn thi giữa kỳ, chọn chương)</span>
        </button>
      </div>

      {examMode === 'standard' ? (
        /* Standard Exam Configuration Card */
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
                max={rawEntries.length}
                value={preset.count}
                onChange={(e) => update({ count: Math.max(1, Math.min(rawEntries.length, Number(e.target.value) || 1)) })}
                className={num}
              />
              <span className="text-xs text-muted font-normal">/ {rawEntries.length} câu trong ngân hàng</span>
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
              onClick={startStandard}
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              <FileCheck2 size={18} /> Bắt đầu bài thi {n} câu
            </Button>
          </div>

          {/* Exam History for this Subject */}
          <div className="pt-3 border-t border-line">
            <ExamHistory collectionId={subjectExamId(subject)} limit={8} compact />
          </div>
        </Card>
      ) : (
        /* Custom Exam Builder Card */
        <Card className="space-y-6 p-5 sm:p-7">
          {/* Chapter Multi-selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                1. Chọn các chương cần thi ({activeChapters.length}/{allChapterLabels.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedChapters(allChapterLabels)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Chọn tất cả
                </button>
                <span className="text-muted">·</span>
                <button
                  type="button"
                  onClick={() => setSelectedChapters([allChapterLabels[0]])}
                  className="text-xs font-semibold text-muted hover:text-ink cursor-pointer"
                >
                  Chỉ chọn 1 chương
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {groups.map((g) => {
                const isChecked = activeChapters.includes(g.label)
                return (
                  <button
                    key={g.label}
                    type="button"
                    onClick={() => toggleChapter(g.label)}
                    className={cx(
                      'flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all cursor-pointer',
                      isChecked
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-ink font-semibold'
                        : 'border-line bg-card text-muted hover:border-slate-300 dark:hover:border-slate-700',
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cx(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs',
                          isChecked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-line bg-card',
                        )}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className="truncate">{g.label}</span>
                    </div>
                    <span className="text-[11px] text-muted shrink-0 font-mono">
                      {g.entries.length} câu
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Question Pool Type */}
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
              2. Chọn nguồn câu hỏi
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'all', label: 'Tất cả câu hỏi', hint: 'Toàn bộ ngân hàng' },
                { id: 'unseen', label: 'Chưa từng học', hint: 'Chưa làm lần nào' },
                { id: 'weak', label: 'Câu còn yếu', hint: 'Hộp Leitner 1 & 2' },
                { id: 'starred', label: 'Câu gắn sao', hint: 'Ôn tủ trọng tâm' },
              ].map((p) => {
                const active = poolType === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPoolType(p.id as PoolType)}
                    className={cx(
                      'p-3 rounded-xl border text-left transition-all cursor-pointer',
                      active
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                        : 'border-line bg-card text-muted hover:border-slate-300 dark:hover:border-slate-700 hover:text-ink',
                    )}
                  >
                    <div className="text-xs font-bold">{p.label}</div>
                    <div className="text-[10px] text-muted mt-0.5">{p.hint}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Count & Time */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-2 border-t border-line text-sm">
            <label className="flex items-center gap-2 font-medium text-ink">
              <span>Số câu đề thi:</span>
              <input
                type="number"
                min={1}
                max={Math.max(1, customPool.length)}
                value={customCount}
                onChange={(e) => setCustomCount(Math.max(1, Math.min(customPool.length || 1, Number(e.target.value) || 1)))}
                className={num}
              />
              <span className="text-xs text-muted font-normal">
                / {customPool.length} câu khả dụng
              </span>
            </label>

            <label className="flex items-center gap-2 font-medium text-ink">
              <Clock size={16} className="text-muted" />
              <span>Thời gian:</span>
              <input
                type="number"
                min={0}
                max={300}
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Math.max(0, Math.min(300, Number(e.target.value) || 0)))}
                className={num}
              />
              <span>phút</span>
              <span className="text-xs text-muted font-normal">(0 = không tính giờ)</span>
            </label>
          </div>

          {/* Start Custom Action Button */}
          <div className="pt-2">
            <Button
              variant="primary"
              disabled={customPool.length === 0}
              onClick={startCustom}
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              <Zap size={18} /> Bắt đầu bài thi tùy biến ({Math.min(customCount, customPool.length)} câu)
            </Button>
            {customPool.length === 0 && (
              <p className="mt-2 text-xs text-rose-500">
                Không tìm thấy câu hỏi nào thỏa mãn bộ lọc hiện tại. Thử chọn lại nguồn câu hỏi hoặc thêm chương.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
