import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Award, CalendarCheck2, Flame, Play, Sparkles } from 'lucide-react'
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
    <div className="rounded-3xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/90 via-white to-sky-50/50 dark:from-slate-900/90 dark:via-slate-900 dark:to-indigo-950/40 p-6 sm:p-7 shadow-[0_2px_12px_rgba(99,102,241,0.06)] dark:shadow-none mb-6 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 shadow-2xs">
            <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400" />
            <span>{greeting.text}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Hôm nay bạn muốn học gì?
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {greeting.sub} Bạn đã làm chủ <b className="text-slate-900 dark:text-white font-bold">{summary.mastered}</b> / {summary.items} câu ({overall}%).
          </p>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/90 dark:bg-amber-950/40 px-3 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 shadow-2xs">
              <Flame size={15} className={streakDays > 0 ? 'fill-amber-500 text-amber-500' : 'text-slate-400'} />
              <span>{streakDays} ngày liên tiếp</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/90 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-2xs">
              <CalendarCheck2 size={15} className="text-emerald-600 dark:text-emerald-400" />
              <span>Hôm nay: {doneToday} / {goal} câu</span>
            </div>

            {summary.needReview > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/90 dark:bg-rose-950/40 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 shadow-2xs">
                <span>{summary.needReview} thẻ đến hạn</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
          <Link
            to="/today"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 text-sm font-bold shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Play size={16} fill="white" />
            <span>Học hôm nay ngay</span>
          </Link>

          <Link
            to="/exam"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-line bg-white dark:bg-card px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 active:scale-[0.98]"
          >
            <Award size={15} className="text-indigo-600 dark:text-indigo-400" />
            <span>Thi thử theo môn</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
