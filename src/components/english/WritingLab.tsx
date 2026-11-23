import { useState, useEffect, useRef } from 'react'
import {
  PenTool,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  ArrowRight,
  Flame,
  Award,
  Maximize2,
  Minimize2,
  Zap,
  Repeat,
  Check,
} from 'lucide-react'
import { Card } from '../ui'
import { cx, pct } from '../../utils'
import { playSound } from '../../utils/sound'
import { playMechSound } from '../../utils/mechSound'
import { haptic } from '../../utils/haptic'
import { fireConfetti } from '../../utils/confetti'
import {
  WRITING_PROMPTS,
  PARAPHRASE_DRILLS,
  analyzeWritingText,
  type WritingPrompt,
  type ParaphraseDrill,
} from '../../services/english/writingLab'

export function WritingLab() {
  const [activeTab, setActiveTab] = useState<'editor' | 'paraphrase'>('editor')

  // -----------------------------------------------------------------------------------------------
  // TIMED ESSAY EDITOR STATE
  // -----------------------------------------------------------------------------------------------
  const [selectedPrompt, setSelectedPrompt] = useState<WritingPrompt>(WRITING_PROMPTS[0])
  const [essayText, setEssayText] = useState('')
  const [timeLeft, setTimeLeft] = useState(selectedPrompt.recommendedMinutes * 60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [showModel, setShowModel] = useState(false)
  const [isZenMode, setIsZenMode] = useState(false)
  const [hasCelebratedWordGoal, setHasCelebratedWordGoal] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleSelectPrompt = (prompt: WritingPrompt) => {
    setSelectedPrompt(prompt)
    setEssayText('')
    setTimeLeft(prompt.recommendedMinutes * 60)
    setTimerRunning(false)
    setShowModel(false)
    setHasCelebratedWordGoal(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const toggleTimer = () => {
    setTimerRunning((r) => !r)
  }

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerRunning(false)
    setTimeLeft(selectedPrompt.recommendedMinutes * 60)
  }

  useEffect(() => {
    if (!timerRunning) return
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          setTimerRunning(false)
          playSound('fanfare')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timerRunning])

  // Real-time analysis of typed essay
  const analysis = analyzeWritingText(essayText)
  const wordTargetPct = Math.min(100, pct(analysis.wordCount, selectedPrompt.targetWordCount))
  const isWordTargetMet = analysis.wordCount >= selectedPrompt.targetWordCount

  // Trigger celebration when user first hits target word count
  useEffect(() => {
    if (isWordTargetMet && !hasCelebratedWordGoal && analysis.wordCount > 0) {
      setHasCelebratedWordGoal(true)
      playSound('fanfare')
      fireConfetti()
      haptic('success')
    }
  }, [isWordTargetMet, hasCelebratedWordGoal, analysis.wordCount])

  // 1-Click Replace informal word directly in text
  const handleReplaceInformalWord = (phrase: string, alternative: string) => {
    // Pick the first recommended alternative before the slash
    const bestAlt = alternative.split('/')[0].trim()
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi')
    setEssayText((prev) => prev.replace(regex, bestAlt))
    playSound('correct')
    haptic('success')
  }

  // -----------------------------------------------------------------------------------------------
  // PARAPHRASE DRILLS STATE
  // -----------------------------------------------------------------------------------------------
  const [paraIndex, setParaIndex] = useState(0)
  const [paraInput, setParaInput] = useState('')
  const [paraChecked, setParaChecked] = useState(false)

  const curPara = PARAPHRASE_DRILLS[paraIndex]

  const handleParaCheck = () => {
    setParaChecked(true)
    playSound('correct')
    haptic('success')
  }

  const handleParaNext = () => {
    setParaInput('')
    setParaChecked(false)
    if (paraIndex < PARAPHRASE_DRILLS.length - 1) {
      setParaIndex((i) => i + 1)
    } else {
      setParaIndex(0)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Segmented Sub Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-card p-2 rounded-2xl border border-line shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl">
          <button
            onClick={() => setActiveTab('editor')}
            className={cx(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
              activeTab === 'editor'
                ? 'bg-white dark:bg-card text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-muted hover:text-ink'
            )}
          >
            <PenTool size={14} />
            <span>Phòng thi Essay có đếm giờ (Timed Essay)</span>
          </button>

          <button
            onClick={() => setActiveTab('paraphrase')}
            className={cx(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
              activeTab === 'paraphrase'
                ? 'bg-white dark:bg-card text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-muted hover:text-ink'
            )}
          >
            <Repeat size={14} />
            <span>Luyện viết lại câu học thuật (Paraphrase)</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-muted">
          <PenTool size={15} className="text-emerald-600 dark:text-emerald-400" />
          <span>IELTS Writing Studio</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TIMED ESSAY EDITOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'editor' && (
        <div className="space-y-6">
          {/* Prompt Selection Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {WRITING_PROMPTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPrompt(p)}
                  className={cx(
                    'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer',
                    selectedPrompt.id === p.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'border border-line bg-card text-muted hover:border-indigo-400'
                  )}
                >
                  {p.taskType}: {p.title}
                </button>
              ))}
            </div>

            {/* Zen Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsZenMode((z) => !z)}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer',
                isZenMode
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                  : 'border-line text-muted hover:text-ink'
              )}
              title="Chế độ tập trung không xao nhãng"
            >
              {isZenMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{isZenMode ? 'Thoát Zen Mode' : 'Chế độ tập trung (Zen Mode)'}</span>
            </button>
          </div>

          <div className={cx('grid gap-6 items-start', isZenMode ? 'grid-cols-1 max-w-4xl mx-auto' : 'grid-cols-1 lg:grid-cols-12')}>
            {/* Editor Area (Left Pane) */}
            <div className={cx(isZenMode ? 'w-full' : 'lg:col-span-8', 'space-y-4')}>
              <div className="rounded-3xl border-2 border-slate-200 dark:border-line bg-white dark:bg-card p-6 sm:p-7 shadow-sm space-y-4">
                {/* Prompt Details Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                  <div className="space-y-0.5">
                    <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                      {selectedPrompt.taskType} · Chỉ tiêu tối thiểu {selectedPrompt.targetWordCount} từ
                    </span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {selectedPrompt.title}
                    </h3>
                  </div>

                  {/* Timer */}
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-muted">Thời gian còn lại</div>
                      <div
                        className={cx(
                          'font-mono text-xl font-black',
                          timeLeft <= 300 && timerRunning ? 'text-rose-600 animate-pulse' : 'text-indigo-600 dark:text-indigo-400'
                        )}
                      >
                        {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={toggleTimer}
                      className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                      title={timerRunning ? 'Tạm dừng' : 'Bắt đầu tính giờ'}
                    >
                      {timerRunning ? <Pause size={15} /> : <Play size={15} fill="white" />}
                    </button>

                    <button
                      type="button"
                      onClick={resetTimer}
                      className="p-2.5 rounded-xl border border-line hover:bg-slate-100 dark:hover:bg-slate-800 text-muted transition-colors cursor-pointer"
                      title="Đặt lại giờ"
                    >
                      <RotateCcw size={15} />
                    </button>
                  </div>
                </div>

                {/* Prompt Question */}
                <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed font-serif">
                  <b>Đề bài IELTS:</b> {selectedPrompt.prompt}
                </div>

                {/* Main Textarea */}
                <div className="space-y-3">
                  <textarea
                    rows={isZenMode ? 18 : 14}
                    value={essayText}
                    onChange={(e) => setEssayText(e.target.value)}
                    placeholder="Bắt đầu viết bài luận học thuật tại đây... Áp dụng liên từ nối câu, mệnh đề quan hệ và các từ vựng học thuật."
                    className="w-full rounded-2xl border-2 border-line bg-card p-4 sm:p-5 text-sm sm:text-base font-sans text-ink outline-none focus:border-indigo-500 transition-all shadow-inner leading-relaxed"
                  />

                  {/* Word Count Progress Bar & Milestone Status */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        {isWordTargetMet ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-black animate-in fade-in">
                            <CheckCircle2 size={16} /> Đã đạt chỉ tiêu độ dài tối thiểu!
                          </span>
                        ) : (
                          <span className="text-muted">Chỉ tiêu độ dài bài viết:</span>
                        )}
                      </span>
                      <span
                        className={cx(
                          'font-mono text-sm',
                          isWordTargetMet ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-700 dark:text-slate-300'
                        )}
                      >
                        {analysis.wordCount} / {selectedPrompt.targetWordCount} từ ({wordTargetPct}%)
                      </span>
                    </div>

                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={cx(
                          'h-full transition-all duration-300',
                          isWordTargetMet ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                        )}
                        style={{ width: `${wordTargetPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Lexical Resource Panel (Right Pane - hidden in Zen Mode) */}
            {!isZenMode && (
              <div className="lg:col-span-4 space-y-4">
                {/* Academic Vocabulary AWL Scanner */}
                <div className="rounded-3xl border-2 border-slate-200 dark:border-line bg-white dark:bg-card p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-line pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Zap size={14} className="text-indigo-600 dark:text-indigo-400" />
                      <span>Từ vựng học thuật (AWL)</span>
                    </span>
                    <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300">
                      {analysis.awlWords.length} từ
                    </span>
                  </div>

                  <p className="text-[11px] text-muted leading-relaxed">
                    Hệ thống tự động phát hiện các từ thuộc Danh mục Học thuật (AWL) bạn đã dùng trong bài viết.
                  </p>

                  {analysis.awlWords.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-line p-3 text-center text-xs text-muted">
                      Chưa phát hiện từ vựng học thuật. Hãy tích cực dùng các từ như <i>substantial, consequently, mitigate, unprecedented...</i>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {analysis.awlWords.map((w, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Informal Word Warnings with 1-Click Replacement */}
                <div className="rounded-3xl border-2 border-slate-200 dark:border-line bg-white dark:bg-card p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-line pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle size={14} />
                      <span>Cảnh báo từ văn nói</span>
                    </span>
                    {analysis.informalFound.length > 0 && (
                      <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 text-xs font-mono font-bold text-amber-800 dark:text-amber-300">
                        {analysis.informalFound.length} lưu ý
                      </span>
                    )}
                  </div>

                  {analysis.informalFound.length === 0 ? (
                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span>Bài viết không chứa các từ văn nói thông tục!</span>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      {analysis.informalFound.map((item, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-2.5 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between font-bold text-rose-700 dark:text-rose-400">
                            <span className="line-through">"{item.phrase}"</span>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Tránh dùng</span>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
                            <span className="text-emerald-800 dark:text-emerald-300 font-semibold text-[11px] truncate">
                              Gợi ý: <b>{item.alternative.split('/')[0]}</b>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleReplaceInformalWord(item.phrase, item.alternative)}
                              className="shrink-0 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                              title="Bấm để tự động thay thế cụm từ này trong bài viết"
                            >
                              Thay ngay
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Model Essay Accordion */}
                <div className="rounded-3xl border-2 border-slate-200 dark:border-line bg-white dark:bg-card p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <Award size={15} className="text-amber-500" />
                      <span>Bài mẫu Band 8.0+</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowModel((m) => !m)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {showModel ? 'Thu gọn' : 'Xem bài mẫu'}
                    </button>
                  </div>

                  {showModel && (
                    <div className="space-y-3 pt-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-serif border-t border-line animate-in fade-in">
                      {selectedPrompt.band8Sample.split('\n\n').map((para, i) => (
                        <p key={i} className="text-justify">
                          {para}
                        </p>
                      ))}

                      <div className="pt-2 border-t border-line/60">
                        <div className="text-[11px] font-bold text-muted mb-1.5 font-sans">
                          Cụm từ đắt giá Band 8.0:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {selectedPrompt.modelHighlights.map((h, i) => (
                            <span
                              key={i}
                              className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-800 dark:text-slate-200 font-sans"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PARAPHRASE DRILLS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'paraphrase' && (
        <div className="max-w-2xl mx-auto space-y-5">
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Câu {paraIndex + 1} / {PARAPHRASE_DRILLS.length} · {curPara.strategy}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Luyện tập Paraphrase học thuật
                </h3>
              </div>
            </div>

            {/* Original Sentence */}
            <div className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 p-5 space-y-2">
              <div className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                Câu gốc (Original Prompt):
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed font-serif">
                "{curPara.original}"
              </div>
            </div>

            {/* Rewrite Input */}
            <div className="space-y-3">
              <textarea
                rows={3}
                value={paraInput}
                onChange={(e) => setParaInput(e.target.value)}
                placeholder="Viết lại câu trên bằng cách dùng danh từ hóa, từ đồng nghĩa học thuật hoặc chuyển đổi cấu trúc..."
                className="w-full rounded-2xl border-2 border-line bg-card p-4 text-sm text-ink outline-none focus:border-indigo-500 shadow-xs leading-relaxed"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={paraChecked ? handleParaNext : handleParaCheck}
                  className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 px-6 py-3 text-sm font-bold text-white shadow-md transition-all cursor-pointer"
                >
                  {paraChecked ? 'Câu tiếp theo »' : 'Xem đáp án mẫu'}
                </button>
              </div>

              {/* Reveal Model & Explanation */}
              {paraChecked && (
                <div className="rounded-2xl border border-line bg-slate-50 dark:bg-slate-800/40 p-5 space-y-3 animate-in fade-in">
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Model Paraphrase (Band 8.0+):
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed font-serif">
                    "{curPara.modelAnswer}"
                  </p>
                  <p className="text-xs text-muted border-t border-line/60 pt-2 leading-relaxed">
                    <b>Phương pháp áp dụng:</b> {curPara.explanation}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-muted">Từ khóa then chốt:</span>
                    {curPara.keyElements.map((el, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-indigo-100 dark:bg-indigo-950/60 px-2 py-0.5 text-[10px] font-semibold text-indigo-800 dark:text-indigo-300"
                      >
                        {el}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
