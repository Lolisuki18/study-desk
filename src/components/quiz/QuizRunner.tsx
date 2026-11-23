import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, Flag, LayoutGrid, Maximize2, Minimize2, Star, AlertTriangle, PenLine } from 'lucide-react'
import { useProgress } from '../../features/learning/ProgressContext'
import { isCorrect, itemResults, KIND_LABEL, type Answer, type Question } from '../../services/quiz/generate'
import { Button, Card, Modal, ProgressBar } from '../ui'
import Scratchpad from '../ui/Scratchpad'
import HighlightableText from '../ui/HighlightableText'
import { cx } from '../../utils'
import { isMulti, toggleKey } from '../../utils/answers'
import type { QuizStartOptions } from './QuizSetup'
import QuizResults from './QuizResults'
import { QuizInput, correctText, fmtTime, promptTitle } from './quizParts'
import NoteBox from '../ui/NoteBox'
import AnswerNote from '../ui/AnswerNote'
import { fireConfetti } from '../../utils/confetti'
import { playSound } from '../../utils/sound'
import { playMechSound, playLevelUp, playPerfectScore } from '../../utils/mechSound'
import { haptic } from '../../utils/haptic'
import { exitZen, isZenMode, toggleZen, useZen } from '../../utils/zen'
import { useStarred } from '../../services/storage/starred'

/** fewest questions for which a 100% result gets the perfect-score fanfare */
const PERFECT_MIN_QUESTIONS = 5

export type QuizMode = 'practice' | 'exam'

export default function QuizRunner({
  questions,
  mode,
  exam,
  onExit,
  onRetry,
}: {
  questions: Question[]
  mode: QuizMode
  exam?: QuizStartOptions
  onExit: () => void
  onRetry: (qs: Question[]) => void
}) {
  const { record, addExam } = useProgress()
  const { isStarred, toggle: toggleStar } = useStarred()
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
  const [showScratchpad, setShowScratchpad] = useState(false)
  const zenMode = useZen()
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [finished, setFinished] = useState(false)
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({})
  const questionStartRef = useRef(Date.now())

  useEffect(() => {
    return () => {
      exitZen()
    }
  }, [])

  const q = questions[i]

  useEffect(() => {
    questionStartRef.current = Date.now()
    return () => {
      const elapsedSec = Math.round((Date.now() - questionStartRef.current) / 1000)
      if (elapsedSec > 0 && q) {
        setTimeSpent((prev) => ({ ...prev, [q.id]: (prev[q.id] ?? 0) + elapsedSec }))
      }
    }
  }, [i, q])
  const result = useCallback((x: Question) => override[x.id] ?? isCorrect(x, answers[x.id]), [override, answers])
  const set = (a: Answer) => {
    playSound('click')
    setAnswers((s) => ({ ...s, [q.id]: a }))
  }

  const toggleFlag = (qid: string) => {
    playSound('click')
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
    const correct = questions.filter((x) => result(x)).length
    const score10 = Math.round((correct / questions.length) * 100) / 10

    // a perfect score only counts on a quiz long enough for it to mean something (not 1/1 when retrying one question)
    if (correct === questions.length && questions.length >= PERFECT_MIN_QUESTIONS) {
      playPerfectScore()
      fireConfetti(3500)
    } else if (score10 >= 8) {
      playLevelUp()
      fireConfetti(2500)
    } else if (score10 >= 5) {
      playSound('correct')
    } else {
      playSound('wrong')
    }

    if (exam && mode === 'exam' && !savedRef.current) {
      savedRef.current = true
      addExam({
        ts: new Date().toISOString(),
        collectionId: exam.collectionId,
        title: exam.title,
        total: questions.length,
        correct,
        score10,
        durationSec,
        limitSec: exam.limitSec,
      })
    }
    setFinished(true)
    exitZen()
  }
  finishRef.current = finish

  // Countdown timer
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
  const flaggedCount = Object.values(flagged).filter(Boolean).length

  const handleEnter = useCallback(() => {
    if (mode === 'practice') {
      if (!locked) {
        if (canCheck) {
          setChecked((c) => ({ ...c, [q.id]: true }))
          playSound(result(q) ? 'correct' : 'wrong')
        }
      } else {
        next()
      }
    } else {
      if (i < questions.length - 1) setI(i + 1)
    }
  }, [mode, locked, canCheck, q, next, i, questions.length, result])

  // Practice mode: one haptic pulse the moment a question is checked, whichever way it was checked
  const buzzedRef = useRef('')
  useEffect(() => {
    if (mode !== 'practice' || !q || !checked[q.id] || buzzedRef.current === q.id) return
    buzzedRef.current = q.id
    haptic(result(q) ? 'success' : 'error')
  }, [checked, q, mode, result])

  // Phím tắt bàn phím tiện lợi
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const inInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA'

      if (e.key === 'Enter' && !inInput) {
        e.preventDefault()
        handleEnter()
        return
      }

      if (inInput) return

      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'z' || e.key === 'Z') {
        toggleZen()
        return
      }
      if (e.key === 'Escape' && isZenMode()) {
        exitZen()
        return
      }

      if (e.key === 'ArrowRight') {
        if (mode === 'exam' || locked) {
          if (i < questions.length - 1) setI((prev) => prev + 1)
        }
      } else if (e.key === 'ArrowLeft') {
        if (i > 0) setI((prev) => prev - 1)
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFlag(q.id)
      } else if (!locked && q.kind === 'mc') {
        let optIndex = -1
        if (['1', '2', '3', '4'].includes(e.key)) optIndex = Number(e.key) - 1
        else if (['a', 'b', 'c', 'd'].includes(e.key.toLowerCase()))
          optIndex = e.key.toLowerCase().charCodeAt(0) - 97

        if (optIndex >= 0 && optIndex < q.options.length) {
          const key = q.options[optIndex].key
          haptic('select')
          playMechSound('keydown')
          if (isMulti(q.answer)) set(toggleKey(String(answers[q.id] ?? ''), key))
          else {
            set(key)
            if (autoCheck) {
              setChecked((c) => ({ ...c, [q.id]: true }))
              playSound(q.answer.includes(key) ? 'correct' : 'wrong')
            }
          }
        }
      } else if (!locked && q.kind === 'tf') {
        const k = e.key.toLowerCase()
        if (k === '1' || k === 't' || k === 'd') {
          haptic('select')
          playMechSound('keydown')
          set(true)
          if (autoCheck) {
            setChecked((c) => ({ ...c, [q.id]: true }))
            playSound(q.answer === true ? 'correct' : 'wrong')
          }
        } else if (k === '2' || k === 'f' || k === 's') {
          haptic('select')
          playMechSound('keydown')
          set(false)
          if (autoCheck) {
            setChecked((c) => ({ ...c, [q.id]: true }))
            playSound(q.answer === false ? 'correct' : 'wrong')
          }
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, locked, autoCheck, handleEnter, i, mode, questions.length, answers])

  const score = useMemo(() => (finished ? questions.filter((x) => result(x)).length : 0), [finished]) // eslint-disable-line react-hooks/exhaustive-deps

  // Màn hình kết quả sau bài thi
  if (finished) {
    return (
      <QuizResults
        questions={questions}
        answers={answers}
        result={result}
        score={score}
        elapsed={elapsed}
        timeSpent={timeSpent}
        isExam={!!exam && mode === 'exam'}
        limit={limit}
        onRetry={onRetry}
        onExit={onExit}
      />
    )
  }

  const containerClass = zenMode
    ? 'fixed inset-0 z-50 overflow-y-auto bg-bg p-4 sm:p-8 flex flex-col justify-center'
    : 'mx-auto w-full max-w-3xl'

  return (
    <div className={containerClass}>
      <div className="mx-auto w-full max-w-3xl">
        {/* Top Status & Controls Bar */}
        <div className={cx('sticky z-20 mb-3 flex items-center gap-2 rounded-2xl border border-line bg-card p-2.5 shadow-xs sm:mb-4 sm:gap-3 sm:p-3 md:top-0', zenMode ? 'top-0' : 'top-[calc(3.5rem+env(safe-area-inset-top,0px))]')}>
          <div className="text-xs font-mono font-bold text-ink">
            {i + 1} / {questions.length}
          </div>
          <ProgressBar value={((i + 1) / questions.length) * 100} className="h-2 min-w-[40px] flex-1" />

          {/* Palette button */}
          <Button
            variant={showGrid ? 'primary' : 'outline'}
            className="h-10 px-3 text-xs sm:h-8 sm:px-2.5"
            onClick={() => setShowGrid((s) => !s)}
            title="Xem danh sách câu hỏi"
          >
            <LayoutGrid size={14} /> <span className="hidden sm:inline">Danh sách</span> ({answeredCount}/{questions.length})
          </Button>

          {/* Scratchpad button */}
          <button
            onClick={() => setShowScratchpad((s) => !s)}
            className={cx(
              'inline-flex h-10 px-2.5 items-center gap-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer sm:h-8',
              showScratchpad
                ? 'border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'border-line text-muted hover:text-ink',
            )}
            title="Bảng nháp nhanh"
          >
            <PenLine size={13} />
            <span className="hidden md:inline">Nháp</span>
          </button>

          {/* Countdown Clock */}
          {remaining !== null && (
            <div
              className={cx(
                'inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 font-mono text-xs font-bold',
                remaining <= 60 ? 'border-rose-400 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' : 'border-line bg-slate-50 dark:bg-slate-800 text-ink',
              )}
              title="Thời gian còn lại"
            >
              <Clock size={13} /> {fmtTime(remaining)}
            </div>
          )}

          {/* Focus / Zen mode toggle */}
          <button
            onClick={toggleZen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink transition-colors cursor-pointer sm:h-8 sm:w-8"
            title={zenMode ? 'Thoát toàn màn hình' : 'Chế độ tập trung (Zen Mode)'}
          >
            {zenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          <Button variant="ghost" onClick={onExit} className="h-10 px-2.5 text-xs sm:h-8 sm:px-2">
            Thoát
          </Button>
        </div>

        {/* Question Grid Drawer / Palette Modal */}
        {showGrid && (
          <div className="mb-4 rounded-3xl border border-line bg-card p-4 sm:p-5 shadow-lg animate-in slide-in-from-top-2 duration-150">
            <div className="mb-3 flex items-center justify-between text-xs text-muted">
              <span className="font-bold text-ink">Bấm vào câu hỏi để chuyển nhanh:</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-slate-900 dark:bg-slate-100" /> Đã làm
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full border border-line" /> Chưa làm
                </span>
                <span className="flex items-center gap-1">
                  <Flag size={11} className="fill-rose-500 text-rose-500" /> Cắm cờ
                </span>
              </div>
            </div>

            <div className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto pt-1">
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
                      'relative flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer',
                      isCurrent && 'ring-2 ring-indigo-600 dark:ring-indigo-400 ring-offset-2 dark:ring-offset-slate-900',
                      isCheck
                        ? isOk
                          ? 'border border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'border border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : isAns
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'border border-line bg-slate-50 dark:bg-slate-800 text-muted hover:border-slate-400 hover:text-ink',
                    )}
                  >
                    {idx + 1}
                    {isFlag && (
                      <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-rose-500" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Main Question Card */}
        <Card className="p-4 shadow-sm sm:p-8">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted">
              {KIND_LABEL[q.kind]}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  playSound('click')
                  toggleStar(q.collectionId, q.itemId)
                }}
                className={cx(
                  'inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-colors cursor-pointer sm:h-auto sm:min-w-0 sm:py-1',
                  isStarred(q.collectionId, q.itemId)
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900 font-bold'
                    : 'text-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink',
                )}
                title="Gắn sao câu hỏi trọng tâm (Ôn tủ)"
              >
                <Star size={16} className={cx(isStarred(q.collectionId, q.itemId) && 'fill-amber-500 text-amber-500')} />
                <span className="hidden sm:inline">{isStarred(q.collectionId, q.itemId) ? 'Đã gắn sao' : 'Gắn sao'}</span>
              </button>
              <button
                type="button"
                onClick={() => toggleFlag(q.id)}
                className={cx(
                  'inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-colors cursor-pointer sm:h-auto sm:min-w-0 sm:py-1',
                  flagged[q.id]
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                    : 'text-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink',
                )}
                title="Cắm cờ câu hỏi để xem lại sau (phím F)"
              >
                <Flag size={16} className={cx(flagged[q.id] && 'fill-rose-500')} />
                <span className="hidden sm:inline">{flagged[q.id] ? 'Đã cắm cờ' : 'Cắm cờ (F)'}</span>
              </button>
            </div>
          </div>

          {promptTitle(q) && <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">{promptTitle(q)}</div>}
          <HighlightableText
            text={q.prompt}
            itemKey={`${q.collectionId}::${q.itemId}`}
            field="q"
            className="mb-6 text-lg sm:text-xl font-bold leading-relaxed text-ink"
            as="p"
          />

          <QuizInput
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
            <div className={cx('mt-6 rounded-2xl p-4 sm:p-5 text-sm', ok ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-rose-50 dark:bg-rose-950/40')}>
              <div className={cx('font-bold text-base', ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300')}>
                {ok ? 'Chính xác!' : 'Chưa đúng'}
              </div>
              {!ok && <div className="mt-2 whitespace-pre-line text-slate-800 dark:text-slate-100 font-semibold">Đáp án đúng: {correctText(q)}</div>}
              {(q.explanation || !q.enrichment) && (
                <div className={cx('mt-2 text-xs sm:text-sm leading-relaxed', !q.explanation && 'italic text-muted')}>
                  {q.explanation ? (
                    <HighlightableText
                      text={q.explanation}
                      itemKey={`${q.collectionId}::${q.itemId}`}
                      field="e"
                      as="div"
                    />
                  ) : (
                    'Tài liệu gốc chưa có giải thích cho câu này.'
                  )}
                </div>
              )}
              {q.enrichment && <div className="mt-2 text-xs text-muted">Bổ sung: {q.enrichment}</div>}
              {!ok && (q.kind === 'short' || q.kind === 'fill') && (
                <button className="mt-2 text-xs underline cursor-pointer text-indigo-600" onClick={() => setOverride((o) => ({ ...o, [q.id]: true }))}>
                  Tôi trả lời đúng (cách diễn đạt khác)
                </button>
              )}
              {q.kind === 'mc' && <AnswerNote itemKey={`${q.collectionId}::${q.itemId}`} className="mt-3.5" />}
              {q.kind !== 'match' && <NoteBox collectionId={q.collectionId} itemId={q.itemId} className="mt-3.5" />}
            </div>
          )}
        </Card>

        {/* Navigation Toolbar */}
        <div
          className={cx(
            'sticky z-20 -mx-4 mt-4 flex items-center justify-between gap-2 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur-md md:static md:bottom-auto md:mx-0 md:mt-5 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none',
            zenMode ? 'bottom-0' : 'bottom-[var(--bottom-nav-h)]',
          )}
        >
          <Button onClick={() => setI(i - 1)} disabled={i === 0} className="py-2.5 px-4">
            <ChevronLeft size={16} /> Trước
          </Button>

          {mode === 'practice' ? (
            locked ? (
              <Button variant="primary" onClick={next} className="py-2.5 px-6">
                {i < questions.length - 1 ? 'Tiếp' : 'Kết thúc'} <ChevronRight size={16} />
              </Button>
            ) : (
              <Button variant="primary" disabled={!canCheck} onClick={() => setChecked((c) => ({ ...c, [q.id]: true }))} className="py-2.5 px-6">
                Kiểm tra<span className="hidden md:inline"> (Enter)</span>
              </Button>
            )
          ) : (
            <div className="flex items-center gap-3">
              <span className="hidden text-xs font-semibold text-muted sm:inline">
                Đã làm {answeredCount}/{questions.length}
              </span>
              {i < questions.length - 1 && (
                <Button onClick={() => setI(i + 1)} className="py-2.5 px-4">
                  Tiếp <ChevronRight size={16} />
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => {
                  if (answeredCount < questions.length || flaggedCount > 0) {
                    setShowConfirmSubmit(true)
                  } else {
                    finish()
                  }
                }}
                className="py-2.5 px-5"
              >
                Nộp bài
              </Button>
            </div>
          )}
        </div>

        <p className="mt-4 hidden text-center text-xs text-muted md:block">
          {q.kind === 'mc' && 'Nhấn 1, 2, 3, 4 hoặc A, B, C, D để chọn nhanh · '}
          {q.kind === 'tf' && 'Nhấn 1/D (Đúng), 2/S (Sai) · '}
          Phím F để cắm cờ · ← → để chuyển câu
        </p>

        {/* Pre-submission Review Checklist Modal */}
        <Modal open={showConfirmSubmit} onClose={() => setShowConfirmSubmit(false)} title="Kiểm tra trước khi nộp bài" className="max-w-md">
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-2xl border border-line bg-card p-3">
                <div className="text-muted font-medium">Tổng số câu</div>
                <div className="text-lg font-bold font-mono text-ink mt-0.5">{questions.length}</div>
              </div>
              <div className="rounded-2xl border border-line bg-emerald-50/60 dark:bg-emerald-950/30 p-3">
                <div className="text-emerald-700 dark:text-emerald-400 font-semibold">Đã làm</div>
                <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">{answeredCount}</div>
              </div>
              <div
                className={cx(
                  'rounded-2xl border p-3',
                  questions.length - answeredCount > 0
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 font-semibold'
                    : 'border-line bg-card text-muted'
                )}
              >
                <div>Chưa làm</div>
                <div className="text-lg font-bold font-mono mt-0.5">{questions.length - answeredCount}</div>
              </div>
            </div>

            {/* Unanswered Questions Jump List */}
            {questions.length - answeredCount > 0 && (
              <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 p-3.5 space-y-2">
                <div className="text-xs font-bold text-rose-700 dark:text-rose-400">
                  <AlertTriangle size={14} className="mr-1 inline" /> Câu chưa trả lời (bấm để xem ngay):
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {questions.map((item, idx) => {
                    const isAns = answers[item.id] !== undefined && answers[item.id] !== ''
                    if (isAns) return null
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setI(idx)
                          setShowConfirmSubmit(false)
                        }}
                        className="rounded-xl border border-rose-300 dark:border-rose-800 bg-card px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                      >
                        Câu {idx + 1}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Flagged Questions Jump List */}
            {flaggedCount > 0 && (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 p-3.5 space-y-2">
                <div className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <Flag size={12} className="fill-amber-500 text-amber-500" />
                  <span>Câu đang cắm cờ phân vân:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {questions.map((item, idx) => {
                    if (!flagged[item.id]) return null
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setI(idx)
                          setShowConfirmSubmit(false)
                        }}
                        className="rounded-xl border border-amber-300 dark:border-amber-800 bg-card px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-colors cursor-pointer"
                      >
                        Câu {idx + 1}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <Button onClick={() => setShowConfirmSubmit(false)} className="flex-1 py-2.5">
                Kiểm tra lại
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowConfirmSubmit(false)
                  finish()
                }}
                className="flex-1 py-2.5"
              >
                Nộp bài ngay
              </Button>
            </div>
          </div>
        </Modal>

        {/* Floating Scratchpad */}
        <Scratchpad open={showScratchpad} onClose={() => setShowScratchpad(false)} />
      </div>
    </div>
  )
}
