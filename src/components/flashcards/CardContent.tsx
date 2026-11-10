import { type ReactNode } from 'react'
import { BookOpen, Check, CheckCircle2, HelpCircle, Sparkles, X } from 'lucide-react'
import type { Item } from '../../types'
import { cx } from '../../utils'
import { isMulti, sameKeys } from '../../utils/answers'

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

function Enrichment({ item }: { item: Item }) {
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

export function CardFront({
  item,
  picked,
  onPick,
  draft,
  onConfirm,
}: {
  item: Item
  picked?: string
  onPick?: (key: string) => void
  /** multi-answer questions: keys selected but not confirmed yet */
  draft?: string
  onConfirm?: () => void
}) {
  switch (item.type) {
    case 'vocabulary':
      return (
        <div className="py-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-600">
            Từ vựng
          </span>
          <div className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight text-ink">{item.content.term}</div>
          {item.content.pronunciation && (
            <div className="mt-2.5 font-mono text-sm font-medium text-muted">{item.content.pronunciation}</div>
          )}
          {item.content.partOfSpeech && (
            <div className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-0.5 text-xs font-medium text-slate-600">
              {item.content.partOfSpeech}
            </div>
          )}
        </div>
      )

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
          <h2 className="text-center text-lg font-bold leading-relaxed tracking-tight text-ink md:text-xl">{item.content.question}</h2>

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
                    !done && !isChosen && 'border-slate-200 bg-white shadow-xs hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md active:translate-y-0',
                    !done && isChosen && 'border-indigo-500 bg-indigo-50 shadow-md',
                    done && right && 'border-emerald-400 bg-emerald-50',
                    wrongPick && 'border-rose-400 bg-rose-50',
                    done && !right && !wrongPick && 'border-slate-100 bg-slate-50/60 opacity-60',
                  )}
                >
                  <span
                    className={cx(
                      'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold transition-colors',
                      !done && !isChosen && tone,
                      !done && isChosen && 'bg-indigo-600 text-white',
                      done && right && 'bg-emerald-500 text-white',
                      wrongPick && 'bg-rose-500 text-white',
                      done && !right && !wrongPick && 'bg-slate-200 text-slate-500',
                    )}
                  >
                    {done && right ? <Check size={16} strokeWidth={3} /> : wrongPick ? <X size={16} strokeWidth={3} /> : o.key}
                  </span>
                  <span className="flex-1 text-[15px] font-medium leading-relaxed text-slate-800">{o.text}</span>
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

export function CardBack({ item }: { item: Item }) {
  switch (item.type) {
    case 'vocabulary': {
      const c = item.content
      return (
        <div className="space-y-4 text-[15px]">
          <div>
            <Label>Ý nghĩa chuẩn</Label>
            <div className="text-3xl font-extrabold tracking-tight text-emerald-600">{c.meaning}</div>
          </div>
          {c.example && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <Label>Ví dụ minh hoạ</Label>
              <p className="italic font-serif text-slate-800 text-[15.5px]">"{c.example}"</p>
              {c.translation && <p className="mt-1.5 text-sm text-muted">{c.translation}</p>}
            </div>
          )}
          {!!c.collocations?.length && (
            <div>
              <Label>Cụm từ đi kèm</Label>
              <p className="text-sm font-semibold text-slate-700">{c.collocations.join(' · ')}</p>
            </div>
          )}
          {!!c.synonyms?.length && (
            <div>
              <Label>Từ đồng nghĩa</Label>
              <p className="text-sm font-semibold text-slate-700">{c.synonyms.join(', ')}</p>
            </div>
          )}
          <Enrichment item={item} />
        </div>
      )
    }

    case 'multiple-choice': {
      const c = item.content
      const correctKeys = [...c.answer]
      const correctOptions = correctKeys.map((k) => c.options.find((o) => o.key === k)).filter(Boolean)

      return (
        <div className="mx-auto w-full max-w-2xl space-y-3">
          {/* 1 giây: đáp án đúng, chữ to, nền xanh dịu */}
          <div className="rounded-2xl bg-emerald-50 p-4 md:p-5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              <CheckCircle2 size={14} /> Đáp án đúng
            </div>
            <div className="mt-2.5 space-y-2">
              {correctOptions.map((o) => (
                <div key={o!.key} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-extrabold text-white shadow-sm">
                    {o!.key}
                  </span>
                  <span className="text-lg font-bold leading-snug text-emerald-900 md:text-xl">{o!.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Giải thích: nhỏ hơn, nền trắng, có vạch nhấn */}
          {(c.explanation || !item.enrichment) && (
            <div className="rounded-2xl border border-slate-200 border-l-4 border-l-indigo-400 bg-white p-4">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <BookOpen size={13} className="text-indigo-500" /> Giải thích
              </div>
              <p className={cx('text-[14.5px] leading-relaxed', c.explanation ? 'text-slate-700' : 'italic text-muted')}>
                {c.explanation ?? 'Tài liệu gốc chưa có giải thích cho câu này.'}
              </p>
            </div>
          )}

          <Enrichment item={item} />
        </div>
      )
    }

    case 'true-false':
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-6 text-center shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">Kết luận chính xác</div>
            <div className={cx('mt-2 text-4xl font-black', item.content.answer ? 'text-emerald-700' : 'text-rose-600')}>
              {item.content.answer ? 'ĐÚNG' : 'SAI'}
            </div>
          </div>
          {item.content.explanation && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <Label>Giải thích</Label>
              <p className="text-[15px] leading-relaxed text-slate-800">{item.content.explanation}</p>
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
            <p className="text-xl font-bold leading-relaxed text-slate-900">{item.content.definition}</p>
          </div>
          {!!item.content.points?.length && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <Label>Ý chính cần nhớ</Label>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-slate-800">
                {item.content.points.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}
          {item.content.explanation && (
            <div>
              <Label>Giải thích</Label>
              <p className="leading-relaxed text-slate-700">{item.content.explanation}</p>
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
            <p className="text-xl font-bold leading-relaxed text-slate-900">{item.content.definition}</p>
          </div>
          {item.content.code && (
            <div>
              <Label>Code minh hoạ {item.content.language ? `(${item.content.language})` : ''}</Label>
              <pre className="mt-1 overflow-x-auto rounded-2xl bg-slate-900 p-4 text-[13px] leading-relaxed text-slate-100 shadow-md">
                <code>{item.content.code}</code>
              </pre>
            </div>
          )}
          {item.content.explanation && (
            <div>
              <Label>Giải thích</Label>
              <p className="leading-relaxed text-slate-700">{item.content.explanation}</p>
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
