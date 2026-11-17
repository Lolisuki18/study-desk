import { Coffee, Pause, Play, RotateCcw, SkipForward, Timer } from 'lucide-react'
import { fmtClock, pomodoro, usePomodoro } from '../../services/pomodoro'
import { cx } from '../../utils'

/** Pomodoro timer. `compact` is the one-button version for the phone header. */
export default function Pomodoro({ compact = false }: { compact?: boolean }) {
  const s = usePomodoro()
  const work = s.phase === 'work'
  const label = work ? 'Tập trung' : 'Nghỉ'

  if (compact)
    return (
      <button
        onClick={pomodoro.toggle}
        title={`${label}: bấm để ${s.running ? 'tạm dừng' : 'bắt đầu'}`}
        className={cx(
          'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-xs font-semibold',
          s.running ? (work ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700') : 'border-line text-muted',
        )}
      >
        {work ? <Timer size={12} /> : <Coffee size={12} />} {fmtClock(s.remainingMs)}
      </button>
    )

  const icon = 'inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-slate-100 hover:text-ink'
  return (
    <div className="mb-3 rounded-xl border border-line bg-slate-50/70 p-3.5 text-xs">
      <div className="flex items-center justify-between font-medium text-muted">
        <span className="inline-flex items-center gap-1.5">
          {work ? <Timer size={13} /> : <Coffee size={13} />} {label}
        </span>
        <span title="Số phiên tập trung đã xong hôm nay">{s.doneToday} phiên hôm nay</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className={cx('font-mono text-2xl font-bold tracking-tight', s.running ? (work ? 'text-ink' : 'text-emerald-600') : 'text-muted')}>
          {fmtClock(s.remainingMs)}
        </span>
        <span className="flex items-center gap-0.5">
          <button onClick={pomodoro.toggle} className={icon} title={s.running ? 'Tạm dừng' : 'Bắt đầu'} aria-label={s.running ? 'Tạm dừng' : 'Bắt đầu'}>
            {s.running ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button onClick={pomodoro.skip} className={icon} title={work ? 'Chuyển sang nghỉ (không tính phiên này)' : 'Bỏ qua giờ nghỉ'} aria-label="Chuyển pha">
            <SkipForward size={15} />
          </button>
          <button onClick={pomodoro.reset} className={icon} title="Đặt lại" aria-label="Đặt lại">
            <RotateCcw size={14} />
          </button>
        </span>
      </div>
    </div>
  )
}
