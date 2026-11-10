import { useMemo, useState } from 'react'
import { CalendarDays, Target } from 'lucide-react'
import { collections, progressKey } from '../../data'
import { useProgress } from '../../features/learning/ProgressContext'
import { isMastered, reviewReasons } from '../../services/review/srs'
import { loadSettings, saveSettings } from '../../services/storage/settings'
import { dayKey } from '../../utils'
import { Card, ProgressBar } from '../ui'

const DAY = 86_400_000
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/** Study plan towards the exam date of each subject: how many items to learn per day and today's progress. */
export default function ExamPlan() {
  const { progress, activity } = useProgress()
  const [dates, setDates] = useState(() => loadSettings().examDates)
  const [editing, setEditing] = useState(false)
  const subjects = useMemo(() => [...new Set(collections.map((c) => c.subject))].sort(), [])

  const setDate = (subject: string, value: string) => {
    const next = { ...dates }
    if (value) next[subject] = value
    else delete next[subject]
    setDates(next)
    saveSettings({ ...loadSettings(), examDates: next })
  }

  const today = startOfDay(new Date())
  const todayKey = dayKey(new Date())

  const rows = subjects
    .filter((s) => dates[s])
    .map((subject) => {
      const items = collections.filter((c) => c.subject === subject).flatMap((c) => c.items.map((it) => ({ c, it })))
      const notMastered = items.filter(({ c, it }) => !isMastered(progress.get(progressKey(c.id, it.id)))).length
      const due = items.filter(({ c, it }) => reviewReasons(progress.get(progressKey(c.id, it.id))).includes('due')).length
      const [y, m, d] = dates[subject].split('-').map(Number)
      const exam = new Date(y, m - 1, d)
      const daysLeft = Math.round((exam.getTime() - today.getTime()) / DAY)
      // distinct items of this subject touched today
      const ids = new Set(collections.filter((c) => c.subject === subject).map((c) => c.id))
      const doneToday = new Set(activity.filter((a) => ids.has(a.collectionId) && dayKey(a.ts) === todayKey).map((a) => `${a.collectionId}::${a.itemId}`)).size
      const perDay = daysLeft > 0 ? Math.ceil(notMastered / daysLeft) : notMastered
      return { subject, total: items.length, notMastered, due, daysLeft, perDay, doneToday }
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Target size={18} className="text-muted" /> Kế hoạch ôn thi
        </h2>
        <button onClick={() => setEditing((e) => !e)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink">
          <CalendarDays size={14} /> {editing || !rows.length ? 'Xong' : 'Đặt / sửa ngày thi'}
        </button>
      </div>

      {(editing || !rows.length) && (
        <Card className="mb-3 p-4">
          <p className="mb-3 text-sm text-muted">Chọn ngày thi của từng môn, app sẽ tự chia số câu cần học mỗi ngày.</p>
          <div className="grid grid-cols-2 gap-3">
            {subjects.map((s) => (
              <label key={s} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{s}</span>
                <span className="flex items-center gap-1">
                  <input
                    type="date"
                    value={dates[s] ?? ''}
                    min={dayKey(new Date())}
                    onChange={(e) => setDate(s, e.target.value)}
                    className="rounded-lg border border-line bg-card px-2 py-1 text-sm"
                  />
                  {dates[s] && (
                    <button onClick={() => setDate(s, '')} className="text-xs text-muted hover:text-err" title="Xoá ngày thi">
                      ✕
                    </button>
                  )}
                </span>
              </label>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        {rows.map((r) => {
          const left = Math.max(0, r.perDay - r.doneToday)
          const over = r.daysLeft < 0
          return (
            <Card key={r.subject} className="p-4">
              <div className="flex items-baseline justify-between gap-2">
                <div className="min-w-0 truncate font-medium">{r.subject}</div>
                <div className={`shrink-0 text-xs font-semibold ${r.daysLeft <= 3 && !over ? 'text-err' : 'text-muted'}`}>
                  {over ? 'Đã qua ngày thi' : r.daysLeft === 0 ? 'Thi hôm nay' : `Còn ${r.daysLeft} ngày`}
                </div>
              </div>
              {over ? (
                <p className="mt-2 text-sm text-muted">Hãy đặt lại ngày thi mới nếu cần.</p>
              ) : (
                <>
                  <div className="mt-2 text-sm">
                    {left > 0 ? (
                      <>
                        Hôm nay cần học thêm <b className="text-lg">{left}</b> câu
                      </>
                    ) : (
                      <span className="font-medium text-ok">Đã đủ chỉ tiêu hôm nay 🎉</span>
                    )}
                  </div>
                  <ProgressBar value={r.perDay ? (r.doneToday / r.perDay) * 100 : 100} className="mt-2" />
                  <div className="mt-2 flex justify-between text-xs text-muted">
                    <span>
                      Chỉ tiêu {r.perDay}/ngày · đã làm {r.doneToday}
                    </span>
                    <span>
                      Chưa thuộc {r.notMastered}/{r.total}
                      {r.due > 0 ? ` · ${r.due} đến hạn ôn` : ''}
                    </span>
                  </div>
                </>
              )}
            </Card>
          )
        })}
      </div>
    </section>
  )
}
