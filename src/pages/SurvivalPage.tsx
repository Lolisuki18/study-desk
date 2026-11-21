import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Award,
  Check,
  Flame,
  Heart,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
  Zap,
} from 'lucide-react'
import { allEntries, collections } from '../data'
import { Button, Card, PageHeader, ProgressBar } from '../components/ui'
import { cx, shuffle } from '../utils'
import { playSound } from '../utils/sound'
import { playLevelUp, playPerfectScore, playMechSound } from '../utils/mechSound'
import { fireConfetti } from '../utils/confetti'
import { haptic } from '../utils/haptic'
import type { Entry, MultipleChoiceContent } from '../types'

const QUESTION_TIME_LIMIT = 15 // seconds
const HIGH_SCORE_KEY = 'psh.survival.highscore'

function getSavedHighScore(): number {
  try {
    return Number(localStorage.getItem(HIGH_SCORE_KEY) ?? '0')
  } catch {
    return 0
  }
}

function saveHighScore(score: number): void {
  try {
    const cur = getSavedHighScore()
    if (score > cur) {
      localStorage.setItem(HIGH_SCORE_KEY, String(score))
    }
  } catch {}
}

export default function SurvivalPage() {
  const [playing, setPlaying] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [highScore, setHighScore] = useState(getSavedHighScore)
  const [selectedSubject, setSelectedSubject] = useState<string>('all')

  // Available multiple-choice questions pool
  const pool = useMemo(() => {
    let list = allEntries().filter((e) => e.item.type === 'multiple-choice')
    if (selectedSubject !== 'all') {
      list = list.filter((e) => e.collection.subject === selectedSubject)
    }
    return list
  }, [selectedSubject])

  const subjects = useMemo(() => {
    const set = new Set<string>()
    collections.forEach((c) => set.add(c.subject))
    return Array.from(set)
  }, [])

  const [queue, setQueue] = useState<Entry[]>([])
  const [curIndex, setCurIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [answerLocked, setAnswerLocked] = useState(false)
  const [mistakes, setMistakes] = useState<{ entry: Entry; picked: string }[]>([])

  const curEntry = queue[curIndex]
  const curItem = curEntry?.item
  const mcContent = curItem?.type === 'multiple-choice' ? (curItem.content as MultipleChoiceContent) : null

  // Start game
  const startGame = () => {
    const shuffled = shuffle(pool)
    setQueue(shuffled)
    setCurIndex(0)
    setLives(3)
    setScore(0)
    setCombo(0)
    setTimeLeft(QUESTION_TIME_LIMIT)
    setSelectedKey(null)
    setAnswerLocked(false)
    setMistakes([])
    setGameOver(false)
    setPlaying(true)
    playSound('fanfare')
  }

  // Timer countdown
  useEffect(() => {
    if (!playing || gameOver || answerLocked) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up! Count as wrong
          handleAnswer('')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [playing, gameOver, answerLocked, curIndex])

  // Answer handling
  const handleAnswer = useCallback(
    (key: string) => {
      if (answerLocked || !mcContent) return
      setAnswerLocked(true)
      setSelectedKey(key)

      const isCorrect = mcContent.answer.includes(key) && key !== ''

      if (isCorrect) {
        playSound('correct')
        haptic('success')
        playMechSound('keydown')
        const bonus = Math.max(10, timeLeft * 2)
        const nextScore = score + bonus
        const nextCombo = combo + 1
        setScore(nextScore)
        setCombo(nextCombo)

        if (nextCombo > 0 && nextCombo % 5 === 0) {
          playLevelUp()
          fireConfetti(1800)
        }

        setTimeout(() => {
          if (curIndex + 1 < queue.length) {
            setCurIndex((prev) => prev + 1)
            setTimeLeft(QUESTION_TIME_LIMIT)
            setSelectedKey(null)
            setAnswerLocked(false)
          } else {
            // Finished entire pool!
            setPlaying(false)
            setGameOver(true)
            saveHighScore(nextScore)
            setHighScore(Math.max(highScore, nextScore))
            playPerfectScore()
          }
        }, 600)
      } else {
        playSound('wrong')
        haptic('error')
        playMechSound('keydown')
        setCombo(0)
        setMistakes((prev) => (curEntry ? [...prev, { entry: curEntry, picked: key }] : prev))

        const nextLives = lives - 1
        setLives(nextLives)

        if (nextLives <= 0) {
          setTimeout(() => {
            setPlaying(false)
            setGameOver(true)
            saveHighScore(score)
            setHighScore(Math.max(highScore, score))
            playSound('bell')
          }, 1000)
        } else {
          setTimeout(() => {
            if (curIndex + 1 < queue.length) {
              setCurIndex((prev) => prev + 1)
              setTimeLeft(QUESTION_TIME_LIMIT)
              setSelectedKey(null)
              setAnswerLocked(false)
            }
          }, 1200)
        }
      }
    },
    [answerLocked, mcContent, timeLeft, score, combo, curIndex, queue.length, lives, curEntry, highScore],
  )

  // Keyboard controls
  useEffect(() => {
    if (!playing || gameOver || answerLocked || !mcContent) return

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      let key = ''
      if (['1', '2', '3', '4'].includes(k)) {
        const idx = Number(k) - 1
        if (mcContent.options[idx]) key = mcContent.options[idx].key
      } else if (['a', 'b', 'c', 'd'].includes(k)) {
        key = k.toUpperCase()
      }

      if (key && mcContent.options.some((o) => o.key === key)) {
        handleAnswer(key)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing, gameOver, answerLocked, mcContent, handleAnswer])

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Thử thách Sinh tồn (Survival Mode)"
        subtitle="3 mạng sống, 15 giây mỗi câu — bạn có thể sống sót và lập kỷ lục chuỗi câu đúng dài nhất?"
      />

      {/* Start Game Screen */}
      {!playing && !gameOver && (
        <Card className="p-6 sm:p-10 text-center space-y-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-xl shadow-rose-500/25 mx-auto animate-pulse">
            <Flame size={40} />
          </div>

          <div>
            <h2 className="text-2xl font-black text-ink">Sẵn sàng thử thách phản xạ?</h2>
            <p className="mt-2 text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
              Bạn có 3 mạng ❤️❤️❤️. Mỗi câu hỏi chỉ có 15 giây. Trả lời đúng càng nhanh điểm càng cao!
            </p>
          </div>

          {/* High score badge */}
          <div className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 px-4 py-2 text-sm font-bold text-amber-700 dark:text-amber-300">
            <Trophy size={16} className="text-amber-500" />
            <span>Kỷ lục điểm cao nhất: {highScore} điểm</span>
          </div>

          {/* Subject selector */}
          <div className="space-y-2 pt-2 text-left">
            <label className="text-xs font-bold text-ink">Chọn môn thi đấu:</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedSubject('all')}
                className={cx(
                  'px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer',
                  selectedSubject === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'border border-line bg-card text-muted hover:text-ink',
                )}
              >
                Tất cả các môn ({pool.length} câu)
              </button>
              {subjects.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSubject(s)}
                  className={cx(
                    'px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer',
                    selectedSubject === s
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'border border-line bg-card text-muted hover:text-ink',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <Button
              variant="primary"
              disabled={pool.length === 0}
              onClick={startGame}
              className="py-3.5 px-8 text-base font-extrabold shadow-lg shadow-indigo-500/25 cursor-pointer w-full sm:w-auto"
            >
              <Play size={18} fill="white" /> Bắt đầu thử thách ngay
            </Button>
          </div>
        </Card>
      )}

      {/* In-Game Active Screen */}
      {playing && curItem && mcContent && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Game HUD Bar: Lives, Score, Timer */}
          <div className="flex items-center justify-between rounded-2xl border border-line bg-card p-3 shadow-xs">
            {/* Lives */}
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((heart) => (
                <Heart
                  key={heart}
                  size={20}
                  className={cx(
                    'transition-all duration-300',
                    heart <= lives ? 'fill-rose-500 text-rose-500 scale-105' : 'text-slate-300 dark:text-slate-700 opacity-40',
                  )}
                />
              ))}
            </div>

            {/* Score & Combo */}
            <div className="flex items-center gap-3">
              {combo >= 2 && (
                <span className="flex items-center gap-1 rounded-full bg-amber-500 text-white px-2.5 py-0.5 text-xs font-black shadow-xs animate-bounce">
                  <Flame size={12} /> x{combo} Combo
                </span>
              )}
              <span className="font-mono text-sm font-extrabold text-ink">
                Điểm: <b className="text-indigo-600 dark:text-indigo-400">{score}</b>
              </span>
            </div>

            {/* Timer countdown */}
            <div
              className={cx(
                'flex items-center gap-1 font-mono text-sm font-black px-2.5 py-1 rounded-xl border',
                timeLeft <= 5
                  ? 'border-rose-400 bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 animate-pulse'
                  : 'border-line text-ink',
              )}
            >
              <Zap size={14} className={timeLeft <= 5 ? 'text-rose-500' : 'text-amber-500'} />
              <span>{timeLeft}s</span>
            </div>
          </div>

          {/* Time Bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={cx(
                'h-full transition-all duration-1000 ease-linear rounded-full',
                timeLeft <= 5 ? 'bg-rose-500' : timeLeft <= 8 ? 'bg-amber-500' : 'bg-emerald-500',
              )}
              style={{ width: `${(timeLeft / QUESTION_TIME_LIMIT) * 100}%` }}
            />
          </div>

          {/* Question Card */}
          <Card className="p-5 sm:p-7 space-y-5">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">Câu hỏi #{curIndex + 1}</span>
              <span>{curEntry?.collection.subject}</span>
            </div>

            <p className="text-base sm:text-lg font-bold leading-relaxed text-ink">{mcContent.question}</p>

            {/* Options */}
            <div className="space-y-2.5">
              {mcContent.options.map((o) => {
                const isSelected = selectedKey === o.key
                const isRight = mcContent.answer.includes(o.key)
                const showFeedback = answerLocked

                return (
                  <button
                    key={o.key}
                    disabled={answerLocked}
                    onClick={() => handleAnswer(o.key)}
                    className={cx(
                      'flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-left text-sm font-semibold transition-all cursor-pointer active:scale-[0.98]',
                      !showFeedback && 'border-line bg-card hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/40',
                      showFeedback && isRight && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 font-bold',
                      showFeedback && isSelected && !isRight && 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-100',
                      showFeedback && !isSelected && !isRight && 'border-line opacity-40',
                    )}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-line bg-slate-100 dark:bg-slate-800 text-xs font-bold font-mono">
                      {o.key}
                    </span>
                    <span className="flex-1 leading-snug">{o.text}</span>
                  </button>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Game Over Screen */}
      {gameOver && (
        <Card className="p-6 sm:p-10 text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-xl mx-auto">
            {score >= highScore && score > 0 ? <Trophy size={40} className="text-amber-400 animate-bounce" /> : <Award size={40} className="text-indigo-400" />}
          </div>

          <div>
            <h2 className="text-2xl font-black text-ink">{score >= highScore && score > 0 ? 'KỶ LỤC MỚI!' : 'KẾT THÚC THỬ THÁCH'}</h2>
            <p className="mt-1 text-sm text-muted">
              Bạn đã vượt qua <b className="text-ink">{curIndex}</b> câu hỏi và đạt được <b className="text-indigo-600 dark:text-indigo-400 font-extrabold">{score}</b> điểm!
            </p>
          </div>

          {/* Highscore Comparison */}
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            <div className="rounded-2xl border border-line p-3 bg-slate-50 dark:bg-slate-800/40">
              <span className="text-[11px] font-bold text-muted uppercase">Điểm trận này</span>
              <p className="text-2xl font-black text-ink mt-0.5">{score}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 p-3 bg-amber-50/60 dark:bg-amber-950/40">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase">Kỷ lục cao nhất</span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{highScore}</p>
            </div>
          </div>

          {/* Mistakes review list */}
          {mistakes.length > 0 && (
            <div className="text-left space-y-2.5 max-h-56 overflow-y-auto pt-2 border-t border-line">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                Các câu bạn đã trả lời sai trong trận này ({mistakes.length} câu):
              </span>
              {mistakes.map(({ entry, picked }, i) => (
                <div key={i} className="rounded-xl border border-line p-3 text-xs space-y-1">
                  <p className="font-semibold text-ink">
                    {entry.item.type === 'multiple-choice' ? entry.item.content.question : ''}
                  </p>
                  <p className="text-muted">
                    Bạn chọn: <b className="text-rose-600">{picked || '(Hết giờ)'}</b> · Đáp án đúng:{' '}
                    <b className="text-emerald-600">{entry.item.type === 'multiple-choice' ? entry.item.content.answer : ''}</b>
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button variant="primary" onClick={startGame} className="py-2.5 px-6 font-bold shadow-md">
              <RotateCcw size={15} /> Thử thách lại lần nữa
            </Button>
            <Link to="/">
              <Button variant="outline" className="py-2.5 px-5">
                Về Tổng quan
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
