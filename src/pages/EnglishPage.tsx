import { useMemo, useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookA,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Headphones,
  Languages,
  Layers,
  Lightbulb,
  ListChecks,
  Mic,
  PenLine,
  PenTool,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Volume2,
  X,
} from 'lucide-react'
import { collections } from '../data'
import { useProgress } from '../features/learning/ProgressContext'
import { Card, Empty, PageHeader, ProgressBar } from '../components/ui'
import { cx, pct, shuffle } from '../utils'
import { speakEnglish, stopSpeaking } from '../utils/speech'
import { playSound } from '../utils/sound'
import { playMechSound } from '../utils/mechSound'
import { haptic } from '../utils/haptic'
import { fireConfetti } from '../utils/confetti'
import {
  computeSpellingDiff,
  type DiffPart,
} from '../services/english/diff'
import {
  getEnglishCollections,
  getEnglishEntries,
  getAllCollocations,
  getIeltsTargetBand,
  setIeltsTargetBand,
  getSpellingMistakes,
  recordSpellingMistake,
  removeSpellingMistake,
  type IeltsBandTarget,
  type CollocationPair,
  type SpellingMistakeRecord,
} from '../services/english/ielts'
import type { Item, VocabularyContent } from '../types'
import { ListeningLab } from '../components/english/ListeningLab'
import { SpeakingLab } from '../components/english/SpeakingLab'
import { ReadingLab } from '../components/english/ReadingLab'
import { WritingLab } from '../components/english/WritingLab'

type HubTab =
  | 'overview'
  | 'listening'
  | 'speaking'
  | 'reading'
  | 'writing'
  | 'dictation'
  | 'collocations'
  | 'speed'
  | 'mistakes'

export default function EnglishPage() {
  const { get } = useProgress()
  const [activeTab, setActiveTab] = useState<HubTab>('overview')
  const [targetBand, setTargetBandState] = useState<IeltsBandTarget>(() => getIeltsTargetBand())

  const handleBandChange = (b: IeltsBandTarget) => {
    setTargetBandState(b)
    setIeltsTargetBand(b)
  }

  // Collections & Entries
  const englishCols = useMemo(() => getEnglishCollections(), [])
  const englishEntries = useMemo(() => getEnglishEntries(), [])
  const collocations = useMemo(() => getAllCollocations(), [])

  // Mastered count for English
  const masteredCount = useMemo(() => {
    let count = 0
    for (const e of englishEntries) {
      const p = get(e.collection.id, e.item.id)
      if (p?.status === 'known') count++
    }
    return count
  }, [englishEntries, get])

  const masteryPct = pct(masteredCount, Math.max(1, englishEntries.length))

  // ---------------------------------------------------------------------------------------------
  // DICTATION LAB STATE (VOCABULARY SPELLING)
  // ---------------------------------------------------------------------------------------------
  const [dictationPool, setDictationPool] = useState<typeof englishEntries>([])
  const [dictIndex, setDictIndex] = useState(0)
  const [dictInput, setDictInput] = useState('')
  const [dictRate, setDictRate] = useState<number>(1.0)
  const [dictAccent, setDictAccent] = useState<'US' | 'UK'>('US')
  const [dictStatus, setDictStatus] = useState<'unsubmitted' | 'correct' | 'wrong'>('unsubmitted')
  const [dictDiff, setDictDiff] = useState<DiffPart[]>([])
  const [dictStreak, setDictStreak] = useState(0)
  const [dictShowHint, setDictShowHint] = useState(false)
  const [dictCompletedCount, setDictCompletedCount] = useState(0)

  useEffect(() => {
    if (!dictationPool.length && englishEntries.length) {
      setDictationPool(shuffle(englishEntries))
      setDictIndex(0)
    }
  }, [englishEntries, dictationPool.length])

  const curDictEntry = dictationPool[dictIndex]
  const curVocab = curDictEntry?.item.content as VocabularyContent | undefined

  const playDictWord = (accent: 'US' | 'UK' = dictAccent, rate: number = dictRate) => {
    if (!curVocab) return
    speakEnglish(curVocab.term, { accent, rate })
  }

  useEffect(() => {
    setDictInput('')
    setDictStatus('unsubmitted')
    setDictDiff([])
    setDictShowHint(false)
    if (activeTab === 'dictation' && curVocab) {
      const timer = setTimeout(() => {
        playDictWord(dictAccent, dictRate)
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [dictIndex, activeTab])

  const checkDictation = () => {
    if (!curVocab) return
    const expected = curVocab.term.trim().toLowerCase()
    const typed = dictInput.trim().toLowerCase()

    if (typed === expected) {
      setDictStatus('correct')
      setDictStreak((s) => s + 1)
      setDictCompletedCount((c) => c + 1)
      playSound('correct')
      playMechSound('enter')
      haptic('success')

      removeSpellingMistake(curVocab.term)

      setTimeout(() => {
        nextDictation()
      }, 1200)
    } else {
      setDictStatus('wrong')
      setDictStreak(0)
      playSound('wrong')
      haptic('error')

      const diffResult = computeSpellingDiff(typed, expected)
      setDictDiff(diffResult.parts)

      recordSpellingMistake(curVocab.term, dictInput.trim(), curVocab.meaning)
    }
  }

  const nextDictation = () => {
    if (dictIndex < dictationPool.length - 1) {
      setDictIndex((i) => i + 1)
    } else {
      setDictationPool(shuffle(englishEntries))
      setDictIndex(0)
    }
  }

  // ---------------------------------------------------------------------------------------------
  // COLLOCATIONS STATE
  // ---------------------------------------------------------------------------------------------
  const [collocSearch, setCollocSearch] = useState('')
  const filteredCollocations = useMemo(() => {
    if (!collocSearch.trim()) return collocations
    const q = collocSearch.toLowerCase()
    return collocations.filter(
      (c) =>
        c.collocation.toLowerCase().includes(q) ||
        c.meaning.toLowerCase().includes(q) ||
        c.term.toLowerCase().includes(q)
    )
  }, [collocations, collocSearch])

  // ---------------------------------------------------------------------------------------------
  // 60-SECOND VOCABULARY SPRINT STATE
  // ---------------------------------------------------------------------------------------------
  const [sprintRunning, setSprintRunning] = useState(false)
  const [sprintTimeLeft, setSprintTimeLeft] = useState(60)
  const [sprintScore, setSprintScore] = useState(0)
  const [sprintStreak, setSprintStreak] = useState(0)
  const [sprintHigh, setSprintHigh] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('psh.ielts.sprint_high') || 0)
    } catch {
      return 0
    }
  })
  const [sprintCur, setSprintCur] = useState<{
    word: string
    pronunciation?: string
    correct: string
    options: string[]
  } | null>(null)

  const sprintTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const generateSprintQuestion = () => {
    if (englishEntries.length < 4) return
    const chosen = englishEntries[Math.floor(Math.random() * englishEntries.length)]
    const it = chosen.item.content as VocabularyContent
    const distractors = shuffle(englishEntries.filter((e) => e.item.id !== chosen.item.id))
      .slice(0, 3)
      .map((e) => (e.item.content as VocabularyContent).meaning)

    const options = shuffle([it.meaning, ...distractors])

    setSprintCur({
      word: it.term,
      pronunciation: it.pronunciation,
      correct: it.meaning,
      options,
    })
  }

  const startSprint = () => {
    setSprintScore(0)
    setSprintStreak(0)
    setSprintTimeLeft(60)
    setSprintRunning(true)
    generateSprintQuestion()

    if (sprintTimerRef.current) clearInterval(sprintTimerRef.current)
    sprintTimerRef.current = setInterval(() => {
      setSprintTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(sprintTimerRef.current!)
          setSprintRunning(false)
          playSound('fanfare')
          fireConfetti()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSprintPick = (chosenMeaning: string) => {
    if (!sprintCur || !sprintRunning) return
    if (chosenMeaning === sprintCur.correct) {
      playSound('correct')
      playMechSound('keydown')
      setSprintScore((s) => {
        const next = s + 1
        if (next > sprintHigh) {
          setSprintHigh(next)
          try {
            localStorage.setItem('psh.ielts.sprint_high', String(next))
          } catch {}
        }
        return next
      })
      setSprintStreak((s) => s + 1)
      generateSprintQuestion()
    } else {
      playSound('wrong')
      haptic('error')
      setSprintStreak(0)
      generateSprintQuestion()
    }
  }

  useEffect(() => {
    return () => {
      if (sprintTimerRef.current) clearInterval(sprintTimerRef.current)
    }
  }, [])

  // ---------------------------------------------------------------------------------------------
  // SPELLING MISTAKES LIST
  // ---------------------------------------------------------------------------------------------
  const [mistakesList, setMistakesList] = useState<SpellingMistakeRecord[]>(() =>
    getSpellingMistakes()
  )

  const handleRemoveMistake = (term: string) => {
    removeSpellingMistake(term)
    setMistakesList(getSpellingMistakes())
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-100/90 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/40 dark:from-slate-900/90 dark:via-slate-900 dark:to-indigo-950/40 p-6 sm:p-7 shadow-[0_4px_20px_rgba(99,102,241,0.06)] dark:shadow-none transition-colors">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-400/10 dark:bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-sky-400/10 dark:bg-sky-500/10 blur-2xl" />

        <div className="relative z-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 shadow-2xs">
              <Languages size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>Chuyên mục IELTS & Academic English</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Trung tâm Luyện thi IELTS Toàn diện 4 Kỹ năng
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Trạm luyện thi chuẩn hóa cả 4 kỹ năng Nghe - Nói - Đọc - Viết: Luyện điền form Section 1, phòng thi nói Cue Card 60s/120s, chuyên đề Đọc True/False/Not Given và phòng Viết chấm từ vựng học thuật AWL.
            </p>

            {/* Target Band Picker */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Target size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>Mục tiêu Band điểm:</span>
              </span>
              {(['6.0', '6.5', '7.0', '7.5', '8.0+'] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => handleBandChange(b)}
                  className={cx(
                    'rounded-xl px-2.5 py-1 text-xs font-extrabold transition-all cursor-pointer shadow-2xs',
                    targetBand === b
                      ? 'bg-indigo-600 text-white shadow-xs scale-105'
                      : 'border border-slate-200 dark:border-line bg-white/80 dark:bg-card text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                  )}
                >
                  Band {b}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="rounded-2xl border border-slate-200 dark:border-line bg-white/90 dark:bg-card p-3.5 shadow-2xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Từ vựng IELTS
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {englishEntries.length}
              </div>
              <div className="mt-0.5 text-[10px] text-muted">
                Đã thuộc {masteredCount} ({masteryPct}%)
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-line bg-white/90 dark:bg-card p-3.5 shadow-2xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Collocations
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {collocations.length}
              </div>
              <div className="mt-0.5 text-[10px] text-muted">Cụm từ Band 7.0+</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary 4-Skill Navigation Tabs */}
      <div className="space-y-2 border-b border-line pb-3">
        {/* Row 1: The 4 Core Skills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('listening')}
            className={cx(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer',
              activeTab === 'listening'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'border border-line bg-card text-muted hover:text-ink hover:border-indigo-300'
            )}
          >
            <Headphones size={16} />
            <span>Kỹ năng Nghe (Listening)</span>
          </button>

          <button
            onClick={() => setActiveTab('speaking')}
            className={cx(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer',
              activeTab === 'speaking'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'border border-line bg-card text-muted hover:text-ink hover:border-indigo-300'
            )}
          >
            <Mic size={16} />
            <span>Kỹ năng Nói (Speaking)</span>
          </button>

          <button
            onClick={() => setActiveTab('reading')}
            className={cx(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer',
              activeTab === 'reading'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'border border-line bg-card text-muted hover:text-ink hover:border-indigo-300'
            )}
          >
            <BookOpen size={16} />
            <span>Kỹ năng Đọc (Reading)</span>
          </button>

          <button
            onClick={() => setActiveTab('writing')}
            className={cx(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer',
              activeTab === 'writing'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'border border-line bg-card text-muted hover:text-ink hover:border-indigo-300'
            )}
          >
            <PenTool size={16} />
            <span>Kỹ năng Viết (Writing)</span>
          </button>
        </div>

        {/* Row 2: Secondary / Supporting Tools */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={cx(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'overview'
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-2xs'
                : 'text-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <Layers size={13} />
            <span>Kho Bộ đề ({englishCols.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('dictation')}
            className={cx(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'dictation'
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-2xs'
                : 'text-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <PenLine size={13} />
            <span>Chính tả từ vựng</span>
          </button>

          <button
            onClick={() => setActiveTab('collocations')}
            className={cx(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'collocations'
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-2xs'
                : 'text-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <BookA size={13} />
            <span>Collocations ({collocations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('speed')}
            className={cx(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'speed'
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-2xs'
                : 'text-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <Flame size={13} />
            <span>Phản xạ 60s</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('mistakes')
              setMistakesList(getSpellingMistakes())
            }}
            className={cx(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'mistakes'
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-2xs'
                : 'text-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <RotateCcw size={13} />
            <span>Sổ từ bẫy ({mistakesList.length})</span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------------------------------- */}
      {/* 4 CORE SKILL LABS */}
      {/* ----------------------------------------------------------------------------------------- */}
      {activeTab === 'listening' && <ListeningLab />}
      {activeTab === 'speaking' && <SpeakingLab />}
      {activeTab === 'reading' && <ReadingLab />}
      {activeTab === 'writing' && <WritingLab />}

      {/* ----------------------------------------------------------------------------------------- */}
      {/* TAB: OVERVIEW & COLLECTIONS */}
      {/* ----------------------------------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Flashcard Link for All English */}
          <Link to="/flashcards/oxford-ielts-core" className="block group">
            <div className="relative overflow-hidden rounded-3xl border border-indigo-100/90 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/40 dark:from-slate-900/90 dark:via-slate-900 dark:to-indigo-950/40 p-5 sm:p-6 shadow-[0_4px_20px_rgba(99,102,241,0.06)] dark:shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800">
              <div className="relative z-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                      Ôn luyện Thẻ ghi nhớ Tiếng Anh ngay
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                      Lật thẻ từ vựng với đầy đủ phiên âm IPA, giọng đọc chuẩn US/UK, câu ví dụ thực tế và chế độ gõ kiểm tra chính tả trực tiếp.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/25 transition-all group-hover:shadow-lg group-hover:shadow-indigo-500/35 group-hover:translate-x-0.5">
                  <span>Học Flashcards</span>
                  <ArrowRight size={15} />
                </div>
              </div>
            </div>
          </Link>

          {/* IELTS Collections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {englishCols.map((c) => (
              <Card
                key={c.id}
                className="flex flex-col justify-between p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      {c.contentType === 'vocabulary' ? 'Từ vựng' : 'Trắc nghiệm'}
                    </span>
                    <span className="text-xs font-mono font-semibold text-muted">
                      {c.items.length} mục
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                    {c.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-muted leading-relaxed line-clamp-3">
                    {c.description}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-line/60 flex items-center justify-between gap-2">
                  <Link
                    to={`/flashcards/${c.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <span>Lật thẻ</span>
                    <ArrowRight size={13} />
                  </Link>

                  <Link
                    to={`/quiz/${c.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-line px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span>Trắc nghiệm</span>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------------------------- */}
      {/* TAB: VOCABULARY DICTATION */}
      {/* ----------------------------------------------------------------------------------------- */}
      {activeTab === 'dictation' && (
        <div className="max-w-2xl mx-auto space-y-5">
          <Card className="p-6 sm:p-8 space-y-6">
            {/* Top Toolbar in Dictation */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                  {dictIndex + 1}
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  / {dictationPool.length} từ
                </span>
                {dictStreak > 1 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-950/60 px-2 py-0.5 text-[10px] font-black text-orange-600 dark:text-orange-400 animate-bounce">
                    <Flame size={12} className="fill-orange-500" />
                    <span>Chuỗi {dictStreak}</span>
                  </span>
                )}
              </div>

              {/* Accent & Speed controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDictAccent((a) => (a === 'US' ? 'UK' : 'US'))}
                  className="rounded-xl border border-line bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-indigo-400 transition-colors cursor-pointer"
                  title="Đổi giọng đọc US / UK"
                >
                  Giọng {dictAccent}
                </button>

                <button
                  onClick={() => setDictRate((r) => (r === 1.0 ? 0.8 : 1.0))}
                  className={cx(
                    'rounded-xl border px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer',
                    dictRate === 0.8
                      ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                      : 'border-line bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  )}
                  title="Tốc độ đọc (1.0x chuẩn, 0.8x chậm)"
                >
                  {dictRate}x {dictRate === 0.8 ? '(Chậm)' : ''}
                </button>
              </div>
            </div>

            {/* Main Audio Speaker Action */}
            <div className="py-4 text-center space-y-3">
              <button
                type="button"
                onClick={() => playDictWord(dictAccent, dictRate)}
                className="group relative inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Bấm để nghe phát âm từ vựng"
              >
                <Volume2 size={32} className="group-hover:animate-pulse" />
                <span className="sr-only">Nghe phát âm</span>
              </button>
              <div className="text-xs text-muted font-medium">
                Bấm nút loa để nghe lại âm thanh (Phím tắt: Enter sau khi gõ)
              </div>
            </div>

            {/* Hint & Meaning Info */}
            <div className="rounded-2xl border border-slate-100 dark:border-line bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-1.5 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Nghĩa từ vựng
              </div>
              <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                {curVocab?.meaning}
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                {curVocab?.partOfSpeech && (
                  <span className="rounded-full bg-slate-200/80 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    {curVocab.partOfSpeech}
                  </span>
                )}
                <span className="text-xs font-mono text-muted">
                  Độ dài: {curVocab?.term.length} ký tự
                </span>
              </div>
            </div>

            {/* Spelling Input Form */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={dictInput}
                  onChange={(e) => {
                    setDictInput(e.target.value)
                    if (dictStatus !== 'unsubmitted') setDictStatus('unsubmitted')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (dictStatus === 'unsubmitted' && dictInput.trim()) checkDictation()
                      else if (dictStatus !== 'unsubmitted') nextDictation()
                    }
                  }}
                  placeholder="Gõ từ tiếng Anh bạn nghe được…"
                  className={cx(
                    'flex-1 rounded-2xl border-2 px-4 py-3.5 text-base sm:text-lg font-bold outline-none transition-all shadow-xs',
                    dictStatus === 'correct' &&
                      'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100',
                    dictStatus === 'wrong' &&
                      'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100',
                    dictStatus === 'unsubmitted' && 'border-line bg-card focus:border-indigo-500 text-ink'
                  )}
                />
                <button
                  type="button"
                  onClick={dictStatus === 'unsubmitted' ? checkDictation : nextDictation}
                  className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all cursor-pointer whitespace-nowrap"
                >
                  {dictStatus === 'unsubmitted' ? 'Kiểm tra' : 'Từ tiếp'}
                </button>
              </div>

              {/* Feedback & Letter-Level Diff Result */}
              {dictStatus === 'correct' && (
                <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-center animate-in fade-in">
                  <div className="text-sm font-black text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={18} />
                    <span>Chính xác 100%!</span>
                  </div>
                  <div className="mt-1 font-mono text-base font-bold text-emerald-950 dark:text-emerald-100">
                    {curVocab?.term} {curVocab?.pronunciation ? `· ${curVocab.pronunciation}` : ''}
                  </div>
                </div>
              )}

              {dictStatus === 'wrong' && (
                <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 space-y-2 animate-in fade-in">
                  <div className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center justify-between">
                    <span>So sánh chi tiết ký tự bị sai / thiếu:</span>
                    <span className="font-mono text-[10px]">Đáp án: {curVocab?.term}</span>
                  </div>

                  {/* Visual Letter Diff */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 py-1">
                    {dictDiff.map((part, i) => (
                      <span
                        key={i}
                        className={cx(
                          'inline-flex h-8 min-w-8 items-center justify-center rounded-lg font-mono text-sm font-bold px-1.5 border',
                          part.status === 'correct' &&
                            'border-emerald-300 bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100',
                          part.status === 'missing' &&
                            'border-amber-400 bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100 underline decoration-2',
                          part.status === 'extra' &&
                            'border-rose-400 bg-rose-100 text-rose-900 line-through dark:bg-rose-900/60 dark:text-rose-100',
                          part.status === 'wrong' &&
                            'border-rose-500 bg-rose-200 text-rose-950 font-black dark:bg-rose-900 dark:text-rose-100'
                        )}
                        title={`Ký tự: ${part.char} (${part.status})`}
                      >
                        {part.char}
                      </span>
                    ))}
                  </div>

                  <p className="text-[11px] text-rose-700 dark:text-rose-400 text-center">
                    Từ này đã được lưu vào <b>Sổ từ bẫy chính tả</b> để ôn lại. Nhấn <b>Enter</b> để sang câu tiếp theo.
                  </p>
                </div>
              )}

              {/* Peek Hint button */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setDictShowHint((h) => !h)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <Lightbulb size={13} className={dictShowHint ? 'text-amber-500' : ''} />
                  <span>{dictShowHint ? 'Ẩn gợi ý ký tự' : 'Gợi ý chữ cái đầu & cuối'}</span>
                </button>

                {dictShowHint && curVocab && (
                  <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-300">
                    {curVocab.term[0]}
                    {'_ '.repeat(Math.max(1, curVocab.term.length - 2))}
                    {curVocab.term[curVocab.term.length - 1]}
                  </span>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ----------------------------------------------------------------------------------------- */}
      {/* TAB: COLLOCATIONS BROWSER */}
      {/* ----------------------------------------------------------------------------------------- */}
      {activeTab === 'collocations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={collocSearch}
                onChange={(e) => setCollocSearch(e.target.value)}
                placeholder="Tìm cụm Collocations theo từ hoặc nghĩa..."
                className="w-full rounded-2xl border border-line bg-card py-2 pl-10 pr-3 text-xs text-ink outline-none focus:border-indigo-500"
              />
            </div>
            <div className="text-xs text-muted font-medium">
              Tìm thấy {filteredCollocations.length} cụm từ học thuật
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredCollocations.map((c) => (
              <Card
                key={c.id}
                className="p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-base sm:text-lg font-black text-indigo-700 dark:text-indigo-300 leading-snug group-hover:text-indigo-600 transition-colors">
                      {c.collocation}
                    </span>
                    <button
                      type="button"
                      onClick={() => speakEnglish(c.collocation, { accent: 'US' })}
                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                      title="Nghe phát âm cụm từ"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>

                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {c.meaning}
                  </p>

                  {c.example && (
                    <p className="mt-2 text-[11px] font-serif italic text-muted border-t border-line/60 pt-1.5 leading-relaxed">
                      "{c.example}"
                    </p>
                  )}
                </div>

                <div className="text-[10px] font-semibold text-muted flex items-center justify-between">
                  <span>
                    Gốc từ: <b>{c.term}</b>
                  </span>
                  <span>{c.collectionTitle.replace('IELTS ', '')}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------------------------- */}
      {/* TAB: 60-SECOND VOCABULARY SPRINT */}
      {/* ----------------------------------------------------------------------------------------- */}
      {activeTab === 'speed' && (
        <div className="max-w-xl mx-auto space-y-6">
          <Card className="p-6 sm:p-8 space-y-6 text-center">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/40 px-3 py-1 text-xs font-bold text-orange-700 dark:text-orange-300">
                <Flame size={14} className="fill-orange-500" />
                <span>Thử thách phản xạ nhanh 60 giây</span>
              </div>
              <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                IELTS Vocabulary Sprint
              </h2>
              <p className="mt-1 text-xs text-muted">
                Nhận diện nhanh nghĩa của từ vựng học thuật trong vòng 60 giây. Càng đúng nhanh, điểm combo càng cao!
              </p>
            </div>

            {/* Score & Timer HUD */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-line bg-slate-50 dark:bg-slate-800 p-3">
                <div className="text-[10px] font-bold uppercase text-muted">Thời gian</div>
                <div
                  className={cx(
                    'text-2xl font-black font-mono',
                    sprintTimeLeft <= 10
                      ? 'text-rose-600 animate-pulse'
                      : 'text-indigo-600 dark:text-indigo-400'
                  )}
                >
                  {sprintTimeLeft}s
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-slate-50 dark:bg-slate-800 p-3">
                <div className="text-[10px] font-bold uppercase text-muted">Điểm số</div>
                <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {sprintScore}
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-slate-50 dark:bg-slate-800 p-3">
                <div className="text-[10px] font-bold uppercase text-muted">Kỷ lục</div>
                <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                  {sprintHigh}
                </div>
              </div>
            </div>

            {!sprintRunning ? (
              <div className="py-6 space-y-4">
                <button
                  type="button"
                  onClick={startSprint}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-4 text-base font-extrabold shadow-lg shadow-orange-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Play size={18} fill="white" />
                  <span>{sprintScore > 0 ? 'Thử lại lần nữa' : 'Bắt đầu 60 giây'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in">
                {/* Word Prompt */}
                <div className="py-3">
                  <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                    {sprintCur?.word}
                  </div>
                  {sprintCur?.pronunciation && (
                    <div className="mt-1 font-mono text-sm text-muted">
                      {sprintCur.pronunciation}
                    </div>
                  )}
                </div>

                {/* 4 Choices */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {sprintCur?.options.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSprintPick(opt)}
                      className="rounded-2xl border border-line bg-card hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 p-3.5 text-left text-sm font-bold text-slate-800 dark:text-slate-100 transition-all active:scale-95 cursor-pointer shadow-2xs"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ----------------------------------------------------------------------------------------- */}
      {/* TAB: SPELLING MISTAKES LIST */}
      {/* ----------------------------------------------------------------------------------------- */}
      {activeTab === 'mistakes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Danh sách từ hay bị gõ sai chính tả
            </h2>
            <span className="text-xs text-muted">
              {mistakesList.length} từ cần khắc phục
            </span>
          </div>

          {!mistakesList.length ? (
            <Card className="p-8 text-center space-y-2">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
              <div className="text-base font-extrabold text-slate-900 dark:text-white">
                Chưa có lỗi chính tả nào!
              </div>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Khi bạn làm bài trong Trạm Chép chính tả (Dictation Lab), mọi từ gõ sai sẽ tự động được ghi lại vào đây để bạn dễ dàng ôn luyện.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mistakesList.map((m) => (
                <Card key={m.term} className="p-4 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                        {m.term}
                      </span>
                      <span className="rounded-full bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                        Sai {m.failCount} lần
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {m.meaning}
                    </div>

                    {m.wrongAttempts.length > 0 && (
                      <div className="text-[11px] text-muted">
                        Từng gõ nhầm: <span className="line-through font-mono">{m.wrongAttempts.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => speakEnglish(m.term, { accent: 'US' })}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Nghe phát âm chuẩn"
                    >
                      <Volume2 size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveMistake(m.term)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Đã thuộc, xóa khỏi danh sách sai"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
