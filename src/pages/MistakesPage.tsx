import { useMemo, useState } from 'react'
import { ArrowLeft, Layers, ListChecks, Printer } from 'lucide-react'
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
        <button onClick={() => setRun(null)} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft size={14} /> Sổ câu sai
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
    cx('rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors', active ? 'bg-slate-900 text-white' : 'border border-line bg-card text-muted hover:text-ink')

  return (
    <div>
      <div className="print:hidden">
      <PageHeader
        title="Sổ câu sai"
        subtitle="Những câu bạn từng trả lời sai, câu sai nhiều nhất ở trên cùng"
        actions={
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-lg border border-line bg-card px-3 py-2 text-sm" aria-label="Lọc theo môn">
            <option value="">Tất cả môn</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {MINS.map((n) => (
          <button key={n} onClick={() => setMin(n)} className={pill(min === n)}>
            Sai từ {n} lần
          </button>
        ))}
        <button onClick={() => setOnlyOpen((v) => !v)} className={pill(onlyOpen)} title="Chỉ giữ những câu mà lần trả lời gần nhất vẫn sai">
          Lần gần nhất còn sai
        </button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button disabled={!rows.length} onClick={() => window.print()} title="In hoặc lưu thành PDF toàn bộ câu đang lọc">
            <Printer size={15} /> In / PDF
          </Button>
          <Button disabled={!rows.length} onClick={() => setRun({ kind: 'cards', entries })}>
            <Layers size={15} /> Ôn bằng thẻ
          </Button>
          <Button variant="primary" disabled={!rows.length} onClick={startQuiz}>
            <ListChecks size={15} /> Làm lại {rows.length} câu này
          </Button>
        </div>
      </div>

      {!rows.length ? (
        <Empty>Chưa có câu sai nào khớp bộ lọc. Câu bạn trả lời sai ở Thẻ ghi nhớ, Trắc nghiệm hay Thi thử sẽ được gom về đây.</Empty>
      ) : (
        <>
          <Card className="divide-y divide-line/70 overflow-hidden">
            {rows.slice(0, LIMIT).map(({ e, p }) => (
              <ItemSummary
                key={progressKey(e.collection.id, e.item.id)}
                entry={e}
                meta={
                  <>
                    <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600">sai {p!.incorrect}</span>
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">đúng {p!.correct}</span>
                  </>
                }
              />
            ))}
          </Card>
          {rows.length > LIMIT && <p className="mt-2 text-xs text-muted">Đang hiện {LIMIT} / {rows.length} câu. Nút “Làm lại” vẫn gồm đủ {rows.length} câu.</p>}
        </>
      )}
      </div>

      {/* Print sheet: every filtered question with its correct answer and personal note. Hidden on screen. */}
      <div className="hidden text-[12px] leading-snug text-black print:block">
        <h1 className="text-lg font-bold">Sổ câu sai{subject ? ` · ${subject}` : ''}</h1>
        <p className="mb-3 text-[11px]">
          {rows.length} câu · sai từ {min} lần{onlyOpen ? ' · lần gần nhất còn sai' : ''} · in ngày {new Date().toLocaleDateString('vi-VN')}
        </p>
        <ol className="space-y-2.5">
          {rows.map(({ e, p }, n) => {
            const note = notes.get(progressKey(e.collection.id, e.item.id))?.text
            const it = e.item
            return (
              <li key={progressKey(e.collection.id, it.id)} className="break-inside-avoid border-b border-gray-300 pb-2">
                <div className="font-semibold">
                  {n + 1}. {itemTitle(it)}
                </div>
                <div className="text-[10px] text-gray-600">
                  {e.collection.title}
                  {it.source?.ref ? ` · ${it.source.ref}` : ''} · sai {p!.incorrect}, đúng {p!.correct}
                </div>
                {it.type === 'multiple-choice' && (
                  <ul className="mt-1">
                    {it.content.options.map((o) => {
                      const right = it.content.answer.includes(o.key)
                      return (
                        <li key={o.key} className={right ? 'font-bold' : 'pl-[1.1em]'}>
                          {right ? '✓ ' : ''}
                          {o.key}. {o.text}
                        </li>
                      )
                    })}
                  </ul>
                )}
                {it.type === 'true-false' && <div className="mt-1 font-bold">✓ {it.content.answer ? 'Đúng' : 'Sai'}</div>}
                {it.type === 'vocabulary' && <div className="mt-1 font-bold">✓ {it.content.meaning}</div>}
                {(it.type === 'theory' || it.type === 'programming') && <div className="mt-1 font-bold">✓ {it.content.definition}</div>}
                {'explanation' in it.content && it.content.explanation && <div className="mt-1">Giải thích: {it.content.explanation}</div>}
                {note && <div className="mt-1 whitespace-pre-line italic">Ghi chú: {note}</div>}
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
