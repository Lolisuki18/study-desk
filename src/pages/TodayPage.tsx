import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CalendarClock, CheckCircle2, Layers, ListChecks, Play, Sparkles, XCircle } from 'lucide-react'
import type { Entry } from '../types'
import { allEntries } from '../data'
import { useProgress } from '../features/learning/ProgressContext'
import { buildToday, REVIEW_CAP } from '../services/review/today'
import { dailyActivity } from '../services/stats'
import { loadSettings } from '../services/storage/settings'
import { availableKinds, buildQuiz, type Question } from '../services/quiz/generate'
import FlashcardSession from '../components/flashcards/FlashcardSession'
import QuizRunner from '../components/quiz/QuizRunner'
import { Button, Card, Empty, PageHeader, ProgressBar } from '../components/ui'
import { cx, dayKey } from '../utils'

type Run = { kind: 'cards'; entries: Entry[] } | { kind: 'quiz'; qs: Question[]; n: number }

/** One-button daily session: due cards, then cards answered wrong, then new cards up to the daily goal. */
export default function TodayPage() {
  const { progress, activity, get, summary } = useProgress()
  const [run, setRun] = useState<Run | null>(null)
  const settings = loadSettings()
  const doneToday = useMemo(() => dailyActivity(activity).get(dayKey(new Date()))?.items.size ?? 0, [activity])
  const goalLeft = Math.max(0, settings.dailyGoal - doneToday)

  const plan = useMemo(
    () => buildToday({ entries: allEntries(), progress: get, goalLeft, examDates: settings.examDates }),
    [progress, goalLeft],
  )
  const total = plan.due.length + plan.wrong.length + plan.fresh.length
  const todayEntries = useMemo(() => [...plan.due, ...plan.wrong, ...plan.fresh], [plan])

  const startTodayQuiz = () => {
    const qs = buildQuiz(todayEntries, {
      count: todayEntries.length,
      kinds: availableKinds(todayEntries).filter((k) => k !== 'match'),
      randomize: true,
      distractorPool: allEntries(),
    })
    if (qs.length) setRun({ kind: 'quiz', qs, n: 0 })
  }

  if (run)
    return (
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => setRun(null)}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Quay lại kế hoạch học hôm nay
        </button>
        {run.kind === 'cards' ? (
          <FlashcardSession entries={run.entries} mode="review" />
        ) : (
          <QuizRunner
            key={run.n}
            questions={run.qs}
            mode="practice"
            onExit={() => setRun(null)}
            onRetry={(qs) => setRun({ kind: 'quiz', qs: qs.map((q) => ({ ...q, id: `${q.id}r` })), n: run.n + 1 })}
          />
        )}
      </div>
    )

  const rows = [
    {
      icon: CalendarClock,
      iconColor: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40',
      label: 'Thẻ đến hạn ôn tập SRS',
      hint: 'Đã hết khoảng nghỉ của hộp Leitner (1, 3, 7, 14, 30 ngày)',
      n: plan.due.length,
    },
    {
      icon: XCircle,
      iconColor: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40',
      label: 'Câu từng trả lời sai / đã đánh dấu',
      hint: 'Lần gần nhất làm sai hoặc bạn chủ động gắn cờ ôn lại',
      n: plan.wrong.length,
    },
    {
      icon: Sparkles,
      iconColor: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40',
      label: 'Thẻ kiến thức mới',
      hint: 'Ưu tiên môn có ngày thi gần nhất để lấp đầy chỉ tiêu ngày',
      n: plan.fresh.length,
    },
  ]
  const backlog = summary.needReview - plan.due.length - plan.wrong.length

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Phiên học hôm nay"
        subtitle="Hệ thống tự động ghép phiên tối ưu: thẻ đến hạn trước, câu sai, rồi thẻ mới cho đủ mục tiêu ngày"
      />

      {/* Progress towards Daily Goal Card */}
      <Card className="p-5">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-bold text-ink">Mục tiêu học hôm nay</span>
          <span className="font-mono text-xs font-bold text-muted">
            {doneToday} / {settings.dailyGoal} câu ({Math.min(100, Math.round((doneToday / settings.dailyGoal) * 100))}%)
          </span>
        </div>
        <ProgressBar value={(doneToday / settings.dailyGoal) * 100} className="h-2.5" />
        <div className="mt-2 text-xs text-muted flex justify-between items-center">
          <span>
            {goalLeft > 0 ? (
              <>Cần học thêm <b className="text-ink">{goalLeft}</b> câu để đạt chỉ tiêu hôm nay.</>
            ) : (
              <span className="text-ok font-semibold">Đã hoàn thành mục tiêu ngày hôm nay 🎉</span>
            )}
          </span>
          <Link to="/settings" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Chỉnh mục tiêu
          </Link>
        </div>
      </Card>

      {/* Breakdown Rows */}
      <Card className="divide-y divide-line overflow-hidden shadow-xs">
        {rows.map(({ icon: Icon, iconColor, label, hint, n }) => (
          <div key={label} className={cx('flex items-center gap-4 p-4 sm:p-5 transition-colors', n === 0 && 'opacity-50')}>
            <div className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', iconColor)}>
              <Icon size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-ink text-sm sm:text-base">{label}</div>
              <div className="text-xs text-muted mt-0.5 leading-relaxed">{hint}</div>
            </div>
            <div className="text-2xl font-black font-mono text-ink">{n}</div>
          </div>
        ))}
      </Card>

      {backlog > 0 && (
        <p className="text-xs text-muted italic">
          💡 Còn {backlog} thẻ cần ôn nữa được giữ lại cho phiên tiếp theo (mỗi phiên giới hạn tối đa {REVIEW_CAP} thẻ ôn để tránh quá tải não bộ).
        </p>
      )}

      {/* Start Button Area: Dual Mode */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button
          variant="primary"
          disabled={!total}
          className="px-6 py-3 text-sm sm:text-base font-bold shadow-md shadow-indigo-500/20 cursor-pointer"
          onClick={() => setRun({ kind: 'cards', entries: todayEntries })}
        >
          <Layers size={18} />
          <span>Ôn bằng Thẻ ({total})</span>
        </Button>

        <Button
          disabled={!total}
          className="px-6 py-3 text-sm sm:text-base font-bold border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer"
          onClick={startTodayQuiz}
        >
          <ListChecks size={18} />
          <span>Làm Trắc nghiệm ({total})</span>
        </Button>

        {!total && (
          <div className="flex items-center gap-2 text-sm font-semibold text-ok">
            <CheckCircle2 size={18} />
            <span>Bạn đã hoàn thành sạch sẽ mọi thẻ cần ôn hôm nay!</span>
          </div>
        )}
      </div>
    </div>
  )
}
