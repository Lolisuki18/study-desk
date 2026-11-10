import { collections } from '../data'
import { collectionStats, useProgress } from '../features/learning/ProgressContext'
import RecentActivity from '../components/dashboard/RecentActivity'
import ExamHistory from '../components/quiz/ExamHistory'
import { Card, PageHeader, ProgressBar, Stat } from '../components/ui'
import { dayKey, pct } from '../utils'

export default function StatsPage() {
  const { summary, progress, activity } = useProgress()
  const quiz = activity.filter((a) => a.kind === 'quiz')
  const quizOk = quiz.filter((a) => a.result === 'correct').length
  const acc = quiz.length ? `${pct(quizOk, quiz.length)}%` : '—'

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return { key: dayKey(d), label: d.toLocaleDateString('vi-VN', { weekday: 'short' }), n: 0 }
  })
  for (const a of activity) {
    const d = days.find((x) => x.key === dayKey(a.ts))
    if (d) d.n++
  }
  const maxN = Math.max(1, ...days.map((d) => d.n))

  return (
    <div>
      <PageHeader title="Thống kê" />
      <div className="grid grid-cols-4 gap-3">
        <Stat label="Đã học" value={summary.studied} hint={`/ ${summary.items} mục`} />
        <Stat label="Đã thuộc" value={summary.mastered} tone="ok" />
        <Stat label="Cần ôn" value={summary.needReview} tone={summary.needReview ? 'err' : undefined} />
        <Stat label="Độ chính xác quiz" value={acc} hint={`${quizOk}/${quiz.length} câu đúng`} />
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

      <h2 className="mb-3 mt-8 text-lg font-semibold">Lịch sử thi thử</h2>
      <ExamHistory limit={12} />

      <h2 className="mb-3 mt-8 text-lg font-semibold">Tiến độ theo bộ học</h2>
      <Card className="divide-y divide-line">
        {collections.map((c) => {
          const st = collectionStats(c.id, c.items.map((i) => i.id), progress)
          return (
            <div key={c.id} className="flex items-center gap-4 px-4 py-3 text-sm">
              <div className="min-w-0 flex-1 truncate">{c.title}</div>
              <div className="w-48">
                <ProgressBar value={pct(st.mastered, st.total)} />
              </div>
              <div className="w-28 text-right text-xs text-muted">
                {st.mastered}/{st.total} đã thuộc
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
