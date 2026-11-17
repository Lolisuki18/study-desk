import { useEffect, useState } from 'react'
import { StickyNote } from 'lucide-react'
import { useProgress } from '../../features/learning/ProgressContext'
import { progressKey } from '../../data'
import { cx } from '../../utils'

/** Personal note on one item. Saved to IndexedDB when the box loses focus; never touches the collection content. */
export default function NoteBox({ collectionId, itemId, className }: { collectionId: string; itemId: string; className?: string }) {
  const { notes, setNote } = useProgress()
  const key = progressKey(collectionId, itemId)
  const saved = notes.get(key)?.text ?? ''
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(saved)

  useEffect(() => {
    setOpen(false)
    setText(saved)
    // reset only when moving to another item
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const close = () => {
    setNote(collectionId, itemId, text)
    setText(text.trim())
    setOpen(false)
  }

  if (open)
    return (
      <div className={className}>
        <textarea
          autoFocus
          value={text}
          rows={3}
          onChange={(e) => setText(e.target.value)}
          onBlur={close}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) e.currentTarget.blur()
          }}
          placeholder="Ghi chú của riêng bạn cho câu này (mẹo nhớ, chỗ hay nhầm…)"
          className="w-full rounded-xl border border-amber-300 bg-amber-50/60 px-3 py-2 text-sm leading-relaxed outline-none focus:border-amber-500"
        />
        <p className="mt-1 text-[11px] text-muted">Tự lưu khi bấm ra ngoài · Ctrl+Enter để xong · xoá hết chữ để bỏ ghi chú</p>
      </div>
    )

  if (saved)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Bấm để sửa ghi chú"
        className={cx('flex w-full items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left text-sm text-amber-900 hover:border-amber-300', className)}
      >
        <StickyNote size={15} className="mt-0.5 shrink-0 text-amber-600" />
        <span className="min-w-0 flex-1 whitespace-pre-line break-words leading-relaxed">{saved}</span>
      </button>
    )

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cx('inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-muted hover:bg-amber-50 hover:text-amber-700', className)}
    >
      <StickyNote size={13} /> Thêm ghi chú
    </button>
  )
}
