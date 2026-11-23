import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Lightbulb, RotateCw } from 'lucide-react'
import type { Entry, Grade } from '../../types'
import NoteBox from '../ui/NoteBox'
import CramView from '../ui/CramView'
import ContinuousFeedView from './ContinuousFeedView'
import { useProgress } from '../../features/learning/ProgressContext'
import { Empty, useToast } from '../ui'
import { CardBack, CardFront } from './CardContent'
import { shuffle, cx } from '../../utils'
import { isMulti, sameKeys, toggleKey } from '../../utils/answers'
import { loadSettings, saveSettings } from '../../services/storage/settings'
import { fireConfetti } from '../../utils/confetti'
import { isSoundEnabled, playSound, setSoundEnabled } from '../../utils/sound'
import { playMechSound } from '../../utils/mechSound'
import { haptic } from '../../utils/haptic'
import { exitZen } from '../../utils/zen'
import { isSpeaking, speakEnglish, speakText, stopSpeaking } from '../../utils/speech'
import { useStarred } from '../../services/storage/starred'
import {
  REQUEUE_GAP,
  entryKey,
  getHintText,
  getTextToSpeak,
  loadResume,
  resumeStorageKey,
  type Filter,
  type Resume,
  type Slot,
} from './sessionHelpers'
import { useFlashcardPrefs } from './useFlashcardPrefs'
import { useCardDrag, useFlashcardHotkeys } from './useFlashcardInput'
import { CardGridModal, ShortcutsHelp, ThemeModal } from './SessionDialogs'
import {
  ActionDock,
  CardMeta,
  DragStamps,
  HotkeysBar,
  SessionDone,
  SessionHud,
  SessionToolbar,
  SpellingTray,
  StackLayers,
} from './SessionParts'

interface Props {
  entries: Entry[]
  /** 'review' mode keeps the given order, hides filters and clears the review flag on success */
  mode?: 'study' | 'review'
  /** study mode: remember the deck order and the current card under this key, so the next visit resumes there */
  resumeKey?: string
}

export default function FlashcardSession({ entries, mode = 'study', resumeKey }: Props) {
  const { get, record, toggleReview } = useProgress()
  const { toast } = useToast()
  const useResume = mode === 'study' ? resumeKey : undefined
  const [resume, setResume] = useState<Resume | null>(() => loadResume(useResume, entries))
  const [filter, setFilter] = useState<Filter>(() => resume?.filter ?? 'all')
  const [shuffled, setShuffled] = useState(() => resume?.shuffled ?? (mode === 'study' && loadSettings().shuffleFlashcards))
  const [seed, setSeed] = useState(0)
  const [idx, setIdx] = useState(() => (resume ? Math.max(0, resume.keys.indexOf(resume.cur)) : 0))
  const [flipped, setFlipped] = useState(false)
  const [inverted, setInverted] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [sound, setSound] = useState(isSoundEnabled)
  const prefs = useFlashcardPrefs()
  const { viewMode, setViewMode, cardTheme, cardFont, autoPronounce, spellingMode, fontZoom } = prefs
  const { toggleViewMode, changeTheme, changeFont, toggleAutoPronounce, toggleSpellingMode, cycleFontZoom } = prefs

  const [sessionStreak, setSessionStreak] = useState(0)
  const [sessionKnownCount, setSessionKnownCount] = useState(0)
  const [sessionAgainCount, setSessionAgainCount] = useState(0)
  const [peekHint, setPeekHint] = useState(false)
  const [showThemeSettings, setShowThemeSettings] = useState(false)

  const [spellingInput, setSpellingInput] = useState('')
  const [spellingStatus, setSpellingStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle')

  const [showCardGrid, setShowCardGrid] = useState(false)
  const [showCram, setShowCram] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)
  const [reading, setReading] = useState(false)
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      exitZen()
    }
  }, [])

  // Dừng đọc TTS và dọn dẹp khi đổi thẻ
  useEffect(() => {
    stopSpeaking()
    setReading(false)
  }, [idx, flipped])


  const getRef = useRef(get)
  getRef.current = get

  const deck = useMemo(() => {
    if (resume) {
      const byKey = new Map(entries.map((e) => [entryKey(e), e]))
      return resume.keys.map((k) => byKey.get(k)!)
    }
    let list = entries
    if (filter !== 'all')
      list = list.filter((e) => {
        const p = getRef.current(e.collection.id, e.item.id)
        if (filter === 'review') return !!p?.review
        return (p?.status ?? 'new') === filter
      })
    return shuffled ? shuffle(list) : list
    // `seed` re-shuffles the deck on demand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, filter, shuffled, seed, resume])

  const [learn, setLearn] = useState(() => loadSettings().learnUntilKnown)
  const [order, setOrder] = useState<Slot[]>(() => deck.map((e) => ({ e, repeat: false })))
  const [repeats, setRepeats] = useState(0)
  const [done, setDone] = useState(false)

  // Chế độ tự động phát (Auto-Play Slideshow)
  useEffect(() => {
    if (!autoPlay || done) {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
      return
    }

    autoTimerRef.current = setTimeout(() => {
      if (!flipped) {
        setFlipped(true)
      } else {
        if (idx < order.length - 1) {
          setFlipped(false)
          setIdx((i) => i + 1)
        } else {
          setAutoPlay(false)
        }
      }
    }, 4000)

    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
    }
  }, [autoPlay, flipped, idx, order.length, done])

  useEffect(() => {
    setIdx(resume ? Math.max(0, resume.keys.indexOf(resume.cur)) : 0)
    setFlipped(false)
    setOrder(deck.map((e) => ({ e, repeat: false })))
    setRepeats(0)
    setDone(false)
    // Reset only when the deck changes, not when `resume` does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck])

  const slot = order[idx]
  const cur = slot?.e

  // Xử lý đọc Text-to-Speech
  const handleSpeak = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation()
      if (isSpeaking() || reading) {
        stopSpeaking()
        setReading(false)
      } else if (cur) {
        const text = getTextToSpeak(cur.item, inverted ? !flipped : flipped)
        setReading(true)
        speakText(text, () => setReading(false))
      }
    },
    [reading, cur, inverted, flipped],
  )
  const isRepeat = !!slot?.repeat
  const p = cur ? get(cur.collection.id, cur.item.id) : undefined
  const { isStarred, toggle: toggleStar } = useStarred()

  const [picks, setPicks] = useState<Record<string, string>>({})
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  useEffect(() => {
    setPicks({})
    setDrafts({})
  }, [deck])

  // Xử lý tự phát âm & làm mới input chép chính tả cho từ vựng
  useEffect(() => {
    setSpellingInput('')
    setSpellingStatus('idle')
    if (autoPronounce && cur?.item.type === 'vocabulary' && !flipped) {
      const term = cur.item.content.term
      const timer = setTimeout(() => {
        speakEnglish(term, { accent: 'US' })
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [idx, autoPronounce, flipped, cur])

  const checkSpelling = () => {
    if (!cur || cur.item.type !== 'vocabulary') return
    const expected = cur.item.content.term.trim().toLowerCase()
    const actual = spellingInput.trim().toLowerCase()
    if (expected === actual) {
      setSpellingStatus('correct')
      playSound('correct')
      haptic('success')
      setTimeout(() => {
        setFlipped(true)
      }, 600)
    } else {
      setSpellingStatus('incorrect')
      playSound('wrong')
      haptic('error')
    }
  }

  const curKey = cur ? entryKey(cur) : ''
  useEffect(() => {
    if (!useResume) return
    try {
      if (done || !curKey) localStorage.removeItem(resumeStorageKey(useResume))
      else {
        const r: Resume = { filter, shuffled, keys: deck.map(entryKey), cur: curKey }
        localStorage.setItem(resumeStorageKey(useResume), JSON.stringify(r))
      }
    } catch {}
  }, [useResume, done, curKey, filter, shuffled, deck])

  const pickKey = cur ? `${idx}::${cur.collection.id}::${cur.item.id}` : ''
  const picked = picks[pickKey]

  const requeue = useCallback(() => {
    if (!learn || !cur) return false
    setOrder((o) => {
      const at = Math.min(o.length, idx + 1 + REQUEUE_GAP)
      return [...o.slice(0, at), { e: cur, repeat: true }, ...o.slice(at)]
    })
    setRepeats((n) => n + 1)
    return true
  }, [learn, cur, idx])

  const commitPick = useCallback(
    (keys: string) => {
      if (!cur || cur.item.type !== 'multiple-choice') return
      const correct = sameKeys(keys, cur.item.content.answer)
      playSound(correct ? 'correct' : 'wrong')
      setPicks((s) => ({ ...s, [pickKey]: keys }))
      record(
        [{ collectionId: cur.collection.id, itemId: cur.item.id, correct, grade: correct && isRepeat ? 'hard' : undefined }],
        mode === 'review' ? 'review' : 'flashcard',
        { clearReview: mode === 'review' },
      )
      if (!correct) requeue()
    },
    [cur, pickKey, record, mode, isRepeat, requeue],
  )

  const pick = useCallback(
    (key: string) => {
      if (!cur || cur.item.type !== 'multiple-choice' || picks[pickKey] !== undefined) return
      if (isMulti(cur.item.content.answer)) setDrafts((d) => ({ ...d, [pickKey]: toggleKey(d[pickKey] ?? '', key) }))
      else commitPick(key)
    },
    [cur, picks, pickKey, commitPick],
  )

  const confirmPick = useCallback(() => {
    if (drafts[pickKey]) commitPick(drafts[pickKey])
  }, [drafts, pickKey, commitPick])

  const go = useCallback(
    (d: number) => {
      playSound('click')
      setFlipped(false)
      setIdx((i) => Math.min(order.length - 1, Math.max(0, i + d)))
    },
    [order.length],
  )

  const grade = useCallback(
    (g: Grade) => {
      if (!cur) return
      const last = idx >= order.length - 1
      if (g === 'again') {
        playSound('wrong')
        haptic('error')
        setSessionStreak(0)
        setSessionAgainCount((n) => n + 1)
      } else {
        playSound('correct')
        haptic(g === 'hard' ? 'medium' : 'success')
        setSessionStreak((s) => s + 1)
        setSessionKnownCount((n) => n + 1)
      }
      playMechSound('keydown')

      record(
        [{ collectionId: cur.collection.id, itemId: cur.item.id, correct: g !== 'again', grade: g !== 'again' && isRepeat ? 'hard' : g }],
        mode === 'review' ? 'review' : 'flashcard',
        { clearReview: mode === 'review' },
      )
      const grew = g === 'again' && requeue()
      setFlipped(false)
      setPeekHint(false)
      if (last && !grew) {
        setDone(true)
        playSound('fanfare')
        fireConfetti()
      } else {
        setIdx((i) => i + 1)
      }
    },
    [cur, record, mode, idx, order.length, isRepeat, requeue],
  )

  const handleFlip = useCallback(() => {
    playSound('flip')
    playMechSound('space')
    haptic('light')
    setFlipped((f) => !f)
  }, [])

  const handleToggleBookmark = useCallback(() => {
    if (!cur) return
    toggleReview(cur.collection.id, cur.item.id)
    toast.info(!p?.review ? 'Đã đánh dấu cần ôn lại' : 'Đã bỏ đánh dấu')
  }, [cur, p?.review, toggleReview, toast])

  const { dragOffset, isDragging, handlePointerDown, handlePointerMove, handlePointerUp } = useCardDrag(grade, handleFlip)

  useFlashcardHotkeys({
    done,
    showCram,
    flipped,
    cur,
    picks,
    pickKey,
    go,
    grade,
    handleFlip,
    handleToggleBookmark,
    handleSpeak,
    pick,
    setInverted,
    setShowHelp,
  })


  const toggleSound = () => {
    const next = !sound
    setSound(next)
    setSoundEnabled(next)
    toast.info(next ? 'Đã bật âm thanh hiệu ứng' : 'Đã tắt âm thanh')
  }

  const toolbar = (
    <SessionToolbar
      mode={mode}
      filter={filter}
      onFilter={(f) => {
        setResume(null)
        setFilter(f)
      }}
      shuffled={shuffled}
      onShuffle={() => {
        setResume(null)
        setShuffled((x) => !x)
        setSeed((x) => x + 1)
      }}
      inverted={inverted}
      onInvert={() => setInverted((v) => !v)}
      learn={learn}
      onToggleLearn={() => {
        saveSettings({ ...loadSettings(), learnUntilKnown: !learn })
        setLearn(!learn)
      }}
      autoPlay={autoPlay}
      onToggleAutoPlay={() => setAutoPlay((a) => !a)}
      isVocab={cur?.item.type === 'vocabulary'}
      autoPronounce={autoPronounce}
      onToggleAutoPronounce={toggleAutoPronounce}
      spellingMode={spellingMode}
      onToggleSpellingMode={toggleSpellingMode}
      viewMode={viewMode}
      onToggleViewMode={toggleViewMode}
      onThemeSettings={() => setShowThemeSettings(true)}
      onSpeak={handleSpeak}
      reading={reading}
      onCardGrid={() => setShowCardGrid(true)}
      fontZoom={fontZoom}
      onCycleFontZoom={cycleFontZoom}
      onCram={() => setShowCram(true)}
      sound={sound}
      onToggleSound={toggleSound}
      onHelp={() => setShowHelp((x) => !x)}
      position={order.length ? `${Math.min(idx + 1, order.length)} / ${order.length}` : '0 / 0'}
    />
  )

  if (showCram) {
    return <CramView entries={entries} onClose={() => setShowCram(false)} />
  }

  if (viewMode === 'feed') {
    return (
      <ContinuousFeedView
        entries={deck}
        title={cur ? cur.collection.title : undefined}
        onSwitchToFlip={() => setViewMode('flip')}
        cardTheme={cardTheme}
        cardFont={cardFont}
      />
    )
  }

  if (done)
    return (
      <SessionDone
        toolbar={toolbar}
        total={order.length - repeats}
        repeats={repeats}
        onRestart={() => {
          setResume(null)
          setSeed((x) => x + 1)
        }}
      />
    )

  if (!order.length || !cur)
    return (
      <div className="mx-auto w-full max-w-2xl">
        {toolbar}
        <Empty>{mode === 'review' ? 'Tuyệt vời! Không còn mục nào cần ôn hôm nay' : 'Không có thẻ nào khớp bộ lọc này.'}</Empty>
      </div>
    )

  const currentKey = `${cur.collection.id}::${cur.item.id}`

  const front = <CardFront item={cur.item} itemKey={currentKey} picked={picked} onPick={pick} draft={drafts[pickKey]} onConfirm={confirmPick} />
  const frontContent = inverted ? <CardBack item={cur.item} itemKey={currentKey} /> : front
  const backContent = inverted ? front : <CardBack item={cur.item} itemKey={currentKey} />

  const zoomClass = fontZoom === 'large' ? 'text-lg' : fontZoom === 'xl' ? 'text-xl' : 'text-base'

  const themeClass =
    cardTheme === 'paper'
      ? 'bg-[#faf6ed] dark:bg-[#1a1917] border-[#e8dfcf] dark:border-[#2e2c28] text-[#2c2825] dark:text-[#ede7de] shadow-[0_12px_32px_-6px_rgba(180,160,120,0.18)]'
      : cardTheme === 'midnight'
      ? 'bg-[#030712] border-slate-800 text-slate-100 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.6)] ring-1 ring-indigo-500/10'
      : 'bg-card border-slate-200/90 dark:border-slate-800 text-ink shadow-[0_10px_28px_-6px_rgba(15,23,42,0.08),0_3px_8px_-2px_rgba(15,23,42,0.04)]'

  const fontClass = cardFont === 'serif' ? 'font-serif' : cardFont === 'mono' ? 'font-mono' : 'font-sans'

  const cardFace = cx(
    'flip-face flex min-h-[250px] flex-col justify-between rounded-3xl border p-4 sm:min-h-[290px] sm:p-8 transition-shadow',
    themeClass,
    fontClass,
  )

  const dragRotate = isDragging ? dragOffset.x * 0.04 : 0
  const dragX = isDragging ? dragOffset.x : 0
  const dragY = isDragging ? dragOffset.y * 0.35 : 0

  const cardTransformStyle = isDragging
    ? {
        transform: `translate3d(${dragX}px, ${dragY}px, 0) rotate(${dragRotate}deg)`,
        transition: 'none',
      }
    : {
        transform: 'translate3d(0, 0, 0) rotate(0deg)',
        transition: 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }

  return (
    <div className={cx('mx-auto w-full max-w-3xl', fontClass)}>
      {toolbar}

      <SessionHud known={sessionKnownCount} again={sessionAgainCount} streak={sessionStreak} idx={idx} total={order.length} />

      <CardMeta
        cur={cur}
        isRepeat={isRepeat}
        p={p}
        starred={isStarred(cur.collection.id, cur.item.id)}
        onToggleStar={() => {
          toggleStar(cur.collection.id, cur.item.id)
          playSound('click')
        }}
        onToggleBookmark={handleToggleBookmark}
      />

      {/* Thẻ lật 3D có cọc xếp tầng & Pointer Drag Physics */}
      <div className="relative select-text">
        <StackLayers remaining={order.length - idx} cardTheme={cardTheme} />

        {/* Main Card Scene */}
        <div
          style={cardTransformStyle}
          className="flip-scene relative cursor-pointer touch-pan-y"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          role="button"
          tabIndex={0}
          aria-label="Nhấn để lật thẻ hoặc vuốt để đánh giá"
        >
          <DragStamps dragOffset={dragOffset} />

                    <div className={cx('flip-inner relative', flipped && 'flipped')}>
            {/* Mặt trước */}
            <div className={cx(cardFace, zoomClass, flipped && 'pointer-events-none absolute inset-0 overflow-hidden')}>
              <div className="flex flex-1 flex-col justify-center">{frontContent}</div>

              {/* Peek Hint button on front */}
              {!flipped && !inverted && (
                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPeekHint((h) => !h)
                    }}
                    className={cx(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors cursor-pointer border',
                      peekHint
                        ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                        : 'bg-slate-100/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-muted hover:text-ink hover:bg-slate-200/60'
                    )}
                  >
                    <Lightbulb size={13} className={peekHint ? 'fill-amber-500 text-amber-500' : ''} />
                    <span>{peekHint ? 'Ẩn gợi ý' : 'Gợi ý từ khóa'}</span>
                  </button>
                </div>
              )}

              {/* Hint Box */}
              {peekHint && !flipped && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="mt-3 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200 animate-in fade-in zoom-in-95"
                >
                  {getHintText(cur.item)}
                </div>
              )}

              <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted sm:mt-6">
                <RotateCw size={12} />
                <span>Chạm thẻ</span>
                <span className="hidden items-center gap-1.5 sm:inline-flex">
                  hoặc nhấn <kbd className="rounded-md border border-line bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink">Space</kbd>
                </span>
                <span>để lật</span>
              </div>
            </div>

            {/* Mặt sau */}
            <div className={cx(cardFace, zoomClass, 'flip-back', !flipped && 'pointer-events-none absolute inset-0 overflow-hidden')}>
              <div className="flex flex-1 flex-col justify-center">{backContent}</div>
              <div className="mt-6 hidden items-center justify-center gap-1.5 text-[11px] font-medium text-muted sm:flex">
                <span>Đánh giá:</span>
                <kbd className="rounded-md bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-600 dark:text-rose-300">1 Quên</kbd>
                <kbd className="rounded-md bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-700 dark:text-amber-300">2 Khó</kbd>
                <kbd className="rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">3 Được</kbd>
                <kbd className="rounded-md bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-sky-700 dark:text-sky-300">4 Dễ</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {spellingMode && cur?.item.type === 'vocabulary' && !flipped && (
        <SpellingTray
          term={cur.item.content.term}
          value={spellingInput}
          status={spellingStatus}
          onChange={(v) => {
            setSpellingInput(v)
            if (spellingStatus !== 'idle') setSpellingStatus('idle')
          }}
          onCheck={checkSpelling}
        />
      )}

      <ActionDock idx={idx} total={order.length} go={go} grade={grade} />

      <NoteBox collectionId={cur.collection.id} itemId={cur.item.id} className="mt-3.5" />

      <HotkeysBar />

      <CardGridModal
        open={showCardGrid}
        onClose={() => setShowCardGrid(false)}
        order={order}
        idx={idx}
        get={get}
        onPick={(i) => {
          setIdx(i)
          setFlipped(false)
          setShowCardGrid(false)
        }}
      />

      {showHelp && <ShortcutsHelp onClose={() => setShowHelp(false)} />}

      <ThemeModal
        open={showThemeSettings}
        onClose={() => setShowThemeSettings(false)}
        cardTheme={cardTheme}
        cardFont={cardFont}
        changeTheme={changeTheme}
        changeFont={changeFont}
      />
    </div>
  )
}
