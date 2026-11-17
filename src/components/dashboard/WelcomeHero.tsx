import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Award, CalendarCheck2, Flame, Play, Sparkles, TrendingUp } from 'lucide-react'
import { useProgress } from '../../features/learning/ProgressContext'
import { dailyActivity, streaks } from '../../services/stats'
import { loadSettings } from '../../services/storage/settings'
import { dayKey, pct } from '../../utils'

export default function WelcomeHero() {
  const { summary, activity } = useProgress()
  const settings = loadSettings()
  const days = useMemo(() => dailyActivity(activity), [activity])
  const todayActivities = days.get(dayKey(new Date()))
  const doneToday = todayActivities?.items.size ?? 0
  const { current: streakDays } = streaks(days.keys())
  const goal = settings.dailyGoal
  const overall = pct(summary.mastered, summary.items)

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 11) return { text: 'Chào buổi sáng', sub: 'Khởi đầu ngày mới với một phiên ôn tập nhẹ nhàng!' }
    if (hour >= 11 && hour < 14) return { text: 'Chào buổi trưa', sub: 'Dành vài phút ôn lại thẻ nhớ trước giờ nghỉ trưa nào.' }
    if (hour >= 14 && hour < 18) return { text: 'Chào buổi chiều', sub: 'Tiếp tục duy trì nhịp độ học tập để bứt phá điểm số!' }
    if (hour >= 18 && hour < 22) return { text: 'Chào buổi tối', sub: 'Thời điểm lý tưởng để củng cố kiến thức và làm bài thi thử.' }
    return { text: 'Cú đêm chăm chỉ', sub: 'Đừng quên ngủ đủ giấc để não bộ củng cố trí nhớ dài hạn nhé!' }
  }, [])

  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-card via-card to-indigo-50/40 dark:to-indigo-950/20 p-6 sm:p-7 shadow-xs mb-6">
      {/* Background soft ambient glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute right-32 -bottom-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-2xl" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 dark:border-indigo-800/80 bg-indigo-50/80 dark:bg-indigo-950/60 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300">
            <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400" />
            <span>{greeting.text}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
            Hôm nay bạn muốn học gì?
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            {greeting.sub} Bạn đã làm chủ <b className="text-ink font-semibold">{summary.mastered}</b> / {summary.items} câu ({overall}%).
          </p>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <div className="flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-1 text-xs font-semibold text-ink shadow-2xs">
              <Flame size={15} className={streakDays > 0 ? 'fill-orange-500 text-orange-500' : 'text-muted'} />
              <span>{streakDays} ngày liên tiếp</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-1 text-xs font-semibold text-ink shadow-2xs">
              <CalendarCheck2 size={15} className="text-emerald-500" />
              <span>Hôm nay: {doneToday} / {goal} câu</span>
            </div>

            {summary.needReview > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 shadow-2xs">
                <span>{summary.needReview} thẻ đến hạn ôn</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
          <Link
            to="/today"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-slate-950 to-indigo-600 dark:from-indigo-600 dark:to-indigo-500 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:opacity-95 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            <Play size={16} fill="white" />
            <span>Học hôm nay ngay</span>
          </Link>

          <Link
            to="/exam"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-line bg-card px-5 py-2.5 text-xs font-bold text-ink shadow-2xs transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.98]"
          >
            <Award size={15} className="text-indigo-600 dark:text-indigo-400" />
            <span>Thi thử theo môn</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
