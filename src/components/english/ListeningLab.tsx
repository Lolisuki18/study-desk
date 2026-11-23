import { useState, useEffect } from 'react'
import {
  Volume2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Headphones,
  Check,
  X,
  Lightbulb,
} from 'lucide-react'
import { Card } from '../ui'
import { cx } from '../../utils'
import { speakEnglish } from '../../utils/speech'
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

  // Section 1 State
  const [s1Index, setS1Index] = useState(0)
  const [s1Input, setS1Input] = useState('')
  const [s1Status, setS1Status] = useState<'unsubmitted' | 'correct' | 'wrong'>('unsubmitted')
  const [s1Score, setS1Score] = useState(0)
  const [s1ShowTip, setS1ShowTip] = useState(false)

  const curS1 = SECTION1_DRILLS[s1Index]

  const playS1Audio = () => {
    if (!curS1) return
    speakEnglish(curS1.spokenText, { accent: 'UK', rate: 0.9 })
  }

  useEffect(() => {
    setS1Input('')
    setS1Status('unsubmitted')
    setS1ShowTip(false)
    if (mode === 'section1' && curS1) {
      const t = setTimeout(() => {
        playS1Audio()
      }, 300)
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

  // Sentence Dictation State
  const [sdIndex, setSdIndex] = useState(0)
  const [sdInput, setSdInput] = useState('')
  const [sdStatus, setSdStatus] = useState<'unsubmitted' | 'checked'>('unsubmitted')
  const [sdDiff, setSdDiff] = useState<DiffPart[]>([])
  const [sdRate, setSdRate] = useState<number>(1.0)
  const [sdAccent, setSdAccent] = useState<'UK' | 'US'>('UK')

  const curSd = SENTENCE_DICTATIONS[sdIndex]

  const playSdAudio = (rate = sdRate, accent = sdAccent) => {
    if (!curSd) return
    speakEnglish(curSd.audioText, { accent, rate })
  }

  useEffect(() => {
    setSdInput('')
    setSdStatus('unsubmitted')
    setSdDiff([])
    if (mode === 'sentences' && curSd) {
      const t = setTimeout(() => {
        playSdAudio()
      }, 300)
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

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-2xl border border-line">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('section1')}
            className={cx(
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
              mode === 'section1'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-muted hover:text-ink'
            )}
          >
            IELTS Section 1 (Điền mẫu đơn / Số / Ngày / Tên)
          </button>
          <button
            onClick={() => setMode('sentences')}
            className={cx(
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
              mode === 'sentences'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-muted hover:text-ink'
            )}
          >
            Chép chính tả Câu học thuật (Band 7.5+)
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-muted">
          <Headphones size={15} className="text-indigo-600 dark:text-indigo-400" />
          <span>IELTS Listening Practice Lab</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODE 1: SECTION 1 FORM FILLING */}
      {/* ------------------------------------------------------------- */}
      {mode === 'section1' && (
        <div className="max-w-2xl mx-auto space-y-5">
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Câu hỏi {s1Index + 1} / {SECTION1_DRILLS.length}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {curS1.label}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300">
                  Điểm: {s1Score}
                </span>
              </div>
            </div>

            {/* Audio Button */}
            <div className="py-2 text-center space-y-3">
              <button
                type="button"
                onClick={playS1Audio}
                className="group inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Nghe audio đề bài"
              >
                <Volume2 size={32} className="group-hover:animate-pulse" />
              </button>
              <div className="text-xs text-muted font-medium">
                Bấm nút để nghe đoạn hội thoại (Phát âm chuẩn UK Accent)
              </div>
            </div>

            {/* Simulated Form Field */}
            <div className="rounded-2xl border border-line bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-2">
              <div className="text-[11px] font-bold uppercase text-muted">
                Ngữ cảnh hội thoại:
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                "{curS1.context}"
              </p>
            </div>

            {/* Input & Check */}
            <div className="space-y-3">
              <div className="flex gap-2">
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
                  placeholder="Nhập thông tin nghe được (ví dụ tên, số, mã bưu chính)..."
                  className={cx(
                    'flex-1 rounded-2xl border-2 px-4 py-3.5 text-base font-bold outline-none transition-all shadow-xs',
                    s1Status === 'correct' && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100',
                    s1Status === 'wrong' && 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100',
                    s1Status === 'unsubmitted' && 'border-line bg-card focus:border-indigo-500 text-ink'
                  )}
                />
                <button
                  type="button"
                  onClick={s1Status === 'unsubmitted' ? handleS1Check : handleS1Next}
                  className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all cursor-pointer whitespace-nowrap"
                >
                  {s1Status === 'unsubmitted' ? 'Kiểm tra' : 'Câu tiếp'}
                </button>
              </div>

              {/* Status Feedback */}
              {s1Status === 'correct' && (
                <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-center animate-in fade-in">
                  <div className="text-sm font-black text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={18} />
                    <span>Chính xác tuyệt đối!</span>
                  </div>
                  <div className="mt-1 font-mono text-base font-bold text-emerald-950 dark:text-emerald-100">
                    Đáp án: {curS1.answer}
                  </div>
                </div>
              )}

              {s1Status === 'wrong' && (
                <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 text-center space-y-1 animate-in fade-in">
                  <div className="text-sm font-black text-rose-700 dark:text-rose-300 flex items-center justify-center gap-1.5">
                    <AlertCircle size={18} />
                    <span>Chưa chính xác!</span>
                  </div>
                  <div className="font-mono text-base font-bold text-rose-950 dark:text-rose-100">
                    Đáp án đúng: {curS1.answer}
                  </div>
                </div>
              )}

              {/* Tips & Strategy */}
              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setS1ShowTip((t) => !t)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <Lightbulb size={13} className={s1ShowTip ? 'text-amber-500' : ''} />
                  <span>{s1ShowTip ? 'Ẩn mẹo làm bài' : 'Xem mẹo tránh bẫy IELTS'}</span>
                </button>
              </div>

              {s1ShowTip && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
                  <b>Mẹo giám khảo:</b> {curS1.tip}
                </div>
              )}
            </div>
          </Card>
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
                  Câu {sdIndex + 1} / {SENTENCE_DICTATIONS.length} · {curSd.context}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {curSd.title}
                </h3>
              </div>

              {/* Audio Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSdAccent((a) => (a === 'UK' ? 'US' : 'UK'))}
                  className="rounded-xl border border-line bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-indigo-400 transition-colors cursor-pointer"
                >
                  Giọng {sdAccent}
                </button>
                <button
                  onClick={() => setSdRate((r) => (r === 1.0 ? 0.8 : 1.0))}
                  className={cx(
                    'rounded-xl border px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer',
                    sdRate === 0.8
                      ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                      : 'border-line bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  )}
                >
                  {sdRate}x
                </button>
              </div>
            </div>

            {/* Audio Action Button */}
            <div className="py-2 text-center space-y-3">
              <button
                type="button"
                onClick={() => playSdAudio()}
                className="group inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Nghe câu học thuật"
              >
                <Volume2 size={32} className="group-hover:animate-pulse" />
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
                  {sdStatus === 'unsubmitted' ? 'So sánh kết quả' : 'Câu tiếp theo'}
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
