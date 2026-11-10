import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Clock, Flag, LayoutGrid, RotateCcw, X } from 'lucide-react'
import { useProgress } from '../../features/learning/ProgressContext'
import { isCorrect, itemResults, KIND_LABEL, type Answer, type Question } from '../../services/quiz/generate'
import { Button, Card, ProgressBar } from '../ui'
import { cx, pct } from '../../utils'
import { isMulti, toggleKey } from '../../utils/answers'
import type { QuizStartOptions } from './QuizSetup'

const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export type QuizMode = 'practice' | 'exam'

function correctText(q: Question): string {
  switch (q.kind) {
    case 'mc':
      return `${[...q.answer].join(', ')}. ${q.answerText}`
    case 'tf':
      return q.answer ? 'Đúng' : 'Sai'
    case 'match':
      return q.pairs.map((p) => `${p.left} → ${p.right}`).join('\n')
    default:
      return q.answer
  }
}

function answerText(q: Question, a: Answer): string {
  if (a === undefined || a === '') return '(chưa trả lời)'
  if (q.kind === 'mc') {
    const picked = [...String(a)].map((k) => q.options.find((x) => x.key === k)).filter(Boolean)
    return picked.length ? `${picked.map((o) => o!.key).join(', ')}. ${picked.map((o) => o!.text).join(' · ')}` : String(a)
  }
  if (q.kind === 'tf') return a ? 'Đúng' : 'Sai'
  if (q.kind === 'match')
    return q.pairs.map((p, i) => `${p.left} → ${(a as Record<number, string>)[i] ?? '—'}`).join('\n')
  return String(a)
}

function Input({
  q,
  value,
  onChange,
  locked,
  onEnter,
}: {
  q: Question
  value: Answer
  onChange: (a: Answer) => void
  locked: boolean
  onEnter?: () => void
}) {
  if (q.kind === 'mc') {
    const multi = isMulti(q.answer)
    const picked = String(value ?? '')
    return (
      <>
      {multi && (
        <p className="mb-2 text-sm font-medium text-indigo-700">Chọn {q.answer.length} đáp án đúng (có thể chọn nhiều)</p>
      )}
      <ul className="space-y-2">
        {q.options.map((o, idx) => {
          const sel = picked.includes(o.key)
          const showRes = locked
          return (
            <li key={o.key}>
              <button
                disabled={locked}
                onClick={() => onChange(multi ? toggleKey(picked, o.key) : o.key)}
                className={cx(
                  'group flex w-full items-center rounded-lg border px-4 py-3 text-left text-[15px] transition-colors',
                  !showRes && (sel ? 'border-ink bg-bg' : 'border-line hover:bg-bg'),
                  showRes && q.answer.includes(o.key) && 'border-ok bg-ok/10',
                  showRes && sel && !q.answer.includes(o.key) && 'border-err bg-err/10',
                  showRes && !sel && !q.answer.includes(o.key) && 'border-line text-muted',
                )}
              >
                <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded border border-line text-xs font-semibold text-muted transition-colors group-hover:border-ink">
                  {idx + 1}
                </span>
                <span className="mr-2 font-medium text-muted">{o.key}.</span>
                <span className="flex-1">{o.text}</span>
              </button>
            </li>
          )
        })}
      </ul>
      </>
    )
  }
  if (q.kind === 'tf')
    return (
      <div className="flex gap-3">
        {[true, false].map((v, idx) => (
          <button
            key={String(v)}
            disabled={locked}
            onClick={() => onChange(v)}
            className={cx(
              'group flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-[15px] font-medium transition-colors',
              !locked && (value === v ? 'border-ink bg-bg' : 'border-line hover:bg-bg'),
              locked && v === q.answer && 'border-ok bg-ok/10',
              locked && value === v && v !== q.answer && 'border-err bg-err/10',
              locked && value !== v && v !== q.answer && 'border-line text-muted',
            )}
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-line text-xs text-muted">
              {idx + 1}
            </span>
            {v ? 'Đúng' : 'Sai'}
          </button>
        ))}
      </div>
    )
  if (q.kind === 'match') {
    const m = (value ?? {}) as Record<number, string>
    return (
      <div className="space-y-3">
        {q.pairs.map((p, i) => (
          <div key={i} className="grid grid-cols-[1fr_2fr] items-center gap-3">
            <div className="text-[15px] font-medium">{p.left}</div>
            <select
              disabled={locked}
              value={m[i] ?? ''}
              onChange={(e) => onChange({ ...m, [i]: e.target.value })}
              className={cx(
                'rounded-lg border bg-card px-3 py-2 text-sm',
                locked ? (m[i] === p.right ? 'border-ok' : 'border-err') : 'border-line',
              )}
            >
              <option value="">— chọn —</option>
              {q.rights.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    )
  }
  return (
    <input
      autoFocus
      disabled={locked}
      value={(value as string) ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onEnter?.()
        }
      }}
      placeholder="Nhập đáp án (nhấn Enter để kiểm tra)…"
      className="w-full rounded-lg border border-line bg-card px-4 py-3 text-[15px] outline-none focus:border-ink"
    />
  )
}

function promptTitle(q: Question) {
  if (q.kind === 'fill') return 'Điền từ còn thiếu'
  if (q.kind === 'short') return 'Từ / khái niệm nào ứng với mô tả sau?'
  return null
}

export default function QuizRunner({
  questions,
  mode,
  exam,
  onExit,
  onRetry,
}: {
  questions: Question[]
  mode: QuizMode
  /** set for a fresh exam: enables the countdown and saves the attempt to history */
  exam?: QuizStartOptions
  onExit: () => void
  onRetry: (qs: Question[]) => void
}) {
  const { record, addExam } = useProgress()
  const startRef = useRef(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const savedRef = useRef(false)
  const finishRef = useRef<() => void>(() => {})
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [override, setOverride] = useState<Record<string, boolean>>({})
  const [committed, setCommitted] = useState<Record<string, boolean>>({})
  const [flagged, setFlagged] = useState<Record<string, boolean>>({})
  const [showGrid, setShowGrid] = useState(false)
  const [resultFilter, setResultFilter] = useState<'all' | 'wrong' | 'correct'>('all')
  const [finished, setFinished] = useState(false)

  const q = questions[i]
  const result = (x: Question) => override[x.id] ?? isCorrect(x, answers[x.id])
  const set = (a: Answer) => setAnswers((s) => ({ ...s, [q.id]: a }))

  const toggleFlag = (qid: string) => {
    setFlagged((f) => ({ ...f, [qid]: !f[qid] }))
  }

  const commit = (list: Question[], done: Record<string, boolean>) => {
    const fresh = list.filter((x) => !done[x.id])
    if (!fresh.length) return
    record(fresh.flatMap((x) => itemResults(x, answers[x.id], override[x.id])), 'quiz')
    setCommitted((c) => ({ ...c, ...Object.fromEntries(fresh.map((x) => [x.id, true])) }))
  }

  const finish = () => {
    if (finished) return
    commit(mode === 'exam' ? questions : questions.filter((x) => checked[x.id]), committed)
    const durationSec = Math.round((Date.now() - startRef.current) / 1000)
    setElapsed(durationSec)
    if (exam && mode === 'exam' && !savedRef.current) {
      savedRef.current = true
      const correct = questions.filter((x) => result(x)).length
      addExam({
        ts: new Date().toISOString(),
        collectionId: exam.collectionId,
        title: exam.title,
        total: questions.length,
        correct,
        score10: Math.round((correct / questions.length) * 100) / 10,
        durationSec,
        limitSec: exam.limitSec,
      })
    }
    setFinished(true)
  }
  finishRef.current = finish

  // countdown (exam only): tick every second, auto-submit at 0
  const limit = exam?.limitSec
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!limit || finished) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [limit, finished])
  const remaining = limit ? Math.max(0, limit - Math.floor((now - startRef.current) / 1000)) : null
  useEffect(() => {
    if (remaining === 0 && !finished) finishRef.current()
  }, [remaining, finished])

  const next = useCallback(() => {
    if (mode === 'practice') commit([q], committed)
    if (i < questions.length - 1) setI(i + 1)
    else finish()
  }, [mode, q, committed, i, questions.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const locked = mode === 'practice' && !!checked[q?.id]
  const answered = answers[q?.id] !== undefined && answers[q?.id] !== ''
  const canCheck =
    q?.kind === 'match'
      ? Object.values((answers[q.id] as Record<string, string>) ?? {}).filter(Boolean).length === q.pairs.length
      : answered
  const ok = locked ? result(q) : false
  const autoCheck = mode === 'practice' && ((q?.kind === 'mc' && !isMulti(q.answer)) || q?.kind === 'tf')
  const answeredCount = questions.filter((x) => answers[x.id] !== undefined && answers[x.id] !== '').length

  const handleEnter = useCallback(() => {
    if (mode === 'practice') {
      if (!locked) {
        if (canCheck) setChecked((c) => ({ ...c, [q.id]: true }))
      } else {
        next()
      }
    } else {
      if (i < questions.length - 1) setI(i + 1)
    }
  }, [mode, locked, canCheck, q?.id, next, i, questions.length])

  // Phím tắt bàn phím tiện lợi
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const inInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA'

      // Enter khi đã locked ở practice mode
      if (e.key === 'Enter' && !inInput) {
        e.preventDefault()
        handleEnter()
        return
      }

      if (inInput) return

      // Điều hướng mũi tên
      if (e.key === 'ArrowRight') {
        if (mode === 'exam' || locked) {
          if (i < questions.length - 1) setI((prev) => prev + 1)
        }
      } else if (e.key === 'ArrowLeft') {
        if (i > 0) setI((prev) => prev - 1)
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFlag(q.id)
      } else if (!locked && q.kind === 'mc') {
        // Phím 1..4 hoặc A..D
        let optIndex = -1
        if (['1', '2', '3', '4'].includes(e.key)) optIndex = Number(e.key) - 1
        else if (['a', 'b', 'c', 'd'].includes(e.key.toLowerCase()))
          optIndex = e.key.toLowerCase().charCodeAt(0) - 97

        if (optIndex >= 0 && optIndex < q.options.length) {
          const key = q.options[optIndex].key
          if (isMulti(q.answer)) set(toggleKey(String(answers[q.id] ?? ''), key))
          else {
            set(key)
            if (autoCheck) setChecked((c) => ({ ...c, [q.id]: true }))
          }
        }
      } else if (!locked && q.kind === 'tf') {
        // 1/T/D = Đúng, 2/F/S = Sai
        const k = e.key.toLowerCase()
        if (k === '1' || k === 't' || k === 'd') {
          set(true)
          if (autoCheck) setChecked((c) => ({ ...c, [q.id]: true }))
        } else if (k === '2' || k === 'f' || k === 's') {
          set(false)
          if (autoCheck) setChecked((c) => ({ ...c, [q.id]: true }))
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [q, locked, autoCheck, handleEnter, i, mode, questions.length, answers])

  const score = useMemo(() => (finished ? questions.filter((x) => result(x)).length : 0), [finished]) // eslint-disable-line react-hooks/exhaustive-deps

  if (finished) {
    const wrong = questions.filter((x) => !result(x))
    const listFiltered =
      resultFilter === 'wrong' ? wrong : resultFilter === 'correct' ? questions.filter((x) => result(x)) : questions

    return (
      <div>
        <Card className="mb-6 p-6 text-center">
          <div className="text-sm text-muted">Kết quả bài làm</div>
          {exam && mode === 'exam' ? (
            <>
              <div className={cx('mt-1 text-6xl font-semibold', score / questions.length >= 0.5 ? 'text-ok' : 'text-err')}>
                {(Math.round((score / questions.length) * 100) / 10).toString()}
                <span className="text-2xl text-muted"> / 10</span>
              </div>
              <div className="mt-1 text-sm text-muted">
                Đúng {score}/{questions.length} câu · {pct(score, questions.length)}% · thời gian {fmtTime(elapsed)}
                {limit ? ` / ${fmtTime(limit)}` : ''}
              </div>
            </>
          ) : (
            <>
              <div className="mt-1 text-5xl font-semibold">
                {score}
                <span className="text-2xl text-muted"> / {questions.length}</span>
              </div>
              <div className={cx('mt-1 text-lg font-medium', pct(score, questions.length) >= 50 ? 'text-ok' : 'text-err')}>
                {pct(score, questions.length)}%
              </div>
            </>
          )}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {wrong.length > 0 && (
              <Button variant="primary" onClick={() => onRetry(wrong)}>
                <RotateCcw size={15} /> Làm lại câu sai ({wrong.length})
              </Button>
            )}
            <Button onClick={onExit}>Bài mới</Button>
          </div>
        </Card>

        {/* Tab lọc kết quả */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            <button
              onClick={() => setResultFilter('all')}
              className={cx(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                resultFilter === 'all' ? 'bg-ink text-white' : 'border border-line bg-card text-muted hover:text-ink',
              )}
            >
              Tất cả ({questions.length})
            </button>
            {wrong.length > 0 && (
              <button
                onClick={() => setResultFilter('wrong')}
                className={cx(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  resultFilter === 'wrong'
                    ? 'bg-err text-white'
                    : 'border border-line bg-card text-err hover:bg-err/10',
                )}
              >
                Câu sai ({wrong.length})
              </button>
            )}
            <button
              onClick={() => setResultFilter('correct')}
              className={cx(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                resultFilter === 'correct'
                  ? 'bg-ok text-white'
                  : 'border border-line bg-card text-ok hover:bg-ok/10',
              )}
            >
              Câu đúng ({score})
            </button>
          </div>
          <span className="text-xs text-muted">Hiển thị {listFiltered.length} câu</span>
        </div>

        <div className="space-y-3">
          {listFiltered.map((x) => {
            const originalIndex = questions.findIndex((orig) => orig.id === x.id)
            const ok = result(x)
            return (
              <Card key={x.id} className="p-4">
                <div className="flex gap-3">
                  <div className={cx('mt-0.5 shrink-0', ok ? 'text-ok' : 'text-err')}>
                    {ok ? <Check size={18} /> : <X size={18} />}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="font-medium">
                      Câu {originalIndex + 1}. {x.prompt}
                    </div>
                    <div className="mt-2 whitespace-pre-line text-muted">Bạn chọn: {answerText(x, answers[x.id])}</div>
                    {!ok && <div className="mt-1 whitespace-pre-line text-ok">Đáp án đúng: {correctText(x)}</div>}
                    {x.explanation && <div className="mt-1">{x.explanation}</div>}
                    {x.enrichment && <div className="mt-1 text-muted">Bổ sung: {x.enrichment}</div>}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Top status bar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="text-sm font-medium text-muted">
          {i + 1} / {questions.length}
        </div>
        <ProgressBar value={((i + 1) / questions.length) * 100} className="flex-1" />
        <Button
          variant={showGrid ? 'primary' : 'outline'}
          className="h-8 px-2.5 text-xs"
          onClick={() => setShowGrid((s) => !s)}
          title="Xem danh sách câu hỏi"
        >
          <LayoutGrid size={14} /> Danh sách ({answeredCount}/{questions.length})
        </Button>
        {remaining !== null && (
          <div
            className={cx(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-sm font-semibold',
              remaining <= 60 ? 'border-err bg-err/10 text-err' : 'border-line bg-card text-ink',
            )}
            title="Thời gian còn lại"
          >
            <Clock size={14} /> {fmtTime(remaining)}
          </div>
        )}
        <div className="text-xs uppercase tracking-wide text-muted">{mode === 'practice' ? 'luyện tập' : 'thi thử'}</div>
        <Button variant="ghost" onClick={onExit} className="h-8 px-2.5 text-xs">
          Thoát
        </Button>
      </div>

      {/* Question Grid Palette */}
      {showGrid && (
        <Card className="mb-4 p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span>Bấm vào số câu để chuyển nhanh</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-ink" /> Đã trả lời
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-line" /> Chưa làm
              </span>
              <span className="flex items-center gap-1">
                <Flag size={11} className="fill-err text-err" /> Đã cắm cờ
              </span>
            </div>
          </div>
          <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto pt-1">
            {questions.map((item, idx) => {
              const isCurrent = idx === i
              const isAns = answers[item.id] !== undefined && answers[item.id] !== ''
              const isFlag = !!flagged[item.id]
              const isCheck = mode === 'practice' && !!checked[item.id]
              const isOk = isCheck && result(item)

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setI(idx)
                  }}
                  className={cx(
                    'relative flex h-8 w-8 items-center justify-center rounded text-xs font-medium transition-all',
                    isCurrent && 'ring-2 ring-ink ring-offset-1',
                    isCheck
                      ? isOk
                        ? 'border border-ok bg-ok/20 text-ok'
                        : 'border border-err bg-err/20 text-err'
                      : isAns
                        ? 'bg-ink text-white'
                        : 'border border-line bg-card text-muted hover:border-ink hover:text-ink',
                  )}
                >
                  {idx + 1}
                  {isFlag && (
                    <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-err" />
                  )}
                </button>
              )
            })}
          </div>
        </Card>
      )}

      {/* Main Question Card */}
      <Card className="p-7">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">{KIND_LABEL[q.kind]}</span>
          <button
            onClick={() => toggleFlag(q.id)}
            className={cx(
              'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors',
              flagged[q.id]
                ? 'bg-err/10 font-medium text-err'
                : 'text-muted hover:bg-bg hover:text-ink',
            )}
            title="Cắm cờ câu hỏi để xem lại sau (phím F)"
          >
            <Flag size={13} className={cx(flagged[q.id] && 'fill-err')} />
            {flagged[q.id] ? 'Đã cắm cờ' : 'Cắm cờ (F)'}
          </button>
        </div>

        {promptTitle(q) && <div className="mb-1 text-sm text-muted">{promptTitle(q)}</div>}
        <p className="mb-5 text-lg font-medium leading-relaxed">{q.prompt}</p>

        <Input
          key={q.id}
          q={q}
          value={answers[q.id]}
          locked={locked}
          onChange={(a) => {
            set(a)
            if (autoCheck) setChecked((c) => ({ ...c, [q.id]: true }))
          }}
          onEnter={handleEnter}
        />

        {locked && (
          <div className={cx('mt-5 rounded-lg p-4 text-sm', ok ? 'bg-ok/10' : 'bg-err/10')}>
            <div className={cx('font-medium', ok ? 'text-ok' : 'text-err')}>{ok ? 'Chính xác' : 'Chưa đúng'}</div>
            {!ok && <div className="mt-1 whitespace-pre-line">Đáp án đúng: {correctText(q)}</div>}
            {(q.explanation || !q.enrichment) && (
              <div className={cx('mt-2', !q.explanation && 'text-muted')}>
                {q.explanation ?? 'Tài liệu gốc chưa có giải thích cho câu này.'}
              </div>
            )}
            {q.enrichment && <div className="mt-2 text-muted">Bổ sung: {q.enrichment}</div>}
            {!ok && (q.kind === 'short' || q.kind === 'fill') && (
              <button className="mt-2 text-xs underline" onClick={() => setOverride((o) => ({ ...o, [q.id]: true }))}>
                Tôi trả lời đúng (cách diễn đạt khác)
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Navigation Toolbar */}
      <div className="mt-5 flex items-center justify-between">
        <Button onClick={() => setI(i - 1)} disabled={i === 0}>
          <ChevronLeft size={16} /> Trước
        </Button>

        {mode === 'practice' ? (
          locked ? (
            <Button variant="primary" onClick={next}>
              {i < questions.length - 1 ? 'Tiếp' : 'Kết thúc'} <ChevronRight size={16} />
            </Button>
          ) : (
            <Button variant="primary" disabled={!canCheck} onClick={() => setChecked((c) => ({ ...c, [q.id]: true }))}>
              Kiểm tra (Enter)
            </Button>
          )
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">
              Đã trả lời {answeredCount}/{questions.length}
            </span>
            {i < questions.length - 1 && (
              <Button onClick={() => setI(i + 1)}>
                Tiếp <ChevronRight size={16} />
              </Button>
            )}
            <Button variant="primary" onClick={finish}>
              Nộp bài
            </Button>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        {q.kind === 'mc' && 'Nhấn 1, 2, 3, 4 hoặc A, B, C, D để chọn nhanh · '}
        {q.kind === 'tf' && 'Nhấn 1/D (Đúng), 2/S (Sai) · '}
        Phím F để cắm cờ · ← → để chuyển câu
      </p>
    </div>
  )
}
