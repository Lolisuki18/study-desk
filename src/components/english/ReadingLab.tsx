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
  Type,
  Maximize2,
  FileText,
  Sliders,
  Bookmark,
} from 'lucide-react'
import { Card } from '../ui'
import { cx } from '../../utils'
import { playSound } from '../../utils/sound'
import { playMechSound } from '../../utils/mechSound'
import { haptic } from '../../utils/haptic'
import { fireConfetti } from '../../utils/confetti'
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

  // Reading Typography Customization (IELTS Accessibility Toolbar)
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base')
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif')

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
      fireConfetti()
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
    fireConfetti()
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
      {/* Top Segmented Sub Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-card p-2 rounded-2xl border border-line shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl">
          <button
            onClick={() => setSubMode('tfng')}
            className={cx(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
              subMode === 'tfng'
                ? 'bg-white dark:bg-card text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-muted hover:text-ink'
            )}
          >
            <Bookmark size={14} />
            <span>Chuyên đề True / False / Not Given (T/F/NG)</span>
          </button>

          <button
            onClick={() => setSubMode('speed')}
            className={cx(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
              subMode === 'speed'
                ? 'bg-white dark:bg-card text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-muted hover:text-ink'
            )}
          >
            <Gauge size={14} />
            <span>Đo tốc độ đọc WPM (Speed Reading)</span>
          </button>
        </div>

        {/* Reading Typography Controls */}
        <div className="flex items-center gap-2 px-2">
          {/* Font Family */}
          <div className="flex items-center rounded-lg border border-line bg-slate-50 dark:bg-slate-800 p-0.5 text-xs font-bold">
            <button
              onClick={() => setFontFamily('serif')}
              className={cx(
                'px-2 py-0.5 rounded font-serif transition-colors cursor-pointer',
                fontFamily === 'serif' ? 'bg-white dark:bg-card text-indigo-600 dark:text-indigo-400 shadow-2xs' : 'text-muted'
              )}
              title="Font Serif học thuật (Dễ đọc văn bản dài)"
            >
              Serif
            </button>
            <button
              onClick={() => setFontFamily('sans')}
              className={cx(
                'px-2 py-0.5 rounded font-sans transition-colors cursor-pointer',
                fontFamily === 'sans' ? 'bg-white dark:bg-card text-indigo-600 dark:text-indigo-400 shadow-2xs' : 'text-muted'
              )}
              title="Font Sans hiện đại"
            >
              Sans
            </button>
          </div>

          {/* Font Size */}
          <div className="flex items-center rounded-lg border border-line bg-slate-50 dark:bg-slate-800 p-0.5 text-xs font-bold font-mono">
            {(['sm', 'base', 'lg'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFontSize(s)}
                className={cx(
                  'px-2 py-0.5 rounded transition-colors cursor-pointer uppercase',
                  fontSize === s ? 'bg-white dark:bg-card text-indigo-600 dark:text-indigo-400 shadow-2xs' : 'text-muted'
                )}
                title={`Cỡ chữ: ${s}`}
              >
                {s === 'sm' ? 'A-' : s === 'base' ? 'A' : 'A+'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TFNG DUAL-PANE COMPUTER-DELIVERED IELTS VIEW */}
      {/* ------------------------------------------------------------- */}
      {subMode === 'tfng' && (
        <div className="space-y-4">
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
                  'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer',
                  passageIndex === idx
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'border border-line bg-card text-muted hover:border-indigo-400'
                )}
              >
                Passage {idx + 1}: {p.academicField.split('&')[0]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Pane: Passage Reading (Sticky & Scrollable) */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border-2 border-slate-200 dark:border-line bg-white dark:bg-card p-6 sm:p-8 shadow-sm space-y-4 sticky top-6 max-h-[82vh] overflow-y-auto">
                <div className="border-b border-line pb-3">
                  <div className="text-[10px] font-mono font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    READING PASSAGE {passageIndex + 1} · {curPassage.academicField}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1 leading-snug">
                    {curPassage.title}
                  </h3>
                </div>

                <div
                  className={cx(
                    'leading-relaxed space-y-4 text-slate-800 dark:text-slate-200 selection:bg-amber-200 dark:selection:bg-amber-900/60 selection:text-amber-950 dark:selection:text-amber-100',
                    fontFamily === 'serif' ? 'font-serif' : 'font-sans',
                    fontSize === 'sm' && 'text-xs',
                    fontSize === 'base' && 'text-sm',
                    fontSize === 'lg' && 'text-base'
                  )}
                >
                  {curPassage.passage.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="text-justify indent-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Pane: Questions & Answer Cards */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Questions 1 - {curPassage.questions.length}: Do the statements agree?
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
                  <div
                    key={q.id}
                    className={cx(
                      'rounded-2xl border-2 p-4 sm:p-5 space-y-3.5 transition-all bg-white dark:bg-card shadow-2xs',
                      submitted && isCorrect && 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20',
                      submitted && !isCorrect && 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20',
                      !submitted && 'border-line hover:border-slate-300 dark:hover:border-slate-700'
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/80 font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
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
                            'rounded-xl py-2.5 text-center text-xs font-extrabold transition-all cursor-pointer border',
                            userChoice === c
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'border-line bg-card text-muted hover:border-indigo-300',
                            submitted && q.correct === c && 'bg-emerald-600 text-white border-emerald-600',
                            submitted && userChoice === c && q.correct !== c && 'bg-rose-600 text-white border-rose-600'
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>

                    {/* Feedback & In-depth Explanation */}
                    {submitted && (
                      <div className="rounded-xl border border-line bg-slate-50 dark:bg-slate-800/40 p-3.5 space-y-2 text-xs animate-in fade-in">
                        <div className="flex items-center gap-1.5 font-bold">
                          {isCorrect ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 size={15} /> Đúng tuyệt đối
                            </span>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <AlertCircle size={15} /> Đáp án đúng: {q.correct}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                          {q.explanation}
                        </p>
                        <div className="text-[11px] text-muted italic border-t border-line/60 pt-1.5 font-serif">
                          Trích dẫn văn bản: "{q.referenceQuote}"
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {!submitted && (
                <button
                  type="button"
                  onClick={handleCheckTfng}
                  className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
                >
                  Nộp bài & Xem đối chiếu chi tiết
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
          <div className="rounded-3xl border-2 border-slate-200 dark:border-line bg-white dark:bg-card p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  IELTS SPEED READING LAB · {speedArticle.wordCount} TỪ
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

            {/* WPM Gauge Dashboard */}
            {speedState === 'finished' && (
              <div className="rounded-3xl border-2 border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Tốc độ đọc đo được:
                  </div>
                  <div className="font-mono text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {wpm} <span className="text-sm font-bold text-muted font-sans">từ / phút (WPM)</span>
                  </div>
                </div>

                <div className={cx('text-sm font-extrabold', wpmEval.color)}>
                  {wpmEval.rating}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {wpmEval.description}
                </p>
              </div>
            )}

            {/* Article Passage with Blurring during idle */}
            <div
              className={cx(
                'rounded-2xl border border-line p-6 text-sm leading-relaxed text-slate-800 dark:text-slate-200 transition-all font-serif',
                speedState === 'idle' && 'blur-xs select-none opacity-40'
              )}
            >
              {speedArticle.passage.split('\n\n').map((para, i) => (
                <p key={i} className="mb-3.5 last:mb-0 text-justify">
                  {para}
                </p>
              ))}
            </div>

            {/* Comprehension Quiz */}
            {speedState === 'finished' && (
              <div className="space-y-4 border-t border-line pt-4 animate-in fade-in">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Kiểm tra độ hiểu bài sau khi đọc:
                </h4>

                {speedArticle.comprehensionQuiz.map((quiz, qIdx) => (
                  <div key={qIdx} className="rounded-2xl border border-line bg-slate-50 dark:bg-slate-800/40 p-4 space-y-2.5">
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
                            'w-full text-left rounded-xl p-3 text-xs font-medium transition-all border cursor-pointer',
                            quizAnswers[qIdx] === oIdx
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-bold shadow-2xs'
                              : 'border-line bg-card hover:border-indigo-300 text-slate-700 dark:text-slate-300',
                            quizChecked && oIdx === quiz.correctIndex && 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>

                    {quizChecked && (
                      <div className="text-[11px] text-muted border-t border-line/60 pt-2 font-serif italic">
                        {quiz.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
