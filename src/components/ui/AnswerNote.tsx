import { AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { conflictFor } from '../../data/conflicts'
import { getCollection } from '../../data'
import { setAnswerFlag, useAnswerFlag } from '../../services/storage/answerFlags'
import { cx } from '../../utils'

/**
 * Under an answer: warns when another deck gives a different key for the same question, and lets the learner mark
 * the key as doubtful, or as checked against the textbook. The deck content is never changed.
 */
export default function AnswerNote({ itemKey, className }: { itemKey: string; className?: string }) {
  const sep = itemKey.indexOf('::')
  const collectionId = itemKey.slice(0, sep)
  const itemId = itemKey.slice(sep + 2)
  const conflict = conflictFor(collectionId, itemId)
  const flag = useAnswerFlag(itemKey)

  const stop = (e: { stopPropagation(): void }) => e.stopPropagation() // inside a flashcard: do not flip it
  const btn = 'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors'

  return (
    <div className={cx('space-y-2 text-xs', className)} onClick={stop}>
      {conflict && (
        <div className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            <b>Hai bộ ghi đáp án khác nhau cho câu này.</b> Bộ “{getCollection(conflict.collectionId)?.title ?? conflict.collectionId}” ghi:{' '}
            <b>{conflict.answers.join(' · ') || '(không rõ)'}</b>. Chưa biết bên nào đúng, hãy đối chiếu giáo trình.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {flag?.status === 'suspect' && (
          <span className={cx(btn, 'cursor-default border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300')}>
            <AlertTriangle size={13} /> Bạn đã đánh dấu nghi vấn
          </span>
        )}
        {flag?.status === 'verified' && (
          <span className={cx(btn, 'cursor-default border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300')}>
            <CheckCircle2 size={13} /> Bạn đã đối chiếu: đáp án đúng
          </span>
        )}

        {flag ? (
          <button type="button" onClick={() => setAnswerFlag(itemKey, null)} className={cx(btn, 'border-line text-muted hover:text-ink')}>
            <X size={13} /> Bỏ đánh dấu
          </button>
        ) : (
          <>
            <button type="button" onClick={() => setAnswerFlag(itemKey, 'suspect')} className={cx(btn, 'border-line text-muted hover:border-rose-300 hover:text-rose-600')}>
              <AlertTriangle size={13} /> Nghi đáp án sai
            </button>
            {conflict && (
              <button type="button" onClick={() => setAnswerFlag(itemKey, 'verified')} className={cx(btn, 'border-line text-muted hover:border-emerald-300 hover:text-emerald-600')}>
                <CheckCircle2 size={13} /> Đã đối chiếu: đáp án này đúng
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
