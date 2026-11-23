import { useState, useEffect, useRef } from 'react'
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Check,
  X,
  Gauge,
  HelpCircle,
} from 'lucide-react'
import { Card } from '../ui'
import { cx } from '../../utils'
import { playSound } from '../../utils/sound'
import { playMechSound } from '../../utils/mechSound'
import { haptic } from '../../utils/haptic'
import {
  TFNG_DRILLS,
  SPEED_READING_ARTICLES,
  computeReadingWpm,
  evaluateWpmBand,
  type TFNGChoice,
  type ReadingDrillPassage,
  type SpeedReadingArticle,
} from '../../services/english/readingLab'

export function ReadingLab() {
  const [subMode, setSubMode] = useState<'tfng' | 'speed'>('tfng')

  // -----------------------------------------------------------------------------------------------
  // TFNG LAB STATE
  // -----------------------------------------------------------------------------------------------
  const [passageIndex, setPassageIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, TFNGChoice>>({})
  const [submitted, setSubmitted] = useState(false)

  const curPassage = TFNG_DRILLS[passageIndex]

  const handleSelectAnswer = (qId: string, choice: TFNGChoice) => {
    if (submitted) return
    playMechSound('keydown')
    setUserAnswers((prev) => ({ ...prev, [qId]: choice }))
  }

  const handleCheckTfng = () => {
    setSubmitted(true)
    let correctCount = 0
    curPassage.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correct) correctCount++
    })
    if (correctCount === curPassage.questions.length) {
      playSound('fanfare')
      haptic('success')
    } else {
      playSound('correct')
      haptic('select')
    }
  }

  const handleNextPassage = () => {
    setUserAnswers({})
    setSubmitted(false)
    if (passageIndex < TFNG_DRILLS.length - 1) {
      setPassageIndex((p) => p + 1)
    } else {
      setPassageIndex(0)
    }
  }

  // -----------------------------------------------------------------------------------------------
  // SPEED READING WPM STATE
  // -----------------------------------------------------------------------------------------------
  const [speedArticle] = useState<SpeedReadingArticle>(SPEED_READING_ARTICLES[0])
  const [speedState, setSpeedState] = useState<'idle' | 'reading' | 'finished'>('idle')
  const [speedElapsed, setSpeedElapsed] = useState(0)
  const [wpm, setWpm] = useState(0)
  const speedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizChecked, setQuizChecked] = useState(false)

  const startSpeedReading = () => {
    setSpeedState('reading')
    setSpeedElapsed(0)
    setWpm(0)
    setQuizAnswers({})
    setQuizChecked(false)

    if (speedIntervalRef.current) clearInterval(speedIntervalRef.current)
    speedIntervalRef.current = setInterval(() => {
      setSpeedElapsed((e) => e + 1)
    }, 1000)
  }

  const finishSpeedReading = () => {
    if (speedIntervalRef.current) clearInterval(speedIntervalRef.current)
    setSpeedState('finished')
    const calculatedWpm = computeReadingWpm(speedArticle.wordCount, speedElapsed)
    setWpm(calculatedWpm)
    playSound('fanfare')
    haptic('success')
  }

  useEffect(() => {
    return () => {
      if (speedIntervalRef.current) clearInterval(speedIntervalRef.current)
    }
  }, [])

  const wpmEval = evaluateWpmBand(wpm)

  return (
    <div className="space-y-6">
      {/* Sub Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-2xl border border-line">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubMode('tfng')}
            className={cx(
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
              subMode === 'tfng'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-muted hover:text-ink'
            )}
          >
            Chuyên đề True / False / Not Given (T/F/NG)
          </button>
          <button
            onClick={() => setSubMode('speed')}
            className={cx(
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
              subMode === 'speed'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-muted hover:text-ink'
            )}
          >
            Đo tốc độ đọc WPM (Speed Reading)
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-muted">
          <BookOpen size={15} className="text-indigo-600 dark:text-indigo-400" />
          <span>IELTS Reading Training Lab</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TFNG LAB */}
      {/* ------------------------------------------------------------- */}
      {subMode === 'tfng' && (
        <div className="space-y-6">
          {/* Passage Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {TFNG_DRILLS.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => {
                  setPassageIndex(idx)
                  setUserAnswers({})
                  setSubmitted(false)
                }}
                className={cx(
                  'rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer',
                  passageIndex === idx
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'border border-line bg-card text-muted hover:border-indigo-400'
                )}
              >
                Bài {idx + 1}: {p.academicField.split('&')[0]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Passage Text (Left) */}
            <Card className="lg:col-span-7 p-6 sm:p-7 space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {curPassage.academicField}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1 leading-snug">
                  {curPassage.title}
                </h3>
              </div>

              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 font-serif border-t border-line/60 pt-4">
                {curPassage.passage.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </Card>

            {/* Questions (Right) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Câu hỏi True / False / Not Given:
                </span>
                {submitted && (
                  <button
                    type="button"
                    onClick={handleNextPassage}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Bài tiếp</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>

              {curPassage.questions.map((q, idx) => {
                const userChoice = userAnswers[q.id]
                const isCorrect = userChoice === q.correct

                return (
                  <Card
                    key={q.id}
                    className={cx(
                      'p-4 space-y-3 transition-all',
                      submitted && isCorrect && 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20',
                      submitted && !isCorrect && 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-50 dark:bg-indigo-950/60 font-mono text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                        {idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {q.statement}
                      </p>
                    </div>

                    {/* Choices: TRUE / FALSE / NOT GIVEN */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {(['TRUE', 'FALSE', 'NOT GIVEN'] as TFNGChoice[]).map((c) => (
                        <button
                          key={c}
                          disabled={submitted}
                          onClick={() => handleSelectAnswer(q.id, c)}
                          className={cx(
                            'rounded-xl py-2 text-center text-xs font-extrabold transition-all cursor-pointer',
                            userChoice === c
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'border border-line bg-card text-muted hover:border-indigo-300',
                            submitted && q.correct === c && 'bg-emerald-600 text-white border-emerald-600',
                            submitted && userChoice === c && q.correct !== c && 'bg-rose-600 text-white border-rose-600'
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>

                    {/* Feedback & Explanation */}
                    {submitted && (
                      <div className="rounded-xl border border-line bg-slate-50 dark:bg-slate-800/40 p-3 space-y-1.5 text-xs animate-in fade-in">
                        <div className="flex items-center gap-1.5 font-bold">
                          {isCorrect ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 size={14} /> Chính xác
                            </span>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <AlertCircle size={14} /> Đáp án đúng: {q.correct}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {q.explanation}
                        </p>
                        <div className="text-[11px] text-muted italic border-t border-line/60 pt-1">
                          Trích dẫn: "{q.referenceQuote}"
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })}

              {!submitted && (
                <button
                  type="button"
                  onClick={handleCheckTfng}
                  className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 py-3 text-sm font-bold text-white shadow-md transition-all cursor-pointer"
                >
                  Nộp bài & Xem giải thích chi tiết
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SPEED READING WPM LAB */}
      {/* ------------------------------------------------------------- */}
      {subMode === 'speed' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  IELTS Speed Reading Lab · {speedArticle.wordCount} từ
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {speedArticle.title}
                </h3>
              </div>

              {/* Timer HUD */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-muted">Thời gian đọc</div>
                  <div className="font-mono text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {Math.floor(speedElapsed / 60).toString().padStart(2, '0')}:{(speedElapsed % 60).toString().padStart(2, '0')}
                  </div>
                </div>

                {speedState === 'idle' && (
                  <button
                    type="button"
                    onClick={startSpeedReading}
                    className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
                  >
                    <Clock size={15} />
                    <span>Bắt đầu đọc</span>
                  </button>
                )}

                {speedState === 'reading' && (
                  <button
                    type="button"
                    onClick={finishSpeedReading}
                    className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer animate-pulse"
                  >
                    <Check size={15} />
                    <span>Đã đọc xong!</span>
                  </button>
                )}

                {speedState === 'finished' && (
                  <button
                    type="button"
                    onClick={startSpeedReading}
                    className="p-2.5 rounded-xl border border-line hover:bg-slate-100 dark:hover:bg-slate-800 text-muted transition-colors cursor-pointer"
                    title="Đọc lại"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* WPM Result Card (when finished) */}
            {speedState === 'finished' && (
              <div className="rounded-2xl border-2 border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Kết quả tốc độ đọc của bạn:
                  </div>
                  <div className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {wpm} WPM
                  </div>
                </div>
                <div className={cx('text-sm font-extrabold', wpmEval.color)}>
                  {wpmEval.rating}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {wpmEval.description}
                </p>
              </div>
            )}

            {/* Article Passage */}
            <div className={cx(
              'rounded-2xl border border-line p-6 font-serif text-sm leading-relaxed text-slate-800 dark:text-slate-200 transition-all',
              speedState === 'idle' && 'blur-xs select-none opacity-40'
            )}>
              {speedArticle.passage.split('\n\n').map((para, i) => (
                <p key={i} className="mb-3.5 last:mb-0">
                  {para}
                </p>
              ))}
            </div>

            {/* Comprehension Verification (revealed when finished) */}
            {speedState === 'finished' && (
              <div className="space-y-4 border-t border-line pt-4 animate-in fade-in">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Kiểm tra độ hiểu bài sau khi đọc:
                </h4>

                {speedArticle.comprehensionQuiz.map((quiz, qIdx) => (
                  <div key={qIdx} className="rounded-xl border border-line bg-slate-50 dark:bg-slate-800/40 p-4 space-y-2.5">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {qIdx + 1}. {quiz.question}
                    </p>

                    <div className="space-y-1.5">
                      {quiz.options.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          onClick={() => {
                            setQuizAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))
                            setQuizChecked(true)
                          }}
                          className={cx(
                            'w-full text-left rounded-xl p-2.5 text-xs font-medium transition-all border cursor-pointer',
                            quizAnswers[qIdx] === oIdx
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-bold'
                              : 'border-line bg-card hover:border-indigo-300 text-slate-700 dark:text-slate-300',
                            quizChecked && oIdx === quiz.correctIndex && 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>

                    {quizChecked && (
                      <div className="text-[11px] text-muted border-t border-line/60 pt-1.5">
                        {quiz.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
