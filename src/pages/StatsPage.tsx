import { useMemo } from 'react'
import { collections } from '../data'
import { collectionStats, useProgress } from '../features/learning/ProgressContext'
import { accuracyByCollection, addDays, dailyActivity, dueForecast, fmtMinutes, streaks, studyMinutesByDay } from '../services/stats'
import { pomodoroLog } from '../services/pomodoro'
import { loadSettings } from '../services/storage/settings'
import RecentActivity from '../components/dashboard/RecentActivity'
import ExamHistory from '../components/quiz/ExamHistory'
import { Card, PageHeader, ProgressBar, Stat } from '../components/ui'
import { cx, dayKey, pct } from '../utils'

const WEEKS = 18
const heat = (n: number) => (n === 0 ? 'bg-slate-100' : n < 10 ? 'bg-emerald-200' : n < 30 ? 'bg-emerald-400' : 'bg-emerald-600')

export default function StatsPage() {
  const { summary, progress, activity, exams } = useProgress()
  const quiz = activity.filter((a) => a.kind === 'quiz')
  const quizOk = quiz.filter((a) => a.result === 'correct').length
  const acc = quiz.length ? `${pct(quizOk, quiz.length)}%` : '—'

  const byDay = useMemo(() => dailyActivity(activity), [activity])
  const streak = useMemo(() => streaks(byDay.keys()), [byDay])
  const accuracy = useMemo(() => accuracyByCollection(activity), [activity])
  const forecast = useMemo(() => dueForecast(progress.values(), 7), [progress])
  const minutes = useMemo(() => studyMinutesByDay(activity, exams), [activity, exams])
  const pomo = pomodoroLog()
  const goal = loadSettings().dailyGoal
  const today = new Date()
  const goalDays = [...byDay.values()].filter((d) => d.items.size >= goal).length

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i - 6)
    return { key: dayKey(d), label: d.toLocaleDateString('vi-VN', { weekday: 'short' }), n: byDay.get(dayKey(d))?.answers ?? 0, min: minutes.get(dayKey(d)) ?? 0 }
  })
  const maxN = Math.max(1, ...days.map((d) => d.n))
  const maxMin = Math.max(1, ...days.map((d) => d.min))
  const todayKey = dayKey(today)
  const weekMin = days.reduce((s, d) => s + d.min, 0)

  // heatmap: whole weeks (Mon → Sun), ending with the current week
  const monday = addDays(today, -((today.getDay() + 6) % 7) - (WEEKS - 1) * 7)
  const cells = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const d = addDays(monday, i)
    return { d, key: dayKey(d), n: byDay.get(dayKey(d))?.answers ?? 0, future: d.getTime() > today.getTime() }
  })

  const next = forecast.map((n, i) => {
    const d = addDays(today, i)
    return { n, label: i === 0 ? 'Hôm nay' : d.toLocaleDateString('vi-VN', { weekday: 'short' }) }
  })
  const maxDue = Math.max(1, ...forecast)

  return (
    <div>
      <PageHeader title="Thống kê" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Đã học" value={summary.studied} hint={`/ ${summary.items} mục`} />
        <Stat label="Đã thuộc" value={summary.mastered} tone="ok" />
        <Stat label="Cần ôn" value={summary.needReview} tone={summary.needReview ? 'err' : undefined} />
        <Stat label="Độ chính xác quiz" value={acc} hint={`${quizOk}/${quiz.length} câu đúng`} />
        <Stat label="Chuỗi ngày học" value={streak.current} hint="ngày liên tiếp" tone={streak.current ? 'ok' : undefined} />
        <Stat label="Chuỗi dài nhất" value={streak.longest} hint="ngày" />
        <Stat label="Số ngày đã học" value={byDay.size} />
        <Stat label="Ngày đạt mục tiêu" value={goalDays} hint={`mục tiêu ${goal} câu/ngày`} />
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Hoạt động 7 ngày</h2>
      <Card className="flex h-40 items-end gap-3 p-4">
        {days.map((d) => (
          <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-xs text-muted">{d.n || ''}</span>
            <div className="w-full max-w-10 rounded-t bg-ok/80" style={{ height: `${(d.n / maxN) * 100}%`, minHeight: d.n ? 3 : 0 }} />
            <span className="text-xs text-muted">{d.label}</span>
          </div>
        ))}
      </Card>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Thời gian học 7 ngày (ước tính)</h2>
      <Card className="flex h-40 items-end gap-3 p-4">
        {days.map((d) => (
          <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-xs text-muted">{d.min ? `${d.min}p` : ''}</span>
            <div className="w-full max-w-10 rounded-t bg-indigo-400/80" style={{ height: `${(d.min / maxMin) * 100}%`, minHeight: d.min ? 3 : 0 }} />
            <span className="text-xs text-muted">{d.label}</span>
          </div>
        ))}
      </Card>
      <p className="mt-2 text-xs text-muted">
        Hôm nay {fmtMinutes(minutes.get(todayKey) ?? 0)} · 7 ngày {fmtMinutes(weekMin)} · Pomodoro hôm nay: {pomo[todayKey]?.count ?? 0} phiên ({pomo[todayKey]?.minutes ?? 0} phút tập trung). Thời gian
        học được suy ra từ khoảng cách giữa các lần trả lời (nghỉ quá 5 phút không tính) cộng thời gian làm bài thi thử, nên chỉ là ước tính.
      </p>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Lịch học {WEEKS} tuần gần đây</h2>
      <Card className="p-4">
        <div className="overflow-x-auto">
          <div className="grid w-max grid-flow-col grid-rows-7 gap-1">
            {cells.map((c) => (
              <div
                key={c.key}
                title={c.future ? '' : `${c.d.toLocaleDateString('vi-VN')}: ${c.n} lượt trả lời`}
                className={cx('h-3.5 w-3.5 rounded-[3px]', c.future ? 'bg-transparent' : heat(c.n))}
              />
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
          <span>Ít</span>
          {[0, 1, 10, 30].map((n) => (
            <span key={n} className={cx('h-3 w-3 rounded-[3px]', heat(n))} />
          ))}
          <span>Nhiều</span>
          <span className="ml-3">Mỗi ô là một ngày, mỗi cột là một tuần (Thứ 2 ở trên cùng). Màu: 1–9, 10–29, từ 30 lượt trả lời.</span>
        </div>
      </Card>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Số thẻ đến hạn ôn trong 7 ngày tới</h2>
      <Card className="flex h-40 items-end gap-3 p-4">
        {next.map((d, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-xs text-muted">{d.n || ''}</span>
            <div className={cx('w-full max-w-10 rounded-t', i === 0 ? 'bg-err/70' : 'bg-indigo-400/80')} style={{ height: `${(d.n / maxDue) * 100}%`, minHeight: d.n ? 3 : 0 }} />
            <span className="text-xs text-muted">{d.label}</span>
          </div>
        ))}
      </Card>
      <p className="mt-2 text-xs text-muted">“Hôm nay” gồm cả thẻ đã quá hạn. Dự báo chỉ tính các thẻ bạn đã học, chưa gồm thẻ mới.</p>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Lịch sử thi thử</h2>
      <ExamHistory limit={12} />

      <h2 className="mb-3 mt-8 text-lg font-semibold">Tiến độ và độ chính xác theo bộ học</h2>
      <Card className="divide-y divide-line">
        {collections.map((c) => {
          const st = collectionStats(c.id, c.items.map((i) => i.id), progress)
          const a = accuracy.get(c.id)
          const rate = a ? pct(a.correct, a.total) : null
          return (
            <div key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
              <div className="min-w-0 flex-1 basis-48 truncate">{c.title}</div>
              <div className="w-32 md:w-48">
                <ProgressBar value={pct(st.mastered, st.total)} />
              </div>
              <div className="w-28 text-right text-xs text-muted">
                {st.mastered}/{st.total} đã thuộc
              </div>
              <div
                className={cx('w-24 text-right text-xs font-semibold', rate === null ? 'text-muted' : rate >= 70 ? 'text-ok' : rate >= 50 ? 'text-amber-600' : 'text-err')}
                title={a ? `${a.correct}/${a.total} lượt trả lời đúng` : 'Chưa làm câu nào'}
              >
                {rate === null ? '—' : `đúng ${rate}%`}
              </div>
            </div>
          )
        })}
      </Card>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Hoạt động gần đây</h2>
      <RecentActivity limit={15} />
    </div>
  )
}
