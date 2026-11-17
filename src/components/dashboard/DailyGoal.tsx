import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Play, Target } from 'lucide-react'
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
    <Card className="mt-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Target size={17} className="text-muted" /> Mục tiêu hôm nay
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="inline-flex items-center gap-1 font-semibold" title="Số ngày học liên tiếp">
            <Flame size={16} className={current ? 'fill-orange-400 text-orange-500' : 'text-muted'} /> {current} ngày liên tiếp
          </span>
          <label className="flex items-center gap-1.5 text-xs text-muted">
            Chỉ tiêu
            <input
              type="number"
              min={1}
              max={999}
              value={goal}
              onChange={(e) => change(Number(e.target.value))}
              className="w-16 rounded-lg border border-line bg-card px-2 py-1 text-right text-sm text-ink"
              aria-label="Số câu cần học mỗi ngày"
            />
            câu/ngày
          </label>
        </div>
      </div>
      <ProgressBar value={(done / goal) * 100} className="mt-3" />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          {left > 0 ? (
            <>
              Đã học <b>{done}</b> / {goal} câu, còn <b>{left}</b> câu nữa
            </>
          ) : (
            <span className="font-medium text-ok">Đã đạt mục tiêu hôm nay: {done} câu 🎉</span>
          )}
        </span>
        <Link
          to="/today"
          className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white shadow-2xs transition hover:bg-slate-800 active:scale-[0.98]"
        >
          <Play size={15} /> Học hôm nay{summary.needReview > 0 ? ` · ${summary.needReview} thẻ cần ôn` : ''}
        </Link>
      </div>
    </Card>
  )
}
