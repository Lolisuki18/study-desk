import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, Check, Flame, Heart, HeartCrack, Play, RotateCcw, Target, Timer, Trophy, X, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { allEntries, collections } from '../data'
import { useProgress } from '../features/learning/ProgressContext'
import { buildSurvivalPool, getSavedHighScore, isSurvivalCorrect, MAX_LIVES, pointsFor, QUESTION_TIME_LIMIT, saveHighScore } from '../services/survival'
import { isMulti, toggleKey } from '../utils/answers'
import { Button, PageHeader } from '../components/ui'
import { cx, shuffle } from '../utils'
import { previewOf } from '../utils/preview'
import { playSound } from '../utils/sound'
import { playLevelUp, playPerfectScore, playMechSound } from '../utils/mechSound'
import { fireConfetti } from '../utils/confetti'
import { haptic } from '../utils/haptic'
import type { Entry, MultipleChoiceContent } from '../types'

export default function SurvivalPage() {
  const { record } = useProgress()
  const [playing, setPlaying] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [lives, setLives] = useState(MAX_LIVES)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [highScore, setHighScore] = useState(getSavedHighScore)
  const [newRecord, setNewRecord] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string>('all')

  // one entry per distinct question (several decks repeat the same bank)
  const fullPool = useMemo(() => buildSurvivalPool(allEntries()), [])
  const pool = useMemo(() => (selectedSubject === 'all' ? fullPool : fullPool.filter((e) => e.collection.subject === selectedSubject)), [fullPool, selectedSubject])

  const subjects = useMemo(() => {
    const set = new Set<string>()
    collections.forEach((c) => set.add(c.subject))
    return Array.from(set)
  }, [])
  const subjectCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of fullPool) m.set(e.collection.subject, (m.get(e.collection.subject) ?? 0) + 1)
    return m
  }, [fullPool])
  const totalCount = fullPool.length

  const [queue, setQueue] = useState<Entry[]>([])
  const [curIndex, setCurIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT)
  const [selectedKey, setSelectedKey] = useState<string | null>(null) // what was submitted
  const [picked, setPicked] = useState('') // select-all questions: keys ticked so far
  const [answerLocked, setAnswerLocked] = useState(false)
  const [mistakes, setMistakes] = useState<{ entry: Entry; picked: string }[]>([])
  const [answeredCount, setAnsweredCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [lastGain, setLastGain] = useState<number | null>(null)

  // the lock is a ref so a click and the clock running out in the same instant cannot both be counted
  const lockRef = useRef(false)
  const prevBestRef = useRef(0)

  const curEntry = queue[curIndex]
  const curItem = curEntry?.item
  const mcContent = curItem?.type === 'multiple-choice' ? (curItem.content as MultipleChoiceContent) : null
  const multi = !!mcContent && isMulti(mcContent.answer)

  const startGame = () => {
    prevBestRef.current = getSavedHighScore()
    lockRef.current = false
    setQueue(shuffle(pool))
    setCurIndex(0)
    setLives(MAX_LIVES)
    setScore(0)
    setCombo(0)
    setTimeLeft(QUESTION_TIME_LIMIT)
    setSelectedKey(null)
    setPicked('')
    setAnswerLocked(false)
    setMistakes([])
    setAnsweredCount(0)
    setCorrectCount(0)
    setLastGain(null)
    setNewRecord(false)
    setGameOver(false)
    setPlaying(true)
    playSound('fanfare')
  }

  /** The game ends when the lives run out ('lost') or the whole pool has been answered ('cleared'). */
  const finishGame = (finalScore: number, reason: 'lost' | 'cleared') => {
    const isNew = finalScore > prevBestRef.current
    saveHighScore(finalScore)
    setHighScore(Math.max(prevBestRef.current, finalScore))
    setNewRecord(isNew)
    setPlaying(false)
    setGameOver(true)
    if (reason === 'cleared') playPerfectScore()
    else playSound('bell')
    if (isNew) fireConfetti(2000)
  }

  const advance = (currentScore: number) => {
    if (curIndex + 1 >= queue.length) return finishGame(currentScore, 'cleared')
    setCurIndex((i) => i + 1)
    setTimeLeft(QUESTION_TIME_LIMIT)
    setSelectedKey(null)
    setPicked('')
    setAnswerLocked(false)
    setLastGain(null)
    lockRef.current = false
  }

  /** Lock in an answer (`keys` is '' when the time ran out). */
  const submit = (keys: string) => {
    if (lockRef.current || !mcContent || !curEntry) return
    lockRef.current = true
    setAnswerLocked(true)
    setSelectedKey(keys)
    setAnsweredCount((n) => n + 1)

    const ok = isSurvivalCorrect(keys, mcContent.answer)
    // the answer counts for the spaced-repetition schedule, the wrong-answer notebook and today's goal like any quiz
    record([{ collectionId: curEntry.collection.id, itemId: curEntry.item.id, correct: ok }], 'quiz')

    if (ok) {
      playSound('correct')
      haptic('success')
      const pts = pointsFor(timeLeft, combo)
      const nextScore = score + pts.total
      const nextCombo = combo + 1
      setScore(nextScore)
      setCombo(nextCombo)
      setCorrectCount((n) => n + 1)
      setLastGain(pts.total)
      if (nextCombo % 5 === 0) {
        playLevelUp()
        fireConfetti(1800)
      }
      setTimeout(() => advance(nextScore), 600)
    } else {
      playSound('wrong')
      haptic('error')
      setCombo(0)
      setMistakes((prev) => [...prev, { entry: curEntry, picked: keys }])
      const nextLives = lives - 1
      setLives(nextLives)
      // out of lives, or the last question of the pool: either way the run ends instead of freezing
      setTimeout(() => (nextLives <= 0 ? finishGame(score, 'lost') : advance(score)), nextLives <= 0 ? 1000 : 1200)
    }
  }
  const submitRef = useRef(submit)
  submitRef.current = submit

  const chooseOption = (key: string) => {
    if (answerLocked || !mcContent) return
    playMechSound('keydown')
    haptic('select')
    if (multi) setPicked((p) => toggleKey(p, key))
    else submit(key)
  }
  const chooseRef = useRef(chooseOption)
  chooseRef.current = chooseOption

  // clock: only counts down (a pure state update); running out is handled in the next effect
  useEffect(() => {
    if (!playing || answerLocked) return
    const timer = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [playing, answerLocked, curIndex])

  useEffect(() => {
    if (playing && !answerLocked && timeLeft <= 0) submitRef.current(multi ? picked : '')
  }, [timeLeft, playing, answerLocked]) // eslint-disable-line react-hooks/exhaustive-deps

  // keyboard: 1-4 / A-D pick an option, Enter confirms a select-all answer
  useEffect(() => {
    if (!playing || answerLocked || !mcContent) return
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (k === 'enter' && multi && picked) {
        e.preventDefault()
        submitRef.current(picked)
        return
      }
      let key = ''
      if (['1', '2', '3', '4'].includes(k)) key = mcContent.options[Number(k) - 1]?.key ?? ''
      else if (/^[a-d]$/.test(k)) key = k.toUpperCase()
      if (key && mcContent.options.some((o) => o.key === key)) chooseRef.current(key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing, answerLocked, mcContent, multi, picked])


  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {!playing && <PageHeader title="Thử thách Sinh tồn" subtitle="Phản xạ nhanh, 3 mạng sống, 15 giây mỗi câu. Bạn lập được kỷ lục điểm bao nhiêu?" />}

      {/* ---------------------------------------------------------------- start screen */}
      {!playing && !gameOver && (
        <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-[0_14px_44px_-18px_rgba(244,63,94,0.35)]">
          <div className="relative px-5 pb-7 pt-9 text-center sm:px-9">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-rose-500/[0.13] via-amber-400/[0.07] to-transparent" />

            <div className="relative">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400 text-white shadow-lg shadow-rose-500/30 ring-8 ring-rose-500/10">
                <Flame size={38} strokeWidth={2.2} />
              </div>
              <h2 className="mt-5 text-[28px] font-black tracking-tight text-ink">Sẵn sàng thử thách phản xạ?</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                Trả lời đúng để ghi điểm. Trả lời sai hoặc hết giờ là mất một mạng; hết cả 3 mạng là kết thúc.
              </p>

              {/* rules */}
              <div className="mt-6 grid grid-cols-3 gap-2.5 text-left sm:gap-3">
                <Rule icon={Heart} tone="rose" title="3 mạng" text="Sai hoặc hết giờ mất 1 mạng" />
                <Rule icon={Timer} tone="amber" title="15 giây" text="Cho mỗi câu hỏi" />
                <Rule icon={Zap} tone="indigo" title="Càng nhanh" text="Nhanh và đúng liên tiếp, điểm càng cao" />
              </div>

              {/* record */}
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-left dark:border-amber-900/50 dark:bg-amber-950/30">
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
                    <Trophy size={20} />
                  </span>
                  <span>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Kỷ lục điểm cao nhất</span>
                    <span className="block text-xs text-muted">Lưu trên máy này</span>
                  </span>
                </span>
                <span className="font-mono text-3xl font-black text-amber-600 dark:text-amber-300">{highScore}</span>
              </div>
            </div>
          </div>

          {/* subject picker */}
          <div className="border-t border-line px-5 py-6 sm:px-9">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
                <Target size={14} /> Chọn môn thi đấu
              </span>
              <span className="text-xs text-muted">{pool.length} câu trong lượt này</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <SubjectCard label="Tất cả các môn" count={totalCount} selected={selectedSubject === 'all'} onClick={() => setSelectedSubject('all')} wide />
              {subjects.map((s) => (
                <SubjectCard key={s} label={s} count={subjectCounts.get(s) ?? 0} selected={selectedSubject === s} onClick={() => setSelectedSubject(s)} />
              ))}
            </div>

            <Button
              variant="primary"
              disabled={pool.length === 0}
              onClick={startGame}
              className="mt-6 w-full cursor-pointer py-3.5 text-base font-extrabold shadow-lg shadow-indigo-500/25"
            >
              <Play size={18} fill="currentColor" /> Bắt đầu thử thách
            </Button>
            <p className="mt-2.5 text-center text-[11px] text-muted">Dùng phím 1–4 hoặc A–D để trả lời nhanh.</p>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- in game */}
      {playing && curItem && mcContent && (
        <div className="space-y-3.5">
          {/* HUD */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card p-3 pl-4 shadow-xs">
            <div className="flex items-center gap-1" role="img" aria-label={`Còn ${lives} mạng`}>
              {[1, 2, 3].map((heart) =>
                heart <= lives ? (
                  <Heart key={heart} size={24} className="fill-rose-500 text-rose-500 drop-shadow-sm" />
                ) : (
                  <HeartCrack key={heart} size={24} className="text-slate-300 dark:text-slate-600" />
                ),
              )}
            </div>

            <div className="flex flex-1 items-center justify-center gap-3">
              <div className="text-center leading-none">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">Điểm</span>
                <span className="mt-1 block font-mono text-2xl font-black text-indigo-600 dark:text-indigo-400">{score}</span>
              </div>
              {lastGain !== null && <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">+{lastGain}</span>}
              {combo >= 2 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-2.5 py-1 text-xs font-black text-white shadow-sm">
                  <Flame size={13} /> x{combo}
                </span>
              )}
            </div>

            <TimerRing timeLeft={timeLeft} total={QUESTION_TIME_LIMIT} />
          </div>

          {/* question */}
          <div className="rounded-3xl border border-line bg-card p-5 shadow-sm sm:p-7">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">Câu {curIndex + 1}</span>
              <span className="truncate text-xs font-medium text-muted">{curEntry?.collection.subject}</span>
            </div>

            <p className="text-lg font-bold leading-relaxed text-ink sm:text-xl">{mcContent.question}</p>
            {multi && !answerLocked && (
              <p className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-300">Câu chọn nhiều đáp án: chọn đủ {mcContent.answer.length} đáp án rồi bấm Xác nhận (hoặc Enter).</p>
            )}

            <div className="mt-5 space-y-2.5">
              {mcContent.options.map((o, idx) => {
                const chosen = answerLocked ? selectedKey ?? '' : picked
                const isSelected = chosen.includes(o.key)
                const isRight = mcContent.answer.includes(o.key)
                const showFeedback = answerLocked

                return (
                  <button
                    key={o.key}
                    disabled={answerLocked}
                    onClick={() => chooseOption(o.key)}
                    className={cx(
                      'group flex w-full cursor-pointer items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-left text-[15px] font-semibold transition-all active:scale-[0.985]',
                      !showFeedback && !isSelected && 'border-line bg-card hover:-translate-y-px hover:border-indigo-400 hover:bg-indigo-50/50 hover:shadow-sm dark:hover:bg-indigo-950/20',
                      !showFeedback && isSelected && 'border-indigo-500 bg-indigo-50 shadow-sm dark:bg-indigo-950/40',
                      showFeedback && isRight && 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100',
                      showFeedback && isSelected && !isRight && 'border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/50 dark:text-rose-100',
                      showFeedback && !isSelected && !isRight && 'border-line opacity-45',
                    )}
                  >
                    <span
                      className={cx(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold transition-colors',
                        !showFeedback && !isSelected && 'bg-slate-100 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white dark:bg-slate-800 dark:text-slate-300',
                        !showFeedback && isSelected && 'bg-indigo-600 text-white',
                        showFeedback && isRight && 'bg-emerald-500 text-white',
                        showFeedback && isSelected && !isRight && 'bg-rose-500 text-white',
                        showFeedback && !isSelected && !isRight && 'bg-slate-100 text-slate-500 dark:bg-slate-800',
                      )}
                    >
                      {showFeedback && isRight ? <Check size={16} strokeWidth={3} /> : showFeedback && isSelected ? <X size={16} strokeWidth={3} /> : o.key}
                    </span>
                    <span className="flex-1 leading-snug">{o.text}</span>
                    <kbd className="hidden h-6 min-w-6 items-center justify-center rounded-md border border-line bg-slate-50 px-1.5 font-mono text-[10px] font-bold text-muted sm:inline-flex dark:bg-slate-800">{idx + 1}</kbd>
                  </button>
                )
              })}
            </div>

            {multi && !answerLocked && (
              <Button variant="primary" disabled={!picked} onClick={() => submit(picked)} className="mt-4 w-full cursor-pointer py-3 font-extrabold">
                <Check size={17} /> Xác nhận ({picked.length}/{mcContent.answer.length})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- game over */}
      {gameOver && (
        <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-[0_14px_44px_-18px_rgba(99,102,241,0.35)]">
          <div className="relative px-5 pb-7 pt-9 text-center sm:px-9">
            <div
              className={cx(
                'pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b to-transparent',
                newRecord ? 'from-amber-400/[0.18] via-orange-400/[0.06]' : 'from-indigo-500/[0.12] via-sky-400/[0.05]',
              )}
            />
            <div className="relative">
              <div
                className={cx(
                  'mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] text-white shadow-lg ring-8',
                  newRecord ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/30 ring-amber-400/15' : 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/30 ring-indigo-500/10',
                )}
              >
                {newRecord ? <Trophy size={38} /> : <Award size={38} />}
              </div>
              <h2 className="mt-5 text-[28px] font-black tracking-tight text-ink">{newRecord ? 'Kỷ lục mới!' : 'Kết thúc thử thách'}</h2>
              <p className="mt-1.5 text-sm text-muted">
                Bạn đã trả lời <b className="text-ink">{answeredCount}</b> câu, đúng <b className="text-ink">{correctCount}</b>
                {mistakes.length > 0 ? ` và sai ${mistakes.length} câu.` : '.'}
              </p>

              <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3">
                <div className="rounded-2xl border border-line bg-slate-50/70 p-3.5 dark:bg-slate-800/40">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Điểm trận này</span>
                  <p className="mt-1 font-mono text-3xl font-black text-ink">{score}</p>
                </div>
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/30">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Kỷ lục cao nhất</span>
                  <p className="mt-1 font-mono text-3xl font-black text-amber-600 dark:text-amber-300">{highScore}</p>
                </div>
              </div>
            </div>
          </div>

          {mistakes.length > 0 && (
            <div className="border-t border-line px-5 py-5 sm:px-9">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                <HeartCrack size={14} /> Các câu đã sai trong trận này ({mistakes.length})
              </div>
              <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
                {mistakes.map(({ entry, picked }, i) => {
                  const mc = entry.item.type === 'multiple-choice' ? entry.item.content : null
                  const pickedText = mc?.options.find((o) => o.key === picked)?.text
                  return (
                    <div key={i} className="rounded-2xl border border-line bg-card p-3.5 text-xs">
                      <p className="text-[13px] font-semibold leading-snug text-ink">{mc?.question}</p>
                      <div className="mt-2 space-y-1">
                        <p className="flex items-start gap-1.5 text-rose-600 dark:text-rose-400">
                          <X size={13} className="mt-0.5 shrink-0" />
                          <span>{picked ? `${picked}${pickedText ? `. ${pickedText}` : ''}` : 'Hết giờ, chưa chọn đáp án'}</span>
                        </p>
                        <p className="flex items-start gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                          <Check size={13} className="mt-0.5 shrink-0" />
                          <span>{previewOf(entry.item).a}</span>
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 border-t border-line px-5 py-5 sm:px-9">
            <Button variant="primary" onClick={startGame} className="cursor-pointer px-6 py-2.5 font-bold shadow-md">
              <RotateCcw size={15} /> Chơi lại
            </Button>
            <Link to="/">
              <Button variant="outline" className="px-5 py-2.5">
                Về Tổng quan
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------- small pieces

const TONES = {
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300',
} as const

function Rule({ icon: Icon, tone, title, text }: { icon: LucideIcon; tone: keyof typeof TONES; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card/70 p-3 shadow-2xs">
      <span className={cx('flex h-9 w-9 items-center justify-center rounded-xl', TONES[tone])}>
        <Icon size={18} />
      </span>
      <p className="mt-2 text-sm font-extrabold text-ink">{title}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-muted">{text}</p>
    </div>
  )
}

function SubjectCard({ label, count, selected, onClick, wide }: { label: string; count: number; selected: boolean; onClick: () => void; wide?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        'relative cursor-pointer rounded-2xl border-2 p-3 text-left transition-all active:scale-[0.98]',
        wide && 'col-span-2 sm:col-span-3',
        selected ? 'border-indigo-500 bg-indigo-50/70 shadow-sm dark:bg-indigo-950/30' : 'border-line bg-card hover:border-slate-300 dark:hover:border-slate-600',
      )}
    >
      <span className="block pr-6 text-[13px] font-bold leading-snug text-ink">{label}</span>
      <span className="mt-0.5 block text-[11px] font-medium text-muted">{count} câu</span>
      <span
        className={cx(
          'absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
          selected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600',
        )}
      >
        {selected && <Check size={12} strokeWidth={3.5} />}
      </span>
    </button>
  )
}

/** Circular countdown: the ring drains clockwise and turns amber, then rose, in the last seconds. */
function TimerRing({ timeLeft, total }: { timeLeft: number; total: number }) {
  const r = 22
  const c = 2 * Math.PI * r
  const danger = timeLeft <= 5
  const warn = timeLeft <= 8
  return (
    <div className="relative h-14 w-14 shrink-0" role="timer" aria-label={`Còn ${timeLeft} giây`}>
      <svg viewBox="0 0 56 56" className="h-full w-full -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="5" className="stroke-slate-200 dark:stroke-slate-700" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, timeLeft) / total)}
          className={cx('transition-[stroke-dashoffset] duration-1000 ease-linear', danger ? 'stroke-rose-500' : warn ? 'stroke-amber-500' : 'stroke-emerald-500')}
        />
      </svg>
      <span className={cx('absolute inset-0 flex items-center justify-center font-mono text-base font-black', danger ? 'text-rose-600 dark:text-rose-400' : 'text-ink', danger && 'animate-pulse')}>
        {timeLeft}
      </span>
    </div>
  )
}
