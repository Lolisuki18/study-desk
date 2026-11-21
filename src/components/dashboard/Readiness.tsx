import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Gauge } from 'lucide-react'
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
    [progress],
  )
  if (!rows.length) return null

  return (
    <section>
      <h2 className="mb-3.5 flex items-center gap-2 text-base font-bold text-slate-800 dark:text-ink">
        <Gauge size={18} className="text-indigo-600 dark:text-indigo-400" /> Mức sẵn sàng thi (ước lượng)
      </h2>
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        {rows.map(({ subject, r, left }) => {
          const mock = exams.filter((e) => e.collectionId === subjectExamId(subject)).at(-1)
          const weak = r.chapters.slice(0, 3)
          return (
            <Card key={subject} className="p-5">
              <div className="flex items-baseline justify-between gap-2">
                <div className="min-w-0 truncate font-bold text-slate-900 dark:text-white text-sm">{subject}</div>
                <div
                  className={cx(
                    'shrink-0 text-2xl font-black font-mono',
                    r.score10 >= 8 ? 'text-emerald-600 dark:text-emerald-400' : r.score10 >= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400',
                  )}
                >
                  ≈ {r.score10}
                  <span className="text-xs font-bold text-slate-400 dark:text-muted"> / 10</span>
                </div>
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-muted font-medium">
                Đã học {r.studied}/{r.total} câu ({pct(r.studied, r.total)}%)
                {mock ? ` · thi gần nhất: ${mock.score10}/10` : ''}
              </div>
              {left.length > 0 && (
                <div className="mt-1 text-[11px] text-slate-400 italic">
                  Không tính bộ trùng câu: {left.map((c) => c.title.replace('CNXH Khoa học – ', '')).join(', ')}
                </div>
              )}
              <div className="mt-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-muted">
                Chương cần tập trung cải thiện
              </div>
              <ul className="mt-2 space-y-1.5 text-xs">
                {weak.map((c) => (
                  <li key={c.label} className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5">
                    <span className="min-w-0 flex-1 truncate font-semibold text-slate-700 dark:text-slate-200">{c.label}</span>
                    <span className="shrink-0 text-[11px] text-slate-500 font-medium">
                      {c.studied}/{c.total} câu
                    </span>
                    <span className="w-12 shrink-0 text-right text-xs font-bold text-rose-600 dark:text-rose-400">
                      −{c.lost10} đ
                    </span>
                    <Link
                      to={`/drill?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(c.label)}`}
                      className="shrink-0 rounded-lg bg-indigo-600 px-2 py-1 text-[11px] font-bold text-white transition-colors hover:bg-indigo-700"
                      title={`Làm bài luyện gồm các câu yếu nhất của ${c.label}`}
                    >
                      Luyện
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-3.5 flex items-center justify-between border-t border-line/60 pt-2.5 text-xs">
                <span className="text-[11px] text-muted">Có câu hay làm sai?</span>
                <Link
                  to="/mistakes"
                  className="inline-flex items-center gap-1 font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
                >
                  Xem Sổ câu sai <ArrowRight size={13} />
                </Link>
              </div>
            </Card>
          )
        })}
      </div>
      <p className="mt-2.5 text-[11px] text-slate-400 dark:text-muted leading-relaxed">
        Ước lượng thô dựa trên hộp Leitner của các câu đã học và tỉ lệ đoán với câu chưa học.
      </p>
    </section>
  )
}
