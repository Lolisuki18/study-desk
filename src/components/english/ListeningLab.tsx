import { useState, useEffect, useRef } from 'react'
import {
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Headphones,
  Check,
  X,
  Lightbulb,
  Radio,
  FileText,
  Sliders,
  ShieldCheck,
} from 'lucide-react'
import { Card } from '../ui'
import { cx } from '../../utils'
import { speakEnglish, stopSpeaking } from '../../utils/speech'
import { playSound } from '../../utils/sound'
import { playMechSound } from '../../utils/mechSound'
import { haptic } from '../../utils/haptic'
import {
  SECTION1_DRILLS,
  SENTENCE_DICTATIONS,
  isSection1AnswerCorrect,
  type Section1Item,
  type SentenceDictationItem,
} from '../../services/english/listeningLab'
import { computeSpellingDiff, type DiffPart } from '../../services/english/diff'

export function ListeningLab() {
  const [mode, setMode] = useState<'section1' | 'sentences'>('section1')

  // Audio playing visualizer state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const audioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // -----------------------------------------------------------------------------------------------
  // SECTION 1 EXAM FORM STATE
  // -----------------------------------------------------------------------------------------------
  const [s1Index, setS1Index] = useState(0)
  const [s1Input, setS1Input] = useState('')
  const [s1Status, setS1Status] = useState<'unsubmitted' | 'correct' | 'wrong'>('unsubmitted')
  const [s1Score, setS1Score] = useState(0)
  const [s1ShowTip, setS1ShowTip] = useState(false)
  const [s1PlayCount, setS1PlayCount] = useState(0)
  const [examSimulationMode, setExamSimulationMode] = useState(false)

  const curS1 = SECTION1_DRILLS[s1Index]

  const triggerAudioPlay = (text: string, accent: 'UK' | 'US' = 'UK', rate: number = 0.9) => {
    stopSpeaking()
    if (audioTimerRef.current) clearTimeout(audioTimerRef.current)
    setIsPlayingAudio(true)

    // Calculate approximate duration based on word count
    const words = text.split(/\s+/).length
    const durationMs = Math.max(2500, (words / (rate * 2.2)) * 1000)

    speakEnglish(text, { accent, rate })

    audioTimerRef.current = setTimeout(() => {
      setIsPlayingAudio(false)
    }, durationMs)
  }

  const playS1Audio = () => {
    if (!curS1) return
    if (examSimulationMode && s1PlayCount >= 1) {
      playSound('wrong')
      return
    }
    setS1PlayCount((p) => p + 1)
    triggerAudioPlay(curS1.spokenText, 'UK', 0.9)
  }

  useEffect(() => {
    setS1Input('')
    setS1Status('unsubmitted')
    setS1ShowTip(false)
    setS1PlayCount(0)

    if (mode === 'section1' && curS1) {
      const t = setTimeout(() => {
        setS1PlayCount(1)
        triggerAudioPlay(curS1.spokenText, 'UK', 0.9)
      }, 400)
      return () => clearTimeout(t)
    }
  }, [s1Index, mode])

  const handleS1Check = () => {
    if (!curS1 || !s1Input.trim()) return
    const isCorrect = isSection1AnswerCorrect(s1Input, curS1.answer)
    if (isCorrect) {
      setS1Status('correct')
      setS1Score((s) => s + 1)
      playSound('correct')
      playMechSound('enter')
      haptic('success')
    } else {
      setS1Status('wrong')
      playSound('wrong')
      haptic('error')
    }
  }

  const handleS1Next = () => {
    if (s1Index < SECTION1_DRILLS.length - 1) {
      setS1Index((i) => i + 1)
    } else {
      setS1Index(0)
    }
  }

  // -----------------------------------------------------------------------------------------------
  // SENTENCE DICTATION STATE
  // -----------------------------------------------------------------------------------------------
  const [sdIndex, setSdIndex] = useState(0)
  const [sdInput, setSdInput] = useState('')
  const [sdStatus, setSdStatus] = useState<'unsubmitted' | 'checked'>('unsubmitted')
  const [sdDiff, setSdDiff] = useState<DiffPart[]>([])
  const [sdRate, setSdRate] = useState<number>(1.0)
  const [sdAccent, setSdAccent] = useState<'UK' | 'US'>('UK')

  const curSd = SENTENCE_DICTATIONS[sdIndex]

  const playSdAudio = (rate = sdRate, accent = sdAccent) => {
    if (!curSd) return
    triggerAudioPlay(curSd.audioText, accent, rate)
  }

  useEffect(() => {
    setSdInput('')
    setSdStatus('unsubmitted')
    setSdDiff([])
    if (mode === 'sentences' && curSd) {
      const t = setTimeout(() => {
        playSdAudio()
      }, 400)
      return () => clearTimeout(t)
    }
  }, [sdIndex, mode])

  const handleSdCheck = () => {
    if (!curSd || !sdInput.trim()) return
    const diff = computeSpellingDiff(sdInput.trim(), curSd.targetText.trim())
    setSdDiff(diff.parts)
    setSdStatus('checked')
    if (diff.similarity >= 0.9) {
      playSound('correct')
      haptic('success')
    } else {
      playSound('wrong')
      haptic('error')
    }
  }

  const handleSdNext = () => {
    if (sdIndex < SENTENCE_DICTATIONS.length - 1) {
      setSdIndex((i) => i + 1)
    } else {
      setSdIndex(0)
    }
  }

  useEffect(() => {
    return () => {
      stopSpeaking()
      if (audioTimerRef.current) clearTimeout(audioTimerRef.current)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Top Mode Segmented Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-card p-2 rounded-2xl border border-line shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl">
          <button
            onClick={() => setMode('section1')}
            className={cx(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
              mode === 'section1'
                ? 'bg-white dark:bg-card text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-muted hover:text-ink'
            )}
          >
            <FileText size={14} />
            <span>IELTS Section 1 (Form Filling)</span>
          </button>

          <button
            onClick={() => setMode('sentences')}
            className={cx(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
              mode === 'sentences'
                ? 'bg-white dark:bg-card text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-muted hover:text-ink'
            )}
          >
            <Headphones size={14} />
            <span>Academic Sentence Dictation</span>
          </button>
        </div>

        {/* Audio Visualizer Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1">
          <div className="flex items-center gap-1 h-4">
            <span
              className={cx(
                'w-1 rounded-full transition-all duration-150',
                isPlayingAudio ? 'bg-indigo-500 animate-[pulse_0.4s_infinite_ease-in-out] h-4' : 'bg-slate-300 dark:bg-slate-700 h-1.5'
              )}
            />
            <span
              className={cx(
                'w-1 rounded-full transition-all duration-150',
                isPlayingAudio ? 'bg-indigo-600 animate-[pulse_0.6s_infinite_ease-in-out] h-5' : 'bg-slate-300 dark:bg-slate-700 h-2'
              )}
            />
            <span
              className={cx(
                'w-1 rounded-full transition-all duration-150',
                isPlayingAudio ? 'bg-sky-500 animate-[pulse_0.3s_infinite_ease-in-out] h-3.5' : 'bg-slate-300 dark:bg-slate-700 h-1.5'
              )}
            />
            <span
              className={cx(
                'w-1 rounded-full transition-all duration-150',
                isPlayingAudio ? 'bg-indigo-500 animate-[pulse_0.5s_infinite_ease-in-out] h-4.5' : 'bg-slate-300 dark:bg-slate-700 h-2'
              )}
            />
          </div>
          <span className="text-[11px] font-bold text-muted font-mono">
            {isPlayingAudio ? 'AUDIO ĐANG PHÁT' : 'SẴN SÀNG'}
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODE 1: IELTS SECTION 1 FORM FILLING */}
      {/* ------------------------------------------------------------- */}
      {mode === 'section1' && (
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Authentic Cambridge Exam Form Container */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-slate-200 dark:border-indigo-950/60 bg-gradient-to-b from-amber-50/20 via-white to-white dark:from-slate-900/90 dark:via-card dark:to-card p-6 sm:p-8 shadow-sm">
            {/* Top Exam Header Banner */}
            <div className="border-b-2 border-slate-900/10 dark:border-line pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400">
                  INTERNATIONAL ENGLISH LANGUAGE TESTING SYSTEM
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-tight mt-0.5">
                  Listening Section 1: Notes Completion
                </h3>
              </div>

              {/* Exam Simulation Mode Toggle */}
              <button
                type="button"
                onClick={() => setExamSimulationMode((m) => !m)}
                className={cx(
                  'inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer border',
                  examSimulationMode
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                    : 'border-line text-muted hover:text-ink'
                )}
                title="Bật chế độ giới hạn số lần nghe giống phòng thi thật"
              >
                <ShieldCheck size={14} className={examSimulationMode ? 'text-indigo-600 dark:text-indigo-400' : ''} />
                <span>Thi thật (1 lần nghe): {examSimulationMode ? 'BẬT' : 'TẮT'}</span>
              </button>
            </div>

            {/* Instruction Banner */}
            <div className="my-4 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 font-serif italic border-l-4 border-indigo-600">
              Complete the notes below. Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.
            </div>

            {/* Question Progress & Interactive Audio Station */}
            <div className="my-6 flex flex-col items-center justify-center gap-3">
              <div className="relative">
                {/* Glow ring when playing */}
                <div
                  className={cx(
                    'absolute -inset-2 rounded-full transition-all duration-300',
                    isPlayingAudio ? 'bg-indigo-500/20 blur-md animate-pulse' : 'opacity-0'
                  )}
                />
                <button
                  type="button"
                  onClick={playS1Audio}
                  disabled={examSimulationMode && s1PlayCount >= 1}
                  className={cx(
                    'relative inline-flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition-all cursor-pointer',
                    isPlayingAudio
                      ? 'bg-gradient-to-tr from-indigo-700 to-indigo-500 scale-105'
                      : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:scale-105 active:scale-95 shadow-indigo-500/25',
                    examSimulationMode && s1PlayCount >= 1 && 'opacity-40 cursor-not-allowed'
                  )}
                  title="Nghe hội thoại bản xứ"
                >
                  <Volume2 size={32} className={isPlayingAudio ? 'animate-bounce' : ''} />
                </button>
              </div>

              <div className="text-center space-y-1">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isPlayingAudio ? 'Đang phát hội thoại (Giọng UK)...' : 'Bấm để nghe đoạn hội thoại'}
                </div>
                <div className="text-[11px] text-muted font-mono">
                  Đã nghe: {s1PlayCount} lần {examSimulationMode ? '(Tối đa 1 lần)' : ''}
                </div>
              </div>
            </div>

            {/* Simulated Official Form Fields */}
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-line bg-slate-50/60 dark:bg-slate-800/30 p-5 space-y-3.5 font-sans">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted">
                Application & Booking Form
              </div>

              {/* Context prompt */}
              <div className="text-xs text-slate-600 dark:text-slate-400 italic">
                "{curS1.context}"
              </div>

              {/* Target field line */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-line/60">
                <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-100 dark:bg-indigo-950/80 font-mono text-[11px] text-indigo-700 dark:text-indigo-300 font-black">
                    {s1Index + 1}
                  </span>
                  <span>{curS1.label}:</span>
                </span>

                {/* Input box inside form */}
                <div className="flex-1 max-w-xs">
                  <input
                    type="text"
                    autoFocus
                    value={s1Input}
                    onChange={(e) => {
                      setS1Input(e.target.value)
                      if (s1Status !== 'unsubmitted') setS1Status('unsubmitted')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (s1Status === 'unsubmitted') handleS1Check()
                        else handleS1Next()
                      }
                    }}
                    placeholder="Gõ đáp án vào đây..."
                    className={cx(
                      'w-full rounded-xl border-2 px-3.5 py-2 text-sm font-bold outline-none transition-all shadow-2xs font-mono',
                      s1Status === 'correct' && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100',
                      s1Status === 'wrong' && 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100',
                      s1Status === 'unsubmitted' && 'border-slate-300 dark:border-line bg-white dark:bg-card focus:border-indigo-500 text-ink'
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setS1ShowTip((t) => !t)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                <Lightbulb size={14} className={s1ShowTip ? 'text-amber-500' : ''} />
                <span>{s1ShowTip ? 'Ẩn mẹo giám khảo' : 'Xem bẫy giám khảo'}</span>
              </button>

              <button
                type="button"
                onClick={s1Status === 'unsubmitted' ? handleS1Check : handleS1Next}
                className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                {s1Status === 'unsubmitted' ? 'Kiểm tra đáp án' : 'Câu tiếp theo »'}
              </button>
            </div>

            {/* Feedback alert */}
            {s1Status === 'correct' && (
              <div className="mt-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/80 dark:bg-emerald-950/40 p-4 text-center animate-in fade-in">
                <div className="text-sm font-black text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={18} />
                  <span>Chính xác tuyệt đối!</span>
                </div>
                <div className="mt-0.5 font-mono text-sm font-bold text-emerald-950 dark:text-emerald-100">
                  Đáp án chuẩn: {curS1.answer}
                </div>
              </div>
            )}

            {s1Status === 'wrong' && (
              <div className="mt-4 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/80 dark:bg-rose-950/40 p-4 text-center space-y-1 animate-in fade-in">
                <div className="text-sm font-black text-rose-700 dark:text-rose-300 flex items-center justify-center gap-1.5">
                  <AlertCircle size={18} />
                  <span>Chưa chính xác!</span>
                </div>
                <div className="font-mono text-sm font-bold text-rose-950 dark:text-rose-100">
                  Đáp án chuẩn: {curS1.answer}
                </div>
              </div>
            )}

            {s1ShowTip && (
              <div className="mt-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
                <b>Lưu ý từ giám khảo:</b> {curS1.tip}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODE 2: ACADEMIC SENTENCE DICTATION */}
      {/* ------------------------------------------------------------- */}
      {mode === 'sentences' && (
        <div className="max-w-2xl mx-auto space-y-5">
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Bài {sdIndex + 1} / {SENTENCE_DICTATIONS.length} · {curSd.context}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {curSd.title}
                </h3>
              </div>

              {/* Accent & Speed Presets */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSdAccent((a) => (a === 'UK' ? 'US' : 'UK'))}
                  className="rounded-xl border border-line bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-indigo-400 transition-colors cursor-pointer"
                >
                  Giọng {sdAccent}
                </button>
                {(['0.8', '1.0'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setSdRate(Number(r))}
                    className={cx(
                      'rounded-xl border px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer font-mono',
                      sdRate === Number(r)
                        ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                        : 'border-line bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    {r}x
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Action Button */}
            <div className="py-2 text-center space-y-3">
              <button
                type="button"
                onClick={() => playSdAudio()}
                className={cx(
                  'group inline-flex h-20 w-20 items-center justify-center rounded-3xl text-white shadow-lg transition-all cursor-pointer',
                  isPlayingAudio
                    ? 'bg-gradient-to-tr from-indigo-700 to-indigo-500 scale-105 shadow-indigo-500/40'
                    : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:scale-105 active:scale-95 shadow-indigo-500/25'
                )}
                title="Nghe câu học thuật"
              >
                <Volume2 size={32} className={isPlayingAudio ? 'animate-pulse' : ''} />
              </button>
              <div className="text-xs text-muted font-medium">
                Nghe câu văn học thuật và gõ lại đầy đủ chính tả
              </div>
            </div>

            {/* Textarea for Sentence */}
            <div className="space-y-3">
              <textarea
                rows={3}
                value={sdInput}
                onChange={(e) => {
                  setSdInput(e.target.value)
                  if (sdStatus !== 'unsubmitted') setSdStatus('unsubmitted')
                }}
                placeholder="Gõ lại toàn bộ câu bạn nghe được..."
                className="w-full rounded-2xl border-2 border-line bg-card p-4 text-sm font-medium text-ink outline-none focus:border-indigo-500 transition-all shadow-xs"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={sdStatus === 'unsubmitted' ? handleSdCheck : handleSdNext}
                  className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 px-6 py-3 text-sm font-bold text-white shadow-md transition-all cursor-pointer"
                >
                  {sdStatus === 'unsubmitted' ? 'So sánh kết quả' : 'Câu tiếp theo »'}
                </button>
              </div>

              {/* Diff Result */}
              {sdStatus === 'checked' && (
                <div className="rounded-2xl border border-line bg-slate-50 dark:bg-slate-800/40 p-5 space-y-3 animate-in fade-in">
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Đối chiếu với câu gốc:
                  </div>
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                    {curSd.targetText}
                  </div>
                  <div className="text-xs text-muted italic border-t border-line/60 pt-2">
                    Nghĩa tiếng Việt: {curSd.translation}
                  </div>
                  <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/60 p-2.5 text-xs text-indigo-800 dark:text-indigo-300">
                    <b>Từ vựng trọng tâm:</b> {curSd.keyFocus}
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
