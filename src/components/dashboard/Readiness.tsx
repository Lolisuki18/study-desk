import { useMemo } from 'react'
import { Gauge } from 'lucide-react'
import { allEntries, collections, examCollections, standaloneCollections } from '../../data'
import { useProgress } from '../../features/learning/ProgressContext'
import { estimateReadiness } from '../../services/readiness'
import { subjectExamId } from '../../services/quiz/exam'
import { cx, pct } from '../../utils'
import { Card } from '../ui'

/** Rough expected exam score per subject, and the chapters that cost the most points. */
export default function Readiness() {
  const { progress, get, exams } = useProgress()
  const rows = useMemo(
    () =>
      [...new Set(collections.filter((c) => !c.standalone).map((c) => c.subject))].sort().map((subject) => ({
        subject,
        r: estimateReadiness(allEntries(examCollections(subject)), get),
        left: standaloneCollections(subject),
      })),
    // `progress` is the trigger: `get` reads the latest map but keeps the same identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress],
  )
  if (!rows.length) return null

  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <Gauge size={18} className="text-muted" /> Mức sẵn sàng thi (ước lượng)
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {rows.map(({ subject, r, left }) => {
          const mock = exams.filter((e) => e.collectionId === subjectExamId(subject)).at(-1)
          const weak = r.chapters.slice(0, 3)
          return (
            <Card key={subject} className="p-4">
              <div className="flex items-baseline justify-between gap-2">
                <div className="min-w-0 truncate font-medium">{subject}</div>
                <div className={cx('shrink-0 text-2xl font-bold', r.score10 >= 8 ? 'text-ok' : r.score10 >= 5 ? 'text-amber-600' : 'text-err')}>
                  ≈ {r.score10}
                  <span className="text-sm font-medium text-muted"> / 10</span>
                </div>
              </div>
              <div className="mt-1 text-xs text-muted">
                Đã học {r.studied}/{r.total} câu ({pct(r.studied, r.total)}%)
                {mock ? ` · thi thử gần nhất: ${mock.score10}/10` : ''}
              </div>
              {left.length > 0 && <div className="mt-1 text-xs text-muted">Không tính bộ trùng câu: {left.map((c) => c.title.replace('CNXH Khoa học – ', '')).join(', ')}</div>}
              <div className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted">Chương đang kéo điểm xuống nhiều nhất</div>
              <ul className="mt-1.5 space-y-1 text-sm">
                {weak.map((c) => (
                  <li key={c.label} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate">{c.label}</span>
                    <span className="shrink-0 text-xs text-muted">
                      đã học {c.studied}/{c.total} · ≈ {c.score10}/10
                    </span>
                    <span className="w-14 shrink-0 text-right text-xs font-semibold text-err">−{c.lost10} đ</span>
                  </li>
                ))}
              </ul>
            </Card>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-muted">
        Con số này chỉ là ước lượng thô, không phải dự báo: câu chưa học tính như đoán mò (1/4 với câu 4 đáp án), câu đã học tính theo hộp Leitner (hộp 1 ≈ 60% … hộp 5 ≈ 96%), câu vừa sai ≈ 40%. Giả định đề thi rút đều từ toàn bộ ngân hàng câu hỏi trong app.
      </p>
    </section>
  )
}
