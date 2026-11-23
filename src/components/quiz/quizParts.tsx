import type { Answer, Question } from '../../services/quiz/generate'
import { cx } from '../../utils'
import { isMulti, toggleKey } from '../../utils/answers'
import { playMechSound } from '../../utils/mechSound'
import { haptic } from '../../utils/haptic'

export const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export function correctText(q: Question): string {
  switch (q.kind) {
    case 'mc':
      return `${[...q.answer].join(', ')}. ${q.answerText}`
    case 'tf':
      return q.answer ? 'Đúng' : 'Sai'
    case 'match':
      return q.pairs.map((p) => `${p.left} → ${p.right}`).join('\n')
    default:
      return q.answer
  }
}

export function answerText(q: Question, a: Answer): string {
  if (a === undefined || a === '') return '(chưa trả lời)'
  if (q.kind === 'mc') {
    const picked = [...String(a)].map((k) => q.options.find((x) => x.key === k)).filter(Boolean)
    return picked.length ? `${picked.map((o) => o!.key).join(', ')}. ${picked.map((o) => o!.text).join(' · ')}` : String(a)
  }
  if (q.kind === 'tf') return a ? 'Đúng' : 'Sai'
  if (q.kind === 'match')
    return q.pairs.map((p, i) => `${p.left} → ${(a as Record<number, string>)[i] ?? '—'}`).join('\n')
  return String(a)
}

export function QuizInput({
  q,
  value,
  onChange,
  locked,
  onEnter,
  eliminated,
  onToggleEliminate,
}: {
  q: Question
  value: Answer
  onChange: (a: Answer) => void
  locked: boolean
  onEnter?: () => void
  eliminated?: Set<string>
  onToggleEliminate?: (key: string) => void
}) {
  if (q.kind === 'mc') {
    const multi = isMulti(q.answer)
    const picked = String(value ?? '')
    return (
      <>
        {multi && (
          <p className="mb-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            Chọn {q.answer.length} đáp án đúng (có thể chọn nhiều)
          </p>
        )}
        <ul className="space-y-2.5">
          {q.options.map((o) => {
            const sel = picked.includes(o.key)
            const showRes = locked
            const isElim = eliminated?.has(o.key) && !locked
            return (
              <li key={o.key}>
                <button
                  disabled={locked}
                  onClick={() => {
                    haptic('select')
                    playMechSound('keydown')
                    onChange(multi ? toggleKey(picked, o.key) : o.key)
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    if (!locked && onToggleEliminate) onToggleEliminate(o.key)
                  }}
                  className={cx(
                    'group flex w-full items-center rounded-2xl border-2 px-4 py-3.5 text-left text-[15px] transition-all duration-150 cursor-pointer relative active:scale-[0.98]',
                    isElim && 'line-through opacity-45 bg-slate-100/50 dark:bg-slate-800/20 border-dashed border-line',
                    !showRes && !isElim && (sel ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 font-medium' : 'border-line bg-card hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'),
                    showRes && q.answer.includes(o.key) && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-semibold',
                    showRes && sel && !q.answer.includes(o.key) && 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100',
                    showRes && !sel && !q.answer.includes(o.key) && 'border-line bg-card/60 opacity-60 text-muted',
                  )}
                >
                  <span
                    className={cx(
                      'mr-3 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border text-xs font-bold transition-colors',
                      sel && !showRes
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-line bg-slate-100 dark:bg-slate-800 text-muted group-hover:border-ink',
                      isElim && 'line-through opacity-50'
                    )}
                  >
                    {o.key}
                  </span>
                  <span className="flex-1 leading-relaxed">{o.text}</span>
                  <kbd className="ml-2 hidden sm:inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-muted group-hover:text-ink shadow-2xs">
                    {o.key}
                  </kbd>
                  {!locked && onToggleEliminate && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleEliminate(o.key)
                      }}
                      title={isElim ? 'Bỏ gạch đáp án' : 'Gạch bỏ đáp án loại trừ (hoặc chuột phải)'}
                      className={cx(
                        'opacity-0 group-hover:opacity-100 transition-opacity ml-2 px-2 py-0.5 rounded-lg text-xs font-bold text-muted hover:text-ink hover:bg-slate-200/60 dark:hover:bg-slate-700',
                        isElim && 'opacity-100 text-rose-500 font-normal line-through'
                      )}
                    >
                      {isElim ? 'Bỏ gạch' : 'Loại trừ'}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </>
    )
  }
  if (q.kind === 'tf')
    return (
      <div className="flex gap-3">
        {[true, false].map((v, idx) => (
          <button
            key={String(v)}
            disabled={locked}
            onClick={() => {
              haptic('select')
              playMechSound('keydown')
              onChange(v)
            }}
            className={cx(
              'group flex flex-1 items-center justify-center gap-2.5 rounded-2xl border-2 px-4 py-4 text-base font-bold transition-all cursor-pointer active:scale-[0.98]',
              !locked && (value === v ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' : 'border-line bg-card hover:bg-slate-50 dark:hover:bg-slate-800'),
              locked && v === q.answer && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
              locked && value === v && v !== q.answer && 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
              locked && value !== v && v !== q.answer && 'border-line text-muted opacity-50',
            )}
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-line text-xs font-mono text-muted">
              {idx + 1}
            </span>
            <span>{v ? 'Đúng' : 'Sai'}</span>
          </button>
        ))}
      </div>
    )
  if (q.kind === 'match') {
    const m = (value ?? {}) as Record<number, string>
    return (
      <div className="space-y-3">
        {q.pairs.map((p, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] items-center gap-2 sm:gap-3">
            <div className="text-[15px] font-medium text-ink">{p.left}</div>
            <select
              disabled={locked}
              value={m[i] ?? ''}
              onChange={(e) => onChange({ ...m, [i]: e.target.value })}
              className={cx(
                'rounded-xl border bg-card px-3 py-2 text-sm outline-none transition-colors cursor-pointer',
                locked ? (m[i] === p.right ? 'border-emerald-500 text-emerald-700' : 'border-rose-500 text-rose-700') : 'border-line focus:border-indigo-500',
              )}
            >
              <option value="">— chọn đáp án ghép đôi —</option>
              {q.rights.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    )
  }
  return (
    <input
      autoFocus
      disabled={locked}
      value={(value as string) ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onEnter?.()
        }
      }}
      placeholder="Nhập câu trả lời (nhấn Enter để xác nhận)…"
      className="w-full rounded-2xl border border-line bg-card px-4 py-3.5 text-[15px] outline-none transition-colors focus:border-indigo-500"
    />
  )
}

export function promptTitle(q: Question) {
  if (q.kind === 'fill') return 'Điền từ còn thiếu'
  if (q.kind === 'short') return 'Khái niệm ứng với mô tả sau'
  return null
}

