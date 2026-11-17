import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CalendarClock, Play, Sparkles, XCircle } from 'lucide-react'
import type { Entry } from '../types'
import { allEntries } from '../data'
import { useProgress } from '../features/learning/ProgressContext'
import { buildToday, REVIEW_CAP } from '../services/review/today'
import { dailyActivity } from '../services/stats'
import { loadSettings } from '../services/storage/settings'
import FlashcardSession from '../components/flashcards/FlashcardSession'
import { Button, Card, PageHeader } from '../components/ui'
import { dayKey } from '../utils'

/** One-button daily session: due cards, then cards answered wrong, then new cards up to the daily goal. */
export default function TodayPage() {
  const { progress, activity, get, summary } = useProgress()
  const [session, setSession] = useState<Entry[] | null>(null)
  const settings = loadSettings()
  const doneToday = useMemo(() => dailyActivity(activity).get(dayKey(new Date()))?.items.size ?? 0, [activity])
  const goalLeft = Math.max(0, settings.dailyGoal - doneToday)

  const plan = useMemo(
    () => buildToday({ entries: allEntries(), progress: get, goalLeft, examDates: settings.examDates }),
    // `progress` is the trigger: `get` reads the latest map but keeps the same identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress, goalLeft],
  )
  const total = plan.due.length + plan.wrong.length + plan.fresh.length

  if (session)
    return (
      <div className="mx-auto max-w-3xl">
        <button onClick={() => setSession(null)} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft size={14} /> Học hôm nay
        </button>
        <FlashcardSession entries={session} mode="review" />
      </div>
    )

  const rows = [
    { icon: CalendarClock, label: 'Thẻ đến hạn ôn', hint: 'Đã qua khoảng nghỉ của hộp Leitner', n: plan.due.length },
    { icon: XCircle, label: 'Câu sai / đã đánh dấu', hint: 'Lần gần nhất trả lời sai, chưa nhớ hoặc bạn đánh dấu', n: plan.wrong.length },
    { icon: Sparkles, label: 'Thẻ mới', hint: 'Môn có ngày thi gần nhất được ưu tiên', n: plan.fresh.length },
  ]
  const backlog = summary.needReview - plan.due.length - plan.wrong.length

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Học hôm nay" subtitle="Một phiên học được ghép sẵn: ôn thẻ đến hạn trước, rồi câu sai, rồi thẻ mới cho đủ mục tiêu ngày" />
      <Card className="divide-y divide-line">
        {rows.map(({ icon: Icon, label, hint, n }) => (
          <div key={label} className={`flex items-center gap-4 p-4 ${n ? '' : 'opacity-50'}`}>
            <Icon size={20} className="shrink-0 text-muted" />
            <div className="min-w-0 flex-1">
              <div className="font-medium">{label}</div>
              <div className="text-sm text-muted">{hint}</div>
            </div>
            <div className="text-2xl font-semibold">{n}</div>
          </div>
        ))}
      </Card>

      <p className="mt-3 text-sm text-muted">
        Mục tiêu hôm nay: đã học {doneToday} / {settings.dailyGoal} câu
        {goalLeft > 0 ? `, còn ${goalLeft} câu.` : '. Đã đạt mục tiêu, phiên này là học thêm.'}
        {backlog > 0 && ` Còn ${backlog} thẻ cần ôn nữa để dành cho phiên sau (mỗi phiên tối đa ${REVIEW_CAP} thẻ ôn).`}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled={!total} className="px-5 py-2.5" onClick={() => setSession([...plan.due, ...plan.wrong, ...plan.fresh])}>
          <Play size={16} /> Bắt đầu {total} thẻ
        </Button>
        {!total && <span className="text-sm text-muted">Không còn thẻ nào để học: bạn đã học hết mọi bộ.</span>}
        <Link to="/settings" className="text-xs font-semibold text-indigo-600 hover:underline">
          Đổi mục tiêu ngày
        </Link>
      </div>
    </div>
  )
}
