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
} from 'lucide-react'
import { Card } from '../ui'
import { cx } from '../../utils'
import { speakEnglish, stopSpeaking } from '../../utils/speech'
import { playSound } from '../../utils/sound'
import { playMechSound } from '../../utils/mechSound'
import {
  SPEAKING_PART1_TOPICS,
  SPEAKING_PART2_CUE_CARDS,
  isSpeechRecognitionSupported,
  computePronunciationAccuracy,
  type SpeakingPart1Topic,
  type SpeakingPart2CueCard,
} from '../../services/english/speakingLab'

// Types for SpeechRecognition
interface IWindowSpeechRecognition extends Window {
  SpeechRecognition?: any
  webkitSpeechRecognition?: any
}

export function SpeakingLab() {
  const [activeTab, setActiveTab] = useState<'part1' | 'part2' | 'shadowing'>('part2')

  // -----------------------------------------------------------------------------------------------
  // PART 1 STATE
  // -----------------------------------------------------------------------------------------------
  const [selectedP1Topic, setSelectedP1Topic] = useState<SpeakingPart1Topic>(SPEAKING_PART1_TOPICS[0])
  const [p1QuestionIdx, setP1QuestionIdx] = useState(0)
  const [showP1Model, setShowP1Model] = useState(false)

  const curP1Q = selectedP1Topic.questions[p1QuestionIdx]

  // -----------------------------------------------------------------------------------------------
  // PART 2 CUE CARD STATE
  // -----------------------------------------------------------------------------------------------
  const [selectedCueCard, setSelectedCueCard] = useState<SpeakingPart2CueCard>(SPEAKING_PART2_CUE_CARDS[0])
  const [cuePhase, setCuePhase] = useState<'idle' | 'prep' | 'speaking' | 'review'>('idle')
  const [cueTimeLeft, setCueTimeLeft] = useState(60)
  const [prepNotes, setPrepNotes] = useState('')
  const [cueTimerRunning, setCueTimerRunning] = useState(false)
  const cueIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCuePrep = () => {
    setCuePhase('prep')
    setCueTimeLeft(60)
    setCueTimerRunning(true)
    playSound('fanfare')
  }

  const startCueSpeaking = () => {
    setCuePhase('speaking')
    setCueTimeLeft(120)
    setCueTimerRunning(true)
    playSound('fanfare')
  }

  const resetCueCard = () => {
    if (cueIntervalRef.current) clearInterval(cueIntervalRef.current)
    setCuePhase('idle')
    setCueTimeLeft(60)
    setCueTimerRunning(false)
    setPrepNotes('')
  }

  useEffect(() => {
    if (!cueTimerRunning) return

    cueIntervalRef.current = setInterval(() => {
      setCueTimeLeft((prev) => {
        if (prev <= 1) {
          if (cuePhase === 'prep') {
            // Auto transition to speaking phase
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

  // -----------------------------------------------------------------------------------------------
  // SHADOWING & MIC SPEECH RECOGNITION STATE
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
        } else {
          playSound('wrong')
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

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-2xl border border-line">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('part2')}
            className={cx(
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
              activeTab === 'part2'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-muted hover:text-ink'
            )}
          >
            IELTS Part 2 (Phòng thi Cue Card & Đồng hồ 60s/120s)
          </button>
          <button
            onClick={() => setActiveTab('shadowing')}
            className={cx(
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
              activeTab === 'shadowing'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-muted hover:text-ink'
            )}
          >
            Luyện Shadowing & Đo phát âm Mic
          </button>
          <button
            onClick={() => setActiveTab('part1')}
            className={cx(
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
              activeTab === 'part1'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-muted hover:text-ink'
            )}
          >
            IELTS Part 1 (Phản xạ câu hỏi thường gặp)
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-muted">
          <Mic size={15} className="text-indigo-600 dark:text-indigo-400" />
          <span>IELTS Speaking Practice Suite</span>
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
                  'rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer',
                  selectedCueCard.id === card.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'border border-line bg-card text-muted hover:border-indigo-400'
                )}
              >
                {card.title}
              </button>
            ))}
          </div>

          <Card className="p-6 sm:p-8 space-y-6">
            {/* Header & Status Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">
                  IELTS Speaking Part 2 · {selectedCueCard.bandScore}
                </span>
                <h3 className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                  {selectedCueCard.title}
                </h3>
              </div>

              {/* Timer Pill */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-muted">
                    {cuePhase === 'prep' && 'Thời gian chuẩn bị'}
                    {cuePhase === 'speaking' && 'Thời gian nói'}
                    {cuePhase === 'idle' && 'Chuẩn bị / Nói'}
                    {cuePhase === 'review' && 'Hoàn thành'}
                  </div>
                  <div className={cx(
                    'font-mono text-2xl font-black',
                    cueTimeLeft <= 10 && cuePhase !== 'idle' ? 'text-rose-600 animate-pulse' : 'text-indigo-600 dark:text-indigo-400'
                  )}>
                    {cuePhase === 'idle' ? '01:00' : `${Math.floor(cueTimeLeft / 60).toString().padStart(2, '0')}:${(cueTimeLeft % 60).toString().padStart(2, '0')}`}
                  </div>
                </div>

                {cuePhase === 'idle' && (
                  <button
                    type="button"
                    onClick={startCuePrep}
                    className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
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
                    title="Đặt lại"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Prompt Box */}
            <div className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 p-5 space-y-3">
              <h4 className="text-sm font-extrabold text-indigo-950 dark:text-indigo-200">
                {selectedCueCard.cuePrompt}
              </h4>
              <div className="text-xs font-bold text-muted">You should say:</div>
              <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
                {selectedCueCard.bulletPoints.map((bp, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    <span>{bp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prep Scratchpad (Active during prep or speaking) */}
            {(cuePhase === 'prep' || cuePhase === 'speaking') && (
              <div className="space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Sổ ghi chú nháp (Scratchpad - Bạn có 60s để ghi từ khóa):
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
                  className="w-full rounded-2xl border-2 border-line bg-card p-3.5 text-xs text-ink outline-none focus:border-indigo-500 font-mono shadow-xs"
                />
              </div>
            )}

            {/* Framework Outline Guide */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-muted">
                Khung sườn triển khai Band 8.0:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedCueCard.frameworkGuide.map((f, i) => (
                  <div key={i} className="rounded-xl border border-line bg-slate-50 dark:bg-slate-800/60 p-3 text-xs">
                    <div className="font-bold text-indigo-600 dark:text-indigo-400">{f.part}</div>
                    <div className="text-muted mt-0.5">{f.prompt}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Answer (Revealed or available in Review) */}
            <div className="border-t border-line pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Bài nói mẫu Band 8.0+ & Giọng đọc bản xứ
                </span>
                <button
                  type="button"
                  onClick={() => speakEnglish(selectedCueCard.modelAnswer, { accent: 'UK', rate: 0.95 })}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <Volume2 size={15} />
                  <span>Nghe đọc mẫu UK</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-line">
                "{selectedCueCard.modelAnswer}"
              </p>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-muted mr-1">Từ vựng ăn điểm:</span>
                {selectedCueCard.lexicalHighlights.map((w, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SHADOWING WITH MIC SPEECH RECOGNITION */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'shadowing' && (
        <div className="max-w-2xl mx-auto space-y-5">
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="border-b border-line pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Speech Recognition & Shadowing Lab
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                Luyện phát âm & Đo độ chính xác qua Mic
              </h3>
              <p className="text-xs text-muted mt-1">
                Nghe câu mẫu chuẩn bản ngữ, sau đó bấm Microphone và đọc to câu tiếng Anh để hệ thống phân tích phát âm trực tiếp.
              </p>
            </div>

            {/* Target Sentence Card */}
            <div className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/30 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                  Câu mục tiêu:
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
                  <button
                    type="button"
                    onClick={isRecording ? stopMicRecording : startMicRecording}
                    className={cx(
                      'inline-flex h-20 w-20 items-center justify-center rounded-3xl text-white shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer',
                      isRecording
                        ? 'bg-rose-600 shadow-rose-500/30 animate-pulse'
                        : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-indigo-500/25'
                    )}
                    title={isRecording ? 'Bấm để dừng ghi âm' : 'Bấm để nói'}
                  >
                    {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
                  </button>
                  <div className="text-xs text-muted font-medium mt-3">
                    {isRecording ? 'Đang lắng nghe... Hãy đọc to câu trên vào Microphone' : 'Bấm vào Micro và đọc to câu mẫu'}
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
                    <span className={cx(
                      'font-black font-mono text-sm',
                      recognitionScore.accuracy >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    )}>
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
