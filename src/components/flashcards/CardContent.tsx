import { useState, type ReactNode } from 'react'
import {
  BookOpen,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  Link2,
  Sparkles,
  Tags,
  Volume2,
  X,
} from 'lucide-react'
import type { Item, VocabularyContent } from '../../types'
import { cx } from '../../utils'
import { isMulti, sameKeys } from '../../utils/answers'
import { speakEnglish, stopSpeaking } from '../../utils/speech'
import HighlightableText from '../ui/HighlightableText'
import AnswerNote from '../ui/AnswerNote'

/** badge colour per option letter */
const KEY_TONE: Record<string, string> = {
  A: 'bg-sky-100 text-sky-700',
  B: 'bg-violet-100 text-violet-700',
  C: 'bg-amber-100 text-amber-700',
  D: 'bg-teal-100 text-teal-700',
  E: 'bg-rose-100 text-rose-700',
}

const Label = ({ children }: { children: ReactNode }) => (
  <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
    {children}
  </div>
)

export function Enrichment({ item }: { item: Item }) {
  if (!item.enrichment) return null
  return (
    <div className="mt-3 rounded-2xl bg-indigo-50/60 p-4 text-sm text-slate-800">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700">
        <Sparkles size={14} />
        <span>{item.enrichment.confidence === 'uncertain' ? 'Bổ sung (tham khảo)' : 'Bối cảnh lịch sử / Kiến thức mở rộng'}</span>
      </div>
      <p className="leading-relaxed text-[14.5px] text-slate-700">{item.enrichment.text}</p>
      {item.enrichment.reference && (
        <p className="mt-2 text-xs italic text-slate-500">Nguồn: {item.enrichment.reference}</p>
      )}
    </div>
  )
}

function getPosBadge(pos?: string) {
  if (!pos) return null
  const p = pos.toLowerCase().trim()
  if (p.includes('noun') || p === 'n' || p === 'n.' || p.includes('danh')) {
    return { label: 'Noun', tone: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' }
  }
  if (p.includes('verb') || p === 'v' || p === 'v.' || p.includes('động')) {
    return { label: 'Verb', tone: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' }
  }
  if (p.includes('adj') || p === 'a' || p === 'adj.' || p.includes('tính')) {
    return { label: 'Adjective', tone: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' }
  }
  if (p.includes('adv') || p === 'adv.' || p.includes('trạng')) {
    return { label: 'Adverb', tone: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' }
  }
  if (p.includes('phrase') || p.includes('phrasal') || p.includes('cụm')) {
    return { label: 'Phrasal Verb', tone: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' }
  }
  if (p.includes('idiom') || p.includes('thành ngữ')) {
    return { label: 'Idiom', tone: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' }
  }
  return { label: pos, tone: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' }
}

function renderSentenceWithHighlight(sentence: string, term: string) {
  if (!sentence || !term) return sentence
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = sentence.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="rounded-md bg-amber-200/80 dark:bg-amber-900/60 px-1 py-0.5 font-bold text-amber-950 dark:text-amber-100 not-italic">
        {part}
      </span>
    ) : (
      part
    )
  )
}

function VocabCardFront({ content }: { content: VocabularyContent }) {
  const [playing, setPlaying] = useState<'US' | 'UK' | null>(null)
  const [rate, setRate] = useState<number>(1.0)
  const posBadge = getPosBadge(content.partOfSpeech)

  const handleSpeak = (e: React.MouseEvent, accent: 'US' | 'UK') => {
    e.stopPropagation()
    setPlaying(accent)
    speakEnglish(content.term, {
      accent,
      rate,
      onEnd: () => setPlaying(null),
    })
  }

  const toggleRate = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRate((r) => (r === 1.0 ? 0.8 : 1.0))
  }

  return (
    <div className="py-6 sm:py-8 text-center max-w-xl mx-auto">
      {/* Badges bar */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
          Từ vựng Tiếng Anh
        </span>
        {posBadge && (
          <span className={cx('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider', posBadge.tone)}>
            {posBadge.label}
          </span>
        )}
      </div>

      {/* Main Term */}
      <div className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white select-text">
        {content.term}
      </div>

      {/* Pronunciation IPA */}
      {content.pronunciation && (
        <div className="mt-3.5 inline-flex items-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/60 px-3.5 py-1.5 font-mono text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
          <span>{content.pronunciation}</span>
        </div>
      )}

      {/* Audio Pronunciation Controls */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => handleSpeak(e, 'US')}
          className={cx(
            'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 cursor-pointer',
            playing === 'US'
              ? 'border-indigo-600 bg-indigo-600 text-white animate-pulse'
              : 'border-slate-200 dark:border-line bg-white dark:bg-card text-slate-700 dark:text-ink hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30'
          )}
          title="Phát âm giọng Mỹ (US)"
        >
          <Volume2 size={16} className={playing === 'US' ? 'animate-bounce' : 'text-indigo-600 dark:text-indigo-400'} />
          <span>Giọng US</span>
        </button>

        <button
          type="button"
          onClick={(e) => handleSpeak(e, 'UK')}
          className={cx(
            'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 cursor-pointer',
            playing === 'UK'
              ? 'border-violet-600 bg-violet-600 text-white animate-pulse'
              : 'border-slate-200 dark:border-line bg-white dark:bg-card text-slate-700 dark:text-ink hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50/50 dark:hover:bg-violet-950/30'
          )}
          title="Phát âm giọng Anh (UK)"
        >
          <Volume2 size={16} className={playing === 'UK' ? 'animate-bounce' : 'text-violet-600 dark:text-violet-400'} />
          <span>Giọng UK</span>
        </button>

        <button
          type="button"
          onClick={toggleRate}
          className={cx(
            'inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-line bg-white dark:bg-card px-2.5 py-2 text-xs font-bold text-slate-600 dark:text-muted hover:text-slate-900 dark:hover:text-ink transition-colors cursor-pointer shadow-xs',
            rate === 0.8 && 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
          )}
          title="Tốc độ đọc (1.0x bình thường, 0.8x đọc chậm)"
        >
          <span>{rate}x</span>
          {rate === 0.8 && <span className="text-[10px] font-bold uppercase">(Chậm)</span>}
        </button>
      </div>

      <div className="mt-6 text-xs text-slate-400 dark:text-slate-500 font-medium">
        Nhấn phím Cách (Space) hoặc bấm vào thẻ để xem nghĩa & ví dụ
      </div>
    </div>
  )
}

function VocabCardBack({ item, itemKey }: { item: Extract<Item, { type: 'vocabulary' }>; itemKey?: string }) {
  const c = item.content
  const [showTranslation, setShowTranslation] = useState(true)
  const [playingItem, setPlayingItem] = useState<string | null>(null)
  const [rate, setRate] = useState<number>(1.0)
  const posBadge = getPosBadge(c.partOfSpeech)

  const handleSpeakWord = (e: React.MouseEvent, accent: 'US' | 'UK') => {
    e.stopPropagation()
    setPlayingItem(accent)
    speakEnglish(c.term, {
      accent,
      rate,
      onEnd: () => setPlayingItem(null),
    })
  }

  const handleSpeakExample = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!c.example) return
    setPlayingItem('example')
    speakEnglish(c.example, {
      accent: 'US',
      rate,
      onEnd: () => setPlayingItem(null),
    })
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 text-[15px]" onClick={(e) => e.stopPropagation()}>
      {/* Mini header with term reminder & audio */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-line/60 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{c.term}</span>
          {c.pronunciation && (
            <span className="font-mono text-xs sm:text-sm text-slate-500 dark:text-muted">
              {c.pronunciation}
            </span>
          )}
          {posBadge && (
            <span className={cx('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', posBadge.tone)}>
              {posBadge.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => handleSpeakWord(e, 'US')}
            className={cx(
              'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold transition-all cursor-pointer',
              playingItem === 'US'
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-200 dark:border-line bg-white dark:bg-card text-slate-700 dark:text-ink hover:border-indigo-300'
            )}
            title="Nghe phát âm US"
          >
            <Volume2 size={13} className={playingItem === 'US' ? 'animate-bounce' : 'text-indigo-600 dark:text-indigo-400'} />
            <span>US</span>
          </button>
          <button
            type="button"
            onClick={(e) => handleSpeakWord(e, 'UK')}
            className={cx(
              'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold transition-all cursor-pointer',
              playingItem === 'UK'
                ? 'border-violet-600 bg-violet-600 text-white'
                : 'border-slate-200 dark:border-line bg-white dark:bg-card text-slate-700 dark:text-ink hover:border-violet-300'
            )}
            title="Nghe phát âm UK"
          >
            <Volume2 size={13} className={playingItem === 'UK' ? 'animate-bounce' : 'text-violet-600 dark:text-violet-400'} />
            <span>UK</span>
          </button>
        </div>
      </div>

      {/* Meaning Banner */}
      <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/40 p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 size={14} />
          <span>Ý nghĩa chuẩn</span>
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-950 dark:text-emerald-200 leading-snug">
          {c.meaning}
        </div>
      </div>

      {/* Example Sentence with Audio and Bilingual toggle */}
      {c.example && (
        <div className="rounded-2xl border border-slate-200 dark:border-line bg-white dark:bg-card p-4 sm:p-4.5 shadow-2xs">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-muted">
              <BookOpen size={13} className="text-indigo-500" />
              <span>Ví dụ thực tế</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSpeakExample}
                className={cx(
                  'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold transition-all cursor-pointer',
                  playingItem === 'example'
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-slate-200 dark:border-line bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-muted hover:text-ink'
                )}
                title="Đọc toàn bộ câu ví dụ"
              >
                <Volume2 size={13} />
                <span>Đọc ví dụ</span>
              </button>
              {c.translation && (
                <button
                  type="button"
                  onClick={() => setShowTranslation((prev) => !prev)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-line bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-600 dark:text-muted hover:text-ink transition-colors cursor-pointer"
                  title={showTranslation ? 'Ẩn bản dịch tiếng Việt' : 'Hiện bản dịch tiếng Việt'}
                >
                  {showTranslation ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{showTranslation ? 'Ẩn dịch' : 'Hiện dịch'}</span>
                </button>
              )}
            </div>
          </div>

          <p className="font-serif italic text-base sm:text-lg leading-relaxed text-slate-800 dark:text-slate-100">
            "{renderSentenceWithHighlight(c.example, c.term)}"
          </p>

          {c.translation && showTranslation && (
            <p className="mt-2.5 border-t border-slate-100 dark:border-line/60 pt-2 text-sm text-slate-600 dark:text-muted leading-relaxed">
              {c.translation}
            </p>
          )}
        </div>
      )}

      {/* Collocations */}
      {!!c.collocations?.length && (
        <div className="rounded-2xl border border-slate-200 dark:border-line bg-white dark:bg-card p-4 shadow-2xs">
          <div className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-muted">
            <Link2 size={13} className="text-indigo-500" />
            <span>Cụm từ thông dụng (Collocations)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {c.collocations.map((col) => (
              <span
                key={col}
                className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/40 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 shadow-2xs"
              >
                {col}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Synonyms */}
      {!!c.synonyms?.length && (
        <div className="rounded-2xl border border-slate-200 dark:border-line bg-white dark:bg-card p-4 shadow-2xs">
          <div className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-muted">
            <Tags size={13} className="text-violet-500" />
            <span>Từ đồng nghĩa & Mở rộng</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {c.synonyms.map((syn) => (
              <span
                key={syn}
                className="inline-flex items-center rounded-xl border border-slate-200 dark:border-line bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {syn}
              </span>
            ))}
          </div>
        </div>
      )}

      <Enrichment item={item} />
      {itemKey && <AnswerNote itemKey={itemKey} />}
    </div>
  )
}

export function CardFront({
  item,
  itemKey,
  picked,
  onPick,
  draft,
  onConfirm,
}: {
  item: Item
  itemKey?: string
  picked?: string
  onPick?: (key: string) => void
  /** multi-answer questions: keys selected but not confirmed yet */
  draft?: string
  onConfirm?: () => void
}) {
  switch (item.type) {
    case 'vocabulary':
      return <VocabCardFront content={item.content} />

    case 'multiple-choice': {
      const multi = isMulti(item.content.answer)
      const done = picked !== undefined
      const allRight = done && sameKeys(picked!, item.content.answer)
      return (
        <div className="mx-auto w-full max-w-2xl">
          {/* Huy hiệu + câu hỏi, căn giữa */}
          <div className="mb-3 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              <HelpCircle size={13} />
              {multi ? `Chọn ${item.content.answer.length} đáp án` : 'Trắc nghiệm'}
            </span>
          </div>
          {itemKey ? (
            <HighlightableText
              text={item.content.question}
              itemKey={itemKey}
              field="q"
              className={`${item.content.question.length > 90 ? 'text-left sm:text-center' : 'text-center'} text-[17px] font-bold leading-relaxed tracking-tight text-ink sm:text-lg md:text-xl`}
              as="h2"
            />
          ) : (
            <h2 className={`${item.content.question.length > 90 ? 'text-left sm:text-center' : 'text-center'} text-[17px] font-bold leading-relaxed tracking-tight text-ink sm:text-lg md:text-xl`}>{item.content.question}</h2>
          )}

          {/* Phương án dạng thẻ lựa chọn: huy hiệu chữ cái màu, hover nhấc nhẹ */}
          <div className="mt-5 space-y-2.5" onClick={(e) => done && e.stopPropagation()}>
            {item.content.options.map((o) => {
              const right = item.content.answer.includes(o.key)
              const chosenKeys = done ? picked! : draft ?? ''
              const isChosen = chosenKeys.includes(o.key)
              const wrongPick = done && isChosen && !right
              const tone = KEY_TONE[o.key] ?? KEY_TONE.A
              return (
                <button
                  key={o.key}
                  type="button"
                  disabled={done || !onPick}
                  onClick={(e) => {
                    e.stopPropagation()
                    onPick?.(o.key)
                  }}
                  className={cx(
                    'group flex w-full items-center gap-3.5 rounded-2xl border-2 px-3.5 py-3 text-left transition-all duration-200',
                    !done && !isChosen && 'border-slate-200 dark:border-line bg-white dark:bg-card shadow-xs hover:-translate-y-0.5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md active:translate-y-0',
                    !done && isChosen && 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 shadow-md',
                    done && right && 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
                    wrongPick && 'border-rose-400 bg-rose-50 dark:bg-rose-950/60',
                    done && !right && !wrongPick && 'border-slate-100 dark:border-line bg-slate-50/60 dark:bg-slate-800/40 opacity-60',
                  )}
                >
                  <span
                    className={cx(
                      'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold transition-colors',
                      !done && !isChosen && tone,
                      !done && isChosen && 'bg-indigo-600 text-white',
                      done && right && 'bg-emerald-500 text-white',
                      wrongPick && 'bg-rose-500 text-white',
                      done && !right && !wrongPick && 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300',
                    )}
                  >
                    {done && right ? <Check size={16} strokeWidth={3} /> : wrongPick ? <X size={16} strokeWidth={3} /> : o.key}
                  </span>
                  <span className="flex-1 text-[15px] font-medium leading-relaxed text-slate-800 dark:text-ink">{o.text}</span>
                </button>
              )
            })}
          </div>

          {!done && multi && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                disabled={!draft}
                onClick={(e) => {
                  e.stopPropagation()
                  onConfirm?.()
                }}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                Xác nhận đáp án
              </button>
            </div>
          )}

          {done && (
            <div
              className={cx('mt-4 rounded-2xl p-4 text-sm', allRight ? 'bg-emerald-50' : 'bg-rose-50')}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={cx('text-base font-extrabold', allRight ? 'text-emerald-700' : 'text-rose-700')}>
                {allRight ? 'Chính xác!' : `Chưa đúng — đáp án đúng là ${[...item.content.answer].join(', ')}`}
              </div>
              {item.content.explanation ? (
                <p className="mt-1.5 leading-relaxed text-slate-700">{item.content.explanation}</p>
              ) : (
                !item.enrichment && <p className="mt-1.5 text-muted">Tài liệu gốc chưa có giải thích.</p>
              )}
              <Enrichment item={item} />
            </div>
          )}
        </div>
      )
    }

    case 'true-false':
      return (
        <div className="py-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700">
            Đúng hay Sai?
          </span>
          <p className="mt-5 text-xl md:text-2xl font-bold leading-relaxed text-ink">{item.content.statement}</p>
        </div>
      )

    case 'theory':
      return (
        <div className="py-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
            Khái niệm lý thuyết
          </span>
          <div className="mt-5 text-2xl md:text-3xl font-extrabold leading-snug text-ink">{item.content.concept}</div>
        </div>
      )

    case 'programming':
      return (
        <div className="py-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
            Khái niệm lập trình
          </span>
          <div className="mt-5 text-2xl md:text-3xl font-extrabold leading-snug text-ink">{item.content.concept}</div>
        </div>
      )

    default:
      return null
  }
}

export function CardBack({ item, itemKey }: { item: Item; itemKey?: string }) {
  switch (item.type) {
    case 'vocabulary':
      return <VocabCardBack item={item} itemKey={itemKey} />

    case 'multiple-choice': {
      const c = item.content
      const correctKeys = [...c.answer]
      const correctOptions = correctKeys.map((k) => c.options.find((o) => o.key === k)).filter(Boolean)

      return (
        <div className="mx-auto w-full max-w-2xl space-y-3">
          {/* 1 giây: đáp án đúng, chữ to, nền xanh dịu */}
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-4 md:p-5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={14} /> Đáp án đúng
            </div>
            <div className="mt-2.5 space-y-2">
              {correctOptions.map((o) => (
                <div key={o!.key} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-extrabold text-white shadow-sm">
                    {o!.key}
                  </span>
                  <span className="text-lg font-bold leading-snug text-emerald-950 dark:text-emerald-200 md:text-xl">{o!.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Giải thích: nhỏ hơn, nền trắng, có vạch nhấn */}
          {(c.explanation || !item.enrichment) && (
            <div className="rounded-2xl border border-slate-200 dark:border-line border-l-4 border-l-indigo-400 bg-white dark:bg-card p-4">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-muted">
                <BookOpen size={13} className="text-indigo-500" /> Giải thích
              </div>
              {itemKey && c.explanation ? (
                <HighlightableText
                  text={c.explanation}
                  itemKey={itemKey}
                  field="e"
                  className="text-[14.5px] leading-relaxed text-slate-700 dark:text-slate-200"
                  as="p"
                />
              ) : (
                <p className={cx('text-[14.5px] leading-relaxed', c.explanation ? 'text-slate-700 dark:text-slate-200' : 'italic text-muted')}>
                  {c.explanation ?? 'Tài liệu gốc chưa có giải thích cho câu này.'}
                </p>
              )}
            </div>
          )}

          <Enrichment item={item} />
          {itemKey && <AnswerNote itemKey={itemKey} />}
        </div>
      )
    }

    case 'true-false':
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-6 text-center shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Kết luận chính xác</div>
            <div className={cx('mt-2 text-4xl font-black', item.content.answer ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
              {item.content.answer ? 'ĐÚNG' : 'SAI'}
            </div>
          </div>
          {item.content.explanation && (
            <div className="rounded-2xl border border-slate-200 dark:border-line bg-white dark:bg-card p-4">
              <Label>Giải thích</Label>
              <p className="text-[15px] leading-relaxed text-slate-800 dark:text-slate-200">{item.content.explanation}</p>
            </div>
          )}
          <Enrichment item={item} />
        </div>
      )

    case 'theory':
      return (
        <div className="space-y-4 text-[15px]">
          <div>
            <Label>Định nghĩa chuẩn</Label>
            <p className="text-xl font-bold leading-relaxed text-slate-900 dark:text-ink">{item.content.definition}</p>
          </div>
          {!!item.content.points?.length && (
            <div className="rounded-2xl border border-slate-200 dark:border-line bg-slate-50/70 dark:bg-slate-800/40 p-4">
              <Label>Ý chính cần nhớ</Label>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-slate-800 dark:text-slate-200">
                {item.content.points.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}
          {item.content.explanation && (
            <div>
              <Label>Giải thích</Label>
              <p className="leading-relaxed text-slate-700 dark:text-slate-300">{item.content.explanation}</p>
            </div>
          )}
          <Enrichment item={item} />
        </div>
      )

    case 'programming':
      return (
        <div className="space-y-4 text-[15px]">
          <div>
            <Label>Định nghĩa</Label>
            <p className="text-xl font-bold leading-relaxed text-slate-900 dark:text-ink">{item.content.definition}</p>
          </div>
          {item.content.code && (
            <div>
              <Label>Code minh hoạ {item.content.language ? `(${item.content.language})` : ''}</Label>
              <pre className="mt-1 overflow-x-auto rounded-2xl bg-slate-900 dark:bg-slate-950 p-4 text-[13px] leading-relaxed text-slate-100 shadow-md border border-transparent dark:border-line">
                <code>{item.content.code}</code>
              </pre>
            </div>
          )}
          {item.content.explanation && (
            <div>
              <Label>Giải thích</Label>
              <p className="leading-relaxed text-slate-700 dark:text-slate-300">{item.content.explanation}</p>
            </div>
          )}
          {item.content.application && (
            <div>
              <Label>Ứng dụng thực tế</Label>
              <p className="leading-relaxed text-slate-700">{item.content.application}</p>
            </div>
          )}
          <Enrichment item={item} />
        </div>
      )

    default:
      return null
  }
}
