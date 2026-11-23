import { useState } from 'react'
import { Check, Clock, RotateCcw, Sparkles, Turtle, X, Zap } from 'lucide-react'
import type { Answer, Question } from '../../services/quiz/generate'
import { Button, Card } from '../ui'
import NoteBox from '../ui/NoteBox'
import { cx, pct } from '../../utils'
import { getCollection } from '../../data'
import { chapterLabel } from '../../services/quiz/exam'
import { answerText, correctText, fmtTime } from './quizParts'

interface Props {
  questions: Question[]
  answers: Record<string, Answer>
  result: (q: Question) => boolean
  score: number
  elapsed: number
  timeSpent: Record<string, number>
  /** a timed mock exam: the score is shown out of 10 */
  isExam: boolean
  limit?: number
  onRetry: (wrong: Question[]) => void
  onExit: () => void
}

/** The screen shown after a quiz or exam is finished. */
export default function QuizResults({ questions, answers, result, score, elapsed, timeSpent, isExam, limit, onRetry, onExit }: Props) {
  const [resultFilter, setResultFilter] = useState<'all' | 'wrong' | 'correct'>('all')
  const wrong = questions.filter((x) => !result(x))
  const score10 = Math.round((score / questions.length) * 100) / 10
  const cols = questions.map((x) => getCollection(x.collectionId))
  const multiSubject = new Set(cols.map((c) => c?.subject)).size > 1
  const chapters = new Map<string, { correct: number; total: number }>()

  questions.forEach((x, n) => {
    const c = cols[n]
    if (!c) return
    const label = multiSubject ? `${c.subject} · ${chapterLabel(c)}` : chapterLabel(c)
    const g = chapters.get(label) ?? { correct: 0, total: 0 }
    g.total++
    if (result(x)) g.correct++
    chapters.set(label, g)
  })

  const byChapter = [...chapters]
    .map(([label, g]) => ({ label, ...g }))
    .sort((a, b) => a.label.localeCompare(b.label, 'vi', { numeric: true }))

  const listFiltered =
    resultFilter === 'wrong' ? wrong : resultFilter === 'correct' ? questions.filter((x) => result(x)) : questions

  const avgSec = Math.max(1, Math.round(elapsed / Math.max(1, questions.length)))
  const slowQuestions = questions.filter((x) => (timeSpent[x.id] ?? 0) >= 45)
  const fastQuestions = questions.filter((x) => (timeSpent[x.id] ?? 0) > 0 && (timeSpent[x.id] ?? 0) <= 5)

  const rankBadge =
    score10 >= 9
      ? { label: 'Xuất sắc', cls: 'bg-emerald-50 text-emerald-700 border-emerald-300' }
      : score10 >= 8
      ? { label: 'Giỏi', cls: 'bg-emerald-50 text-emerald-700 border-emerald-300' }
      : score10 >= 6.5
      ? { label: 'Khá', cls: 'bg-indigo-50 text-indigo-700 border-indigo-300' }
      : score10 >= 5
      ? { label: 'Đạt yêu cầu', cls: 'bg-amber-50 text-amber-700 border-amber-300' }
      : { label: 'Cần ôn thêm', cls: 'bg-rose-50 text-rose-700 border-rose-300' }

  return (
    <div className="mx-auto max-w-3xl py-2">
      {/* Result Card */}
      <Card className="mb-6 p-7 sm:p-9 text-center overflow-hidden relative">
        <div className="mb-3 flex justify-center">
          <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider', rankBadge.cls)}>
            <Sparkles size={13} /> {rankBadge.label}
          </span>
        </div>

        <div className="text-sm font-semibold text-muted">Kết quả bài làm</div>

        {isExam ? (
          <>
            <div className={cx('mt-2 text-6xl sm:text-7xl font-black tracking-tight', score10 >= 5 ? 'text-ok' : 'text-err')}>
              {score10.toString()}
              <span className="text-2xl font-bold text-muted"> / 10</span>
            </div>
            <p className="mt-2 text-sm text-muted">
              Đúng <b className="text-ink">{score}</b> / {questions.length} câu ({pct(score, questions.length)}%) · Thời gian làm: <b className="text-ink">{fmtTime(elapsed)}</b>
              {limit ? ` / ${fmtTime(limit)}` : ''}
            </p>
          </>
        ) : (
          <>
            <div className="mt-2 text-5xl sm:text-6xl font-black">
              {score}
              <span className="text-2xl font-bold text-muted"> / {questions.length}</span>
            </div>
            <div className={cx('mt-1 text-lg font-bold', pct(score, questions.length) >= 50 ? 'text-ok' : 'text-err')}>
              {pct(score, questions.length)}%
            </div>
          </>
        )}

        {/* Pacing Analysis */}
        {elapsed > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-line/60 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-1 font-semibold text-ink shadow-2xs">
              <Clock size={13} className="text-indigo-500" />
              <span>Nhịp độ: <b>{avgSec}s</b> / câu</span>
            </span>
            {slowQuestions.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 font-semibold text-amber-700 dark:text-amber-300">
                <span className="inline-flex items-center gap-1"><Turtle size={14} /> {slowQuestions.length} câu mất &gt;45s</span>
              </span>
            )}
            {fastQuestions.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 font-semibold text-emerald-700 dark:text-emerald-300">
                <span className="inline-flex items-center gap-1"><Zap size={14} /> {fastQuestions.length} câu làm nhanh (&le;5s)</span>
              </span>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          {wrong.length > 0 && (
            <Button variant="primary" onClick={() => onRetry(wrong)} className="py-2.5 px-5">
              <RotateCcw size={15} /> Làm lại câu sai ({wrong.length})
            </Button>
          )}
          <Button onClick={onExit} className="py-2.5 px-5">
            Bài mới
          </Button>
        </div>
      </Card>

      {/* Chapter Breakdown */}
      {byChapter.length > 1 && (
        <Card className="mb-6 p-5">
          <div className="mb-3 text-sm font-bold text-ink">Kết quả theo từng chương</div>
          <div className="space-y-3">
            {byChapter.map((g) => (
              <div key={g.label} className="flex items-center gap-3 text-sm">
                <span className="w-2/5 min-w-0 truncate font-medium text-ink" title={g.label}>
                  {g.label}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-line/80">
                  <div
                    className={cx('h-full rounded-full transition-all duration-300', pct(g.correct, g.total) >= 50 ? 'bg-ok' : 'bg-err')}
                    style={{ width: `${pct(g.correct, g.total)}%` }}
                  />
                </div>
                <span className="w-28 shrink-0 text-right text-xs font-semibold text-muted">
                  {g.correct}/{g.total} · sai {g.total - g.correct}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filter Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <button
            onClick={() => setResultFilter('all')}
            className={cx(
              'rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
              resultFilter === 'all' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'border border-line bg-card text-muted hover:text-ink',
            )}
          >
            Tất cả ({questions.length})
          </button>
          {wrong.length > 0 && (
            <button
              onClick={() => setResultFilter('wrong')}
              className={cx(
                'rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                resultFilter === 'wrong'
                  ? 'bg-err text-white'
                  : 'border border-line bg-card text-err hover:bg-rose-50 dark:hover:bg-rose-950/40',
              )}
            >
              Câu sai ({wrong.length})
            </button>
          )}
          <button
            onClick={() => setResultFilter('correct')}
            className={cx(
              'rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
              resultFilter === 'correct'
                ? 'bg-ok text-white'
                : 'border border-line bg-card text-ok hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
            )}
          >
            Câu đúng ({score})
          </button>
        </div>
        <span className="text-xs text-muted font-medium">Đang hiển thị {listFiltered.length} câu</span>
      </div>

      {/* Review list */}
      <div className="space-y-3">
        {listFiltered.map((x) => {
          const originalIndex = questions.findIndex((orig) => orig.id === x.id)
          const ok = result(x)
          return (
            <Card key={x.id} className="p-5">
              <div className="flex gap-3.5">
                <div
                  className={cx(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    ok ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300',
                  )}
                >
                  {ok ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-bold text-ink leading-relaxed">
                    Câu {originalIndex + 1}. {x.prompt}
                  </div>
                  <div className="mt-2 whitespace-pre-line text-muted">
                    Bạn chọn: <span className="font-semibold text-ink">{answerText(x, answers[x.id])}</span>
                  </div>
                  {!ok && (
                    <div className="mt-1.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 p-2.5 text-emerald-800 dark:text-emerald-200 font-semibold">
                      Đáp án đúng: {correctText(x)}
                    </div>
                  )}
                  {x.explanation && (
                    <div className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-line">
                      <b className="text-ink">Giải thích:</b> {x.explanation}
                    </div>
                  )}
                  {x.enrichment && (
                    <div className="mt-2 text-xs text-muted italic">
                      Bổ sung: {x.enrichment}
                    </div>
                  )}
                  {x.kind !== 'match' && <NoteBox collectionId={x.collectionId} itemId={x.itemId} className="mt-3" />}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
