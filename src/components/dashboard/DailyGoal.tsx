import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Play, Target, PartyPopper } from 'lucide-react'
import { useProgress } from '../../features/learning/ProgressContext'
import { dailyActivity, streaks } from '../../services/stats'
import { loadSettings, saveSettings } from '../../services/storage/settings'
import { dayKey } from '../../utils'
import { Card, ProgressBar } from '../ui'

/** Today's progress towards the daily goal (distinct items studied) and the current study streak. */
export default function DailyGoal() {
  const { activity, summary } = useProgress()
  const [goal, setGoal] = useState(() => loadSettings().dailyGoal)
  const days = useMemo(() => dailyActivity(activity), [activity])
  const done = days.get(dayKey(new Date()))?.items.size ?? 0
  const { current } = streaks(days.keys())
  const left = Math.max(0, goal - done)

  const change = (v: number) => {
    const g = Math.max(1, Math.min(999, v || 1))
    setGoal(g)
    saveSettings({ ...loadSettings(), dailyGoal: g })
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-ink">
          <Target size={18} className="text-indigo-600 dark:text-indigo-400" />
          <span>Mục tiêu hôm nay</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400" title="Số ngày học liên tiếp">
            <Flame size={16} className={current ? 'fill-amber-500 text-amber-500' : 'text-slate-400'} />
            <span>{current} ngày liên tiếp</span>
          </span>
          <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-muted font-medium">
            Chỉ tiêu
            <input
              type="number"
              min={1}
              max={999}
              value={goal}
              onChange={(e) => change(Number(e.target.value))}
              className="w-16 rounded-xl border border-slate-200 dark:border-line bg-card px-2.5 py-1 text-right text-xs font-bold text-slate-800 dark:text-ink outline-none focus:border-indigo-500"
              aria-label="Số câu cần học mỗi ngày"
            />
            câu/ngày
          </label>
        </div>
      </div>
      <ProgressBar value={(done / goal) * 100} className="mt-3.5 h-2.5" />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-xs text-slate-600 dark:text-muted">
          {left > 0 ? (
            <>
              Đã học <b className="text-slate-900 dark:text-white font-bold">{done}</b> / {goal} câu, còn <b className="text-indigo-600 font-bold">{left}</b> câu nữa.
            </>
          ) : (
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Đã đạt mục tiêu hôm nay: {done} câu <PartyPopper size={15} className="ml-1 inline" /></span>
          )}
        </span>
        <Link
          to="/today"
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-[0.98]"
        >
          <Play size={13} fill="white" />
          <span>Học hôm nay{summary.needReview > 0 ? ` · ${summary.needReview} thẻ cần ôn` : ''}</span>
        </Link>
      </div>
    </Card>
  )
}
