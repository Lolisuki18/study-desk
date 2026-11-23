import { useState, useEffect, useRef } from 'react'
import {
  Mic,
  MicOff,
  Volume2,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Flame,
  Award,
  Layers,
  Info,
  Sliders,
} from 'lucide-react'
import { Card } from '../ui'
import { cx } from '../../utils'
import { speakEnglish, stopSpeaking } from '../../utils/speech'
import { playSound } from '../../utils/sound'
import { playMechSound } from '../../utils/mechSound'
import { haptic } from '../../utils/haptic'
import {
  SPEAKING_PART1_TOPICS,
  SPEAKING_PART2_CUE_CARDS,
  isSpeechRecognitionSupported,
  computePronunciationAccuracy,
  type SpeakingPart1Topic,
  type SpeakingPart2CueCard,
} from '../../services/english/speakingLab'

interface IWindowSpeechRecognition extends Window {
  SpeechRecognition?: any
  webkitSpeechRecognition?: any
}

export function SpeakingLab() {
  const [activeTab, setActiveTab] = useState<'part2' | 'shadowing' | 'part1'>('part2')

  // -----------------------------------------------------------------------------------------------
  // PART 2 CUE CARD STATE
  // -----------------------------------------------------------------------------------------------
  const [selectedCueCard, setSelectedCueCard] = useState<SpeakingPart2CueCard>(SPEAKING_PART2_CUE_CARDS[0])
  const [cuePhase, setCuePhase] = useState<'idle' | 'prep' | 'speaking' | 'review'>('idle')
  const [cueTimeLeft, setCueTimeLeft] = useState(60)
  const [prepNotes, setPrepNotes] = useState('')
  const [cueTimerRunning, setCueTimerRunning] = useState(false)
  const [selectedVocabHighlight, setSelectedVocabHighlight] = useState<string | null>(null)
  const cueIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCuePrep = () => {
    setCuePhase('prep')
    setCueTimeLeft(60)
    setCueTimerRunning(true)
    playSound('fanfare')
    haptic('success')
  }

  const startCueSpeaking = () => {
    setCuePhase('speaking')
    setCueTimeLeft(120)
    setCueTimerRunning(true)
    playSound('fanfare')
    haptic('success')
  }

  const resetCueCard = () => {
    if (cueIntervalRef.current) clearInterval(cueIntervalRef.current)
    setCuePhase('idle')
    setCueTimeLeft(60)
    setCueTimerRunning(false)
    setPrepNotes('')
    stopSpeaking()
  }

  useEffect(() => {
    if (!cueTimerRunning) return

    cueIntervalRef.current = setInterval(() => {
      setCueTimeLeft((prev) => {
        if (prev <= 1) {
          if (cuePhase === 'prep') {
            playSound('fanfare')
            setCuePhase('speaking')
            return 120
          } else if (cuePhase === 'speaking') {
            clearInterval(cueIntervalRef.current!)
            setCueTimerRunning(false)
            setCuePhase('review')
            playSound('fanfare')
            return 0
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (cueIntervalRef.current) clearInterval(cueIntervalRef.current)
    }
  }, [cueTimerRunning, cuePhase])

  // Total seconds for current phase (used for circular progress)
  const totalPhaseSeconds = cuePhase === 'prep' ? 60 : cuePhase === 'speaking' ? 120 : 60
  const timerProgressPct = Math.max(0, Math.min(100, ((totalPhaseSeconds - cueTimeLeft) / totalPhaseSeconds) * 100))

  // -----------------------------------------------------------------------------------------------
  // SHADOWING & MIC STATE
  // -----------------------------------------------------------------------------------------------
  const [micSupported] = useState<boolean>(() => isSpeechRecognitionSupported())
  const [isRecording, setIsRecording] = useState(false)
  const [spokenTranscript, setSpokenTranscript] = useState('')
  const [recognitionScore, setRecognitionScore] = useState<{
    accuracy: number
    matchedWords: string[]
    missingWords: string[]
  } | null>(null)

  const recognitionRef = useRef<any>(null)

  const targetShadowSentence =
    'Technological innovation plays a pivotal role in boosting domestic productivity and international competitiveness.'

  const startMicRecording = () => {
    const win = window as IWindowSpeechRecognition
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition
    if (!SpeechRec) return

    try {
      const recognition = new SpeechRec()
      recognition.lang = 'en-US'
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsRecording(true)
        setSpokenTranscript('')
        setRecognitionScore(null)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setSpokenTranscript(transcript)
        const score = computePronunciationAccuracy(transcript, targetShadowSentence)
        setRecognitionScore(score)
        if (score.accuracy >= 75) {
          playSound('correct')
          haptic('success')
        } else {
          playSound('wrong')
          haptic('error')
        }
      }

      recognition.onerror = () => {
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch {
      setIsRecording(false)
    }
  }

  const stopMicRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
      setIsRecording(false)
    }
  }

  // -----------------------------------------------------------------------------------------------
  // PART 1 STATE
  // -----------------------------------------------------------------------------------------------
  const [selectedP1Topic, setSelectedP1Topic] = useState<SpeakingPart1Topic>(SPEAKING_PART1_TOPICS[0])
  const [p1QuestionIdx, setP1QuestionIdx] = useState(0)
  const [showP1Model, setShowP1Model] = useState(false)

  const curP1Q = selectedP1Topic.questions[p1QuestionIdx]

  useEffect(() => {
    return () => {
      stopSpeaking()
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Top Segmented Sub Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-card p-2 rounded-2xl border border-line shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('part2')}
            className={cx(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'part2'
                ? 'bg-white dark:bg-card text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-muted hover:text-ink'
            )}
          >
            <Clock size={14} />
            <span>IELTS Part 2 (Cue Card Simulator)</span>
          </button>

          <button
            onClick={() => setActiveTab('shadowing')}
            className={cx(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'shadowing'
                ? 'bg-white dark:bg-card text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-muted hover:text-ink'
            )}
          >
            <Mic size={14} />
            <span>Shadowing & Mic Recognition</span>
          </button>

          <button
            onClick={() => setActiveTab('part1')}
            className={cx(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'part1'
                ? 'bg-white dark:bg-card text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-muted hover:text-ink'
            )}
          >
            <Layers size={14} />
            <span>IELTS Part 1 (Phản xạ câu hỏi)</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-muted">
          <Mic size={15} className="text-rose-600 dark:text-rose-400" />
          <span>IELTS Speaking Room</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PART 2: CUE CARD SIMULATOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'part2' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Card Selection */}
          <div className="flex flex-wrap items-center gap-2">
            {SPEAKING_PART2_CUE_CARDS.map((card) => (
              <button
                key={card.id}
                onClick={() => {
                  setSelectedCueCard(card)
                  resetCueCard()
                }}
                className={cx(
                  'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer',
                  selectedCueCard.id === card.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'border border-line bg-card text-muted hover:border-indigo-400'
                )}
              >
                {card.title}
              </button>
            ))}
          </div>

          <div className="relative overflow-hidden rounded-3xl border-2 border-slate-200 dark:border-line bg-white dark:bg-card p-6 sm:p-8 shadow-sm space-y-6">
            {/* Header & Status Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 px-3 py-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                  <Mic size={13} className="text-rose-600 dark:text-rose-400" />
                  <span>IELTS Speaking Part 2 · {selectedCueCard.bandScore}</span>
                </div>
                <h3 className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                  {selectedCueCard.title}
                </h3>
              </div>

              {/* Animated Countdown Dial */}
              <div className="flex items-center gap-3">
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100 dark:text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={cx(
                        'transition-all duration-300',
                        cuePhase === 'prep' && 'text-amber-500',
                        cuePhase === 'speaking' && (cueTimeLeft <= 15 ? 'text-rose-600' : 'text-indigo-600 dark:text-indigo-400'),
                        cuePhase === 'idle' && 'text-slate-300 dark:text-slate-600'
                      )}
                      strokeDasharray={`${timerProgressPct}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center font-mono">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {Math.floor(cueTimeLeft / 60)}:{(cueTimeLeft % 60).toString().padStart(2, '0')}
                    </span>
                    <span className="text-[8px] font-bold uppercase text-muted">
                      {cuePhase === 'prep' ? 'Chuẩn bị' : cuePhase === 'speaking' ? 'Đang nói' : 'Chờ'}
                    </span>
                  </div>
                </div>

                {/* Primary Action Button */}
                {cuePhase === 'idle' && (
                  <button
                    type="button"
                    onClick={startCuePrep}
                    className="flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-5 py-3 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
                  >
                    <Play size={15} fill="white" />
                    <span>Bắt đầu 1 phút chuẩn bị</span>
                  </button>
                )}

                {(cuePhase === 'prep' || cuePhase === 'speaking') && (
                  <button
                    type="button"
                    onClick={resetCueCard}
                    className="p-2.5 rounded-xl border border-line hover:bg-slate-100 dark:hover:bg-slate-800 text-muted transition-colors cursor-pointer"
                    title="Đặt lại phiên thi"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Authentic Cambridge Candidate Cue Card Frame */}
            <div className="rounded-3xl border-2 border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-indigo-50/40 via-white to-sky-50/20 dark:from-indigo-950/20 dark:via-card dark:to-card p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/60 pb-3">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                  CANDIDATE CUE CARD
                </span>
                <span className="text-[10px] text-muted">Part 2 Long Turn</span>
              </div>

              <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                {selectedCueCard.cuePrompt}
              </h4>

              <div className="text-xs font-bold text-muted">You should say:</div>

              <div className="space-y-2">
                {selectedCueCard.bulletPoints.map((bp, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-black mt-0.5">
                      {i + 1}
                    </span>
                    <span>{bp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prep Scratchpad (Active during prep or speaking) */}
            {(cuePhase === 'prep' || cuePhase === 'speaking') && (
              <div className="space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    <span>Sổ ghi chú nháp (Ghi từ khóa chuẩn bị):</span>
                  </span>
                  {cuePhase === 'prep' && (
                    <button
                      type="button"
                      onClick={startCueSpeaking}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Bỏ qua chuẩn bị, bắt đầu nói ngay »
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={prepNotes}
                  onChange={(e) => setPrepNotes(e.target.value)}
                  placeholder="Ghi nhanh từ khóa theo sườn: Mở đầu -> Hoàn cảnh -> Chi tiết chính -> Cảm xúc..."
                  className="w-full rounded-2xl border-2 border-line bg-card p-4 text-xs font-mono text-ink outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>
            )}

            {/* Speaking Framework Guide */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-muted">
                Khung sườn phát triển ý Band 8.0+:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedCueCard.frameworkGuide.map((f, i) => (
                  <div key={i} className="rounded-2xl border border-line bg-slate-50/70 dark:bg-slate-800/40 p-3.5 text-xs space-y-1">
                    <div className="font-extrabold text-indigo-600 dark:text-indigo-400">{f.part}</div>
                    <div className="text-slate-600 dark:text-slate-300 leading-relaxed">{f.prompt}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Answer & Lexical Inspector */}
            <div className="border-t border-line pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Award size={15} className="text-amber-500" />
                  <span>Bài nói mẫu Band 8.0+</span>
                </span>
                <button
                  type="button"
                  onClick={() => speakEnglish(selectedCueCard.modelAnswer, { accent: 'UK', rate: 0.95 })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                >
                  <Volume2 size={15} />
                  <span>Nghe audio mẫu (UK)</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-line font-serif">
                "{selectedCueCard.modelAnswer}"
              </p>

              {/* Interactive Lexical Highlights Chips */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-muted flex items-center gap-1">
                  <Info size={12} />
                  <span>Bấm vào từ vựng ăn điểm để nghe phát âm riêng:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedCueCard.lexicalHighlights.map((w, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedVocabHighlight(w)
                        speakEnglish(w, { accent: 'UK' })
                      }}
                      className={cx(
                        'rounded-xl border px-3 py-1 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                        selectedVocabHighlight === w
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                          : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:scale-105'
                      )}
                    >
                      <Volume2 size={12} />
                      <span>{w}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SHADOWING WITH MIC SPEECH RECOGNITION */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'shadowing' && (
        <div className="max-w-2xl mx-auto space-y-5">
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="border-b border-line pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Speech Recognition & Shadowing Lab
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                Luyện phát âm & Đo độ chính xác qua Micro
              </h3>
              <p className="text-xs text-muted mt-1">
                Nghe câu mẫu chuẩn bản ngữ, sau đó bấm Microphone và đọc to câu tiếng Anh để hệ thống phân tích phát âm trực tiếp.
              </p>
            </div>

            {/* Target Sentence Card */}
            <div className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/30 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                  Câu mục tiêu cần đọc:
                </span>
                <button
                  type="button"
                  onClick={() => speakEnglish(targetShadowSentence, { accent: 'US', rate: 0.9 })}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <Volume2 size={14} />
                  <span>Nghe mẫu</span>
                </button>
              </div>

              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                "{targetShadowSentence}"
              </div>
            </div>

            {/* Microphone Action */}
            <div className="py-4 text-center space-y-3">
              {micSupported ? (
                <div>
                  <div className="relative inline-flex items-center justify-center">
                    {isRecording && (
                      <div className="absolute -inset-3 rounded-full bg-rose-500/30 blur-md animate-ping" />
                    )}
                    <button
                      type="button"
                      onClick={isRecording ? stopMicRecording : startMicRecording}
                      className={cx(
                        'relative inline-flex h-20 w-20 items-center justify-center rounded-3xl text-white shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer',
                        isRecording
                          ? 'bg-rose-600 shadow-rose-500/40'
                          : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-indigo-500/25'
                      )}
                      title={isRecording ? 'Bấm để dừng ghi âm' : 'Bấm để nói'}
                    >
                      {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
                    </button>
                  </div>
                  <div className="text-xs text-muted font-medium mt-3">
                    {isRecording ? 'Đang lắng nghe... Hãy đọc to câu trên vào Micro' : 'Bấm vào Micro và đọc to câu mẫu'}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs text-amber-800 dark:text-amber-200">
                  Trình duyệt hiện tại chưa hỗ trợ Web Speech Recognition API. Bạn vẫn có thể bấm nút loa nghe câu mẫu và luyện đọc Shadowing thành tiếng!
                </div>
              )}
            </div>

            {/* Transcript & Scoring */}
            {spokenTranscript && (
              <div className="rounded-2xl border border-line bg-slate-50 dark:bg-slate-800/40 p-5 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-muted">Âm thanh máy nhận diện được:</span>
                  {recognitionScore && (
                    <span
                      className={cx(
                        'font-black font-mono text-sm',
                        recognitionScore.accuracy >= 75
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      )}
                    >
                      Độ chính xác: {recognitionScore.accuracy}%
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-slate-900 dark:text-white italic">
                  "{spokenTranscript}"
                </p>

                {recognitionScore && recognitionScore.missingWords.length > 0 && (
                  <div className="text-xs text-muted pt-1 border-t border-line/60">
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">Từ chưa nhận diện rõ: </span>
                    <span className="font-mono">{recognitionScore.missingWords.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PART 1: TOPICS & MODEL ANSWERS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'part1' && (
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {SPEAKING_PART1_TOPICS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedP1Topic(t)
                  setP1QuestionIdx(0)
                  setShowP1Model(false)
                }}
                className={cx(
                  'rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer',
                  selectedP1Topic.id === t.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'border border-line bg-card text-muted hover:border-indigo-400'
                )}
              >
                {t.topic}
              </button>
            ))}
          </div>

          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Chủ đề: {selectedP1Topic.topic}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Câu hỏi {p1QuestionIdx + 1} / {selectedP1Topic.questions.length}
                </h3>
              </div>

              <div className="flex items-center gap-1">
                {selectedP1Topic.questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setP1QuestionIdx(i)
                      setShowP1Model(false)
                    }}
                    className={cx(
                      'h-7 w-7 rounded-lg text-xs font-bold transition-all cursor-pointer',
                      p1QuestionIdx === i
                        ? 'bg-indigo-600 text-white'
                        : 'border border-line bg-card text-muted hover:text-ink'
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Question */}
            <div className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 p-5 space-y-2">
              <div className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                Examiner:
              </div>
              <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                "{curP1Q.question}"
              </div>
            </div>

            {/* Examiner Tip */}
            <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200">
              <b>Lời khuyên thi cử:</b> {selectedP1Topic.examinerTip}
            </div>

            {/* Model Answer Toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowP1Model((m) => !m)}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
                >
                  {showP1Model ? 'Ẩn câu trả lời mẫu' : 'Xem câu trả lời Band 8.0+'}
                </button>

                {showP1Model && (
                  <button
                    type="button"
                    onClick={() => speakEnglish(curP1Q.modelAnswer, { accent: 'US', rate: 0.95 })}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <Volume2 size={14} />
                    <span>Nghe audio US</span>
                  </button>
                )}
              </div>

              {showP1Model && (
                <div className="rounded-2xl border border-line bg-slate-50 dark:bg-slate-800/40 p-5 space-y-3 animate-in fade-in">
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Model Answer (Band 8.0+):
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-medium">
                    "{curP1Q.modelAnswer}"
                  </p>
                  <p className="text-xs text-muted italic border-t border-line/60 pt-2">
                    Dịch nghĩa: {curP1Q.translation}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-muted">Cụm từ ghi điểm:</span>
                    {curP1Q.keyVocab.map((v, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-indigo-100 dark:bg-indigo-950/60 px-2 py-0.5 text-[10px] font-semibold text-indigo-800 dark:text-indigo-300"
                      >
                        {v}
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
