import { useMemo, useState } from 'react'
import { ArrowLeft, Layers, ListChecks, NotebookPen, Printer } from 'lucide-react'
import type { Entry } from '../types'
import { allEntries, collections, itemTitle, progressKey } from '../data'
import { useProgress } from '../features/learning/ProgressContext'
import { availableKinds, buildQuiz, type Question } from '../services/quiz/generate'
import FlashcardSession from '../components/flashcards/FlashcardSession'
import QuizRunner from '../components/quiz/QuizRunner'
import ItemSummary from '../components/ui/ItemSummary'
import { Button, Card, Empty, PageHeader } from '../components/ui'
import { cx } from '../utils'

const LIMIT = 100
const MINS = [1, 2, 3]

type Run = { kind: 'quiz'; qs: Question[]; n: number } | { kind: 'cards'; entries: Entry[] }

/** Notebook of every item answered wrong at least once, hardest first, with a "redo just these" action. */
export default function MistakesPage() {
  const { progress, notes } = useProgress()
  const [subject, setSubject] = useState('')
  const [min, setMin] = useState(1)
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [run, setRun] = useState<Run | null>(null)
  const subjects = useMemo(() => [...new Set(collections.map((c) => c.subject))].sort(), [])

  const rows = useMemo(
    () =>
      allEntries()
        .map((e) => ({ e, p: progress.get(progressKey(e.collection.id, e.item.id)) }))
        .filter((x) => x.p && x.p.incorrect >= min && (!subject || x.e.collection.subject === subject) && (!onlyOpen || x.p.lastResult === 'incorrect'))
        .sort((a, b) => b.p!.incorrect - a.p!.incorrect || a.p!.correct - b.p!.correct),
    [progress, subject, min, onlyOpen],
  )

  if (run)
    return (
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => setRun(null)}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Quay lại Sổ câu sai
        </button>
        {run.kind === 'cards' ? (
          <FlashcardSession entries={run.entries} mode="review" />
        ) : (
          <QuizRunner
            key={run.n}
            questions={run.qs}
            mode="practice"
            onExit={() => setRun(null)}
            onRetry={(qs) => setRun({ kind: 'quiz', qs: qs.map((q) => ({ ...q, id: `${q.id}r` })), n: run.n + 1 })}
          />
        )}
      </div>
    )

  const entries = rows.map((x) => x.e)
  const startQuiz = () => {
    const qs = buildQuiz(entries, {
      count: entries.length,
      kinds: availableKinds(entries).filter((k) => k !== 'match'),
      randomize: true,
      distractorPool: allEntries(),
    })
    if (qs.length) setRun({ kind: 'quiz', qs, n: 0 })
  }

  const pill = (active: boolean) =>
    cx(
      'rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer select-none',
      active
        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
        : 'border border-line bg-card text-muted hover:border-slate-300 dark:hover:border-slate-700 hover:text-ink',
    )

  return (
    <div className="space-y-6">
      <div className="print:hidden space-y-5">
        <PageHeader
          title="Sổ tay câu làm sai"
          subtitle="Tự động thu thập những câu bạn từng trả lời sai, câu sai nhiều lần nhất xếp trên cùng"
          actions={
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-xl border border-line bg-card px-3 py-2 text-xs font-semibold text-ink outline-none cursor-pointer"
              aria-label="Lọc theo môn"
            >
              <option value="">Tất cả môn học</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          }
        />

        {/* Filter Pills & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {MINS.map((n) => (
              <button key={n} onClick={() => setMin(n)} className={pill(min === n)}>
                Sai từ {n} lần
              </button>
            ))}
            <button onClick={() => setOnlyOpen((v) => !v)} className={pill(onlyOpen)} title="Chỉ giữ câu mà lần gần nhất vẫn làm sai">
              Lần gần nhất còn sai
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button disabled={!rows.length} onClick={() => window.print()} title="In hoặc lưu thành PDF tài liệu ôn thi" className="py-2 px-3 text-xs">
              <Printer size={14} /> In / PDF
            </Button>
            <Button disabled={!rows.length} onClick={() => setRun({ kind: 'cards', entries })} className="py-2 px-3 text-xs">
              <Layers size={14} /> Ôn bằng thẻ ({rows.length})
            </Button>
            <Button variant="primary" disabled={!rows.length} onClick={startQuiz} className="py-2 px-4 text-xs font-bold">
              <ListChecks size={14} /> Làm lại {rows.length} câu này
            </Button>
          </div>
        </div>

        {!rows.length ? (
          <Empty icon={<NotebookPen size={36} />}>
            <div className="font-bold text-ink text-base mb-1">Chưa có câu sai nào trong sổ</div>
            <p className="text-xs text-muted leading-relaxed">
              Các câu bạn trả lời sai ở Thẻ ghi nhớ, Trắc nghiệm hay Thi thử sẽ tự động được ghi nhận về đây để bạn ôn tập lại.
            </p>
          </Empty>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-muted font-medium">
              Tìm thấy <b className="text-ink">{rows.length}</b> câu hỏi cần lưu ý:
            </div>
            <Card className="divide-y divide-line/70 overflow-hidden shadow-xs">
              {rows.slice(0, LIMIT).map(({ e, p }) => (
                <ItemSummary
                  key={progressKey(e.collection.id, e.item.id)}
                  entry={e}
                  meta={
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                        sai {p!.incorrect}
                      </span>
                      <span className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        đúng {p!.correct}
                      </span>
                    </div>
                  }
                />
              ))}
            </Card>
            {rows.length > LIMIT && (
              <p className="text-center text-xs text-muted">
                Đang hiển thị {LIMIT} / {rows.length} câu đầu tiên. Nút “Làm lại” hoặc “Ôn bằng thẻ” vẫn gồm đầy đủ {rows.length} câu.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Sheet in ấn ra PDF / Giấy A4 */}
      <div className="hidden text-[12px] leading-snug text-black print:block font-sans">
        <div className="border-b-2 border-black pb-3 mb-4">
          <h1 className="text-xl font-bold uppercase tracking-tight">Sổ tay tổng hợp câu hỏi làm sai{subject ? ` · Môn ${subject}` : ''}</h1>
          <p className="mt-1 text-[11px] text-gray-700">
            Tổng số: {rows.length} câu hỏi · Lọc: sai từ {min} lần{onlyOpen ? ' · Lần gần nhất còn sai' : ''} · Ngày in: {new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>
        <ol className="space-y-3">
          {rows.map(({ e, p }, n) => {
            const note = notes.get(progressKey(e.collection.id, e.item.id))?.text
            const it = e.item
            return (
              <li key={progressKey(e.collection.id, it.id)} className="break-inside-avoid border-b border-gray-300 pb-3">
                <div className="font-bold text-[13px]">
                  Câu {n + 1}. {itemTitle(it)}
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5">
                  Bộ học: {e.collection.title} {it.source?.ref ? `· Nguồn: ${it.source.ref}` : ''} (Sai: {p!.incorrect} lần, Đúng: {p!.correct} lần)
                </div>

                {it.type === 'multiple-choice' && (
                  <ul className="mt-1.5 space-y-0.5 pl-2">
                    {it.content.options.map((o) => {
                      const right = it.content.answer.includes(o.key)
                      return (
                        <li key={o.key} className={right ? 'font-bold text-black' : 'text-gray-800'}>
                          <span className="inline-block w-6">{right ? '● ' : '○ '}</span>
                          <b>{o.key}.</b> {o.text}
                        </li>
                      )
                    })}
                  </ul>
                )}

                {it.type === 'true-false' && (
                  <div className="mt-1 font-bold text-black">Đáp án: {it.content.answer ? 'Đúng' : 'Sai'}</div>
                )}
                {it.type === 'vocabulary' && (
                  <div className="mt-1 font-bold text-black">Nghĩa: {it.content.meaning}</div>
                )}
                {(it.type === 'theory' || it.type === 'programming') && (
                  <div className="mt-1 font-bold text-black">Định nghĩa: {it.content.definition}</div>
                )}
                {'explanation' in it.content && it.content.explanation && (
                  <div className="mt-1 text-[11px] text-gray-800 italic bg-gray-50 p-1.5 rounded border border-gray-200">
                    Giải thích: {it.content.explanation}
                  </div>
                )}
                {note && (
                  <div className="mt-1 text-[11px] text-indigo-900 bg-indigo-50 p-1.5 rounded">
                    Ghi chú cá nhân: {note}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
