import { Coffee, Pause, Play, RotateCcw, SkipForward, Timer } from 'lucide-react'
import { fmtClock, pomodoro, usePomodoro } from '../../services/pomodoro'
import { cx } from '../../utils'

/** Pomodoro timer. `compact` is the one-button version for the phone header. */
export default function Pomodoro({ compact = false }: { compact?: boolean }) {
  const s = usePomodoro()
  const work = s.phase === 'work'
  const label = work ? 'Tập trung' : 'Nghỉ ngơi'

  if (compact)
    return (
      <button
        onClick={pomodoro.toggle}
        title={`${label}: bấm để ${s.running ? 'tạm dừng' : 'bắt đầu'}`}
        className={cx(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs font-bold transition-all cursor-pointer',
          s.running
            ? work
              ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
            : 'border-slate-200 dark:border-line text-slate-600 dark:text-muted hover:text-ink',
        )}
      >
        {work ? <Timer size={13} className="text-indigo-600 dark:text-indigo-400" /> : <Coffee size={13} className="text-emerald-600 dark:text-emerald-400" />}
        <span>{fmtClock(s.remainingMs)}</span>
      </button>
    )

  const iconBtn =
    'inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 dark:text-muted transition-colors hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 cursor-pointer'

  return (
    <div className="mb-3 rounded-2xl border border-slate-200/80 dark:border-line bg-slate-50/80 dark:bg-slate-900/50 p-3 text-xs">
      <div className="flex items-center justify-between font-semibold text-slate-500 dark:text-muted">
        <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
          {work ? <Timer size={14} className="text-indigo-600 dark:text-indigo-400" /> : <Coffee size={14} className="text-emerald-600 dark:text-emerald-400" />}
          <span>{label}</span>
        </span>
        <span className="text-[11px]" title="Số phiên tập trung đã xong hôm nay">
          {s.doneToday} phiên
        </span>
      </div>

      <div className="mt-1.5 flex items-center justify-between">
        <span
          className={cx(
            'font-mono text-2xl font-black tracking-tight',
            s.running
              ? work
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-700 dark:text-slate-300',
          )}
        >
          {fmtClock(s.remainingMs)}
        </span>

        <span className="flex items-center gap-0.5">
          <button
            onClick={pomodoro.toggle}
            className={iconBtn}
            title={s.running ? 'Tạm dừng' : 'Bắt đầu'}
            aria-label={s.running ? 'Tạm dừng' : 'Bắt đầu'}
          >
            {s.running ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button
            onClick={pomodoro.skip}
            className={iconBtn}
            title={work ? 'Chuyển sang nghỉ' : 'Bỏ qua giờ nghỉ'}
            aria-label="Chuyển pha"
          >
            <SkipForward size={15} />
          </button>
          <button
            onClick={pomodoro.reset}
            className={iconBtn}
            title="Đặt lại"
            aria-label="Đặt lại"
          >
            <RotateCcw size={14} />
          </button>
        </span>
      </div>
    </div>
  )
}
