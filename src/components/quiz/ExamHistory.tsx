import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { useProgress } from '../../features/learning/ProgressContext'
import { cx } from '../../utils'
import { Card } from '../ui'

const fmt = (s: number) => `${Math.floor(s / 60)}p${String(s % 60).padStart(2, '0')}`

/** History of timed exam attempts with a small score chart. collectionId omitted = all attempts. */
export default function ExamHistory({
  collectionId,
  limit = 10,
  compact = false,
}: {
  collectionId?: string
  limit?: number
  compact?: boolean
}) {
  const { exams } = useProgress()
  const list = exams.filter((e) => !collectionId || collectionId === 'all' || e.collectionId === collectionId)
  if (!list.length) {
    return compact ? null : <p className="text-sm text-muted">Chưa có lần thi thử nào. Làm một bài ở chế độ Thi thử để bắt đầu theo dõi.</p>
  }
  const recent = list.slice(-limit) // oldest → newest
  const last = recent[recent.length - 1]
  const prev = recent.length > 1 ? recent[recent.length - 2] : undefined
  const delta = prev ? Math.round((last.score10 - prev.score10) * 10) / 10 : 0
  const avg = Math.round((list.reduce((s, e) => s + e.score10, 0) / list.length) * 10) / 10
  const best = Math.max(...list.map((e) => e.score10))

  const body = (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm">
        <span className="font-medium">Lịch sử thi thử</span>
        <span className="text-muted">{list.length} lần · TB {avg}/10 · cao nhất {best}/10</span>
        {prev && (
          <span className={cx('inline-flex items-center gap-0.5 text-xs font-semibold', delta >= 0 ? 'text-ok' : 'text-err')}>
            {delta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {delta >= 0 ? '+' : ''}
            {delta} so với lần trước
          </span>
        )}
      </div>
      <div className="flex h-24 items-end gap-2">
        {recent.map((e, i) => (
          <div key={e.id ?? i} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${e.title}: ${e.score10}/10`}>
            <span className="text-[11px] text-muted">{e.score10}</span>
            <div
              className={cx('w-full max-w-9 rounded-t', e.score10 >= 5 ? 'bg-ok/80' : 'bg-err/70')}
              style={{ height: `${Math.max(4, e.score10 * 10)}%` }}
            />
          </div>
        ))}
      </div>
      {!compact && (
        <div className="mt-4 divide-y divide-line text-sm">
          {[...recent].reverse().map((e, i) => (
            <div key={e.id ?? i} className="flex items-center gap-3 py-2">
              <span className="w-28 shrink-0 text-xs text-muted">{new Date(e.ts).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</span>
              <span className="min-w-0 flex-1 truncate">{e.title}</span>
              <span className="shrink-0 text-xs text-muted">
                {e.correct}/{e.total} · {fmt(e.durationSec)}
              </span>
              <span className={cx('w-12 shrink-0 text-right font-semibold', e.score10 >= 5 ? 'text-ok' : 'text-err')}>{e.score10}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
  return compact ? <div className="border-t border-line pt-5">{body}</div> : <Card className="p-5">{body}</Card>
}
