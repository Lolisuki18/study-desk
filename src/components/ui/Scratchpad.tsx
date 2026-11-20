import { useEffect, useState } from 'react'
import {
  Copy,
  Eraser,
  Maximize2,
  Minimize2,
  PenLine,
  X,
  Check,
} from 'lucide-react'
import { cx } from '../../utils'

const STORAGE_KEY = 'psh.scratchpad.text'

interface Props {
  open?: boolean
  onClose?: () => void
  embedded?: boolean
}

export default function Scratchpad({ open = false, onClose, embedded = false }: Props) {
  const [isOpen, setIsOpen] = useState(open)
  const [minimized, setMinimized] = useState(false)
  const [copied, setCopied] = useState(false)
  const [content, setContent] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? ''
    } catch {
      return ''
    }
  })

  useEffect(() => {
    setIsOpen(open)
  }, [open])

  const handleSave = (val: string) => {
    setContent(val)
    try {
      localStorage.setItem(STORAGE_KEY, val)
    } catch {}
  }

  const handleClear = () => {
    if (content && window.confirm('Bạn có chắc muốn xoá toàn bộ nội dung nháp?')) {
      handleSave('')
    }
  }

  const handleCopy = async () => {
    if (!content) return
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const charCount = content.length
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  if (!isOpen && !embedded) return null

  // If embedded in a drawer or sidebar
  if (embedded) {
    return (
      <div className="flex flex-col h-full rounded-2xl border border-line bg-card p-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-line mb-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-ink">
            <PenLine size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span>Bảng nháp bài thi</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-muted hover:text-ink text-xs cursor-pointer"
              title="Sao chép nháp"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            </button>
            <button
              onClick={handleClear}
              className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-muted hover:text-rose-500 text-xs cursor-pointer"
              title="Xoá nháp"
            >
              <Eraser size={13} />
            </button>
          </div>
        </div>
        <textarea
          value={content}
          onChange={(e) => handleSave(e.target.value)}
          placeholder="Ghi chú, tính toán, loại trừ đáp án tại đây..."
          className="flex-1 w-full resize-none rounded-xl bg-slate-50/70 dark:bg-slate-900/40 p-2.5 text-xs font-mono text-ink placeholder-slate-400 focus:outline-none border border-transparent focus:border-indigo-500/50"
        />
        <div className="flex justify-between items-center pt-2 text-[10px] text-muted font-medium">
          <span>{charCount} ký tự · {wordCount} từ</span>
          <span>Tự động lưu máy</span>
        </div>
      </div>
    )
  }

  // Floating window mode
  return (
    <div
      className={cx(
        'fixed z-50 transition-all duration-200 shadow-2xl rounded-2xl border border-slate-300 dark:border-line bg-card/95 backdrop-blur-md overflow-hidden flex flex-col',
        minimized
          ? 'bottom-20 right-4 w-44 h-11 py-2 px-3 justify-center'
          : 'bottom-20 sm:bottom-6 right-3 sm:right-6 w-[92vw] sm:w-84 md:w-96 h-80 sm:h-96',
      )}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-line bg-slate-50/80 dark:bg-slate-800/60 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <PenLine size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="text-xs font-bold text-ink truncate">Bảng nháp nhanh</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1 rounded-lg text-muted hover:text-ink hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={minimized ? 'Phóng to' : 'Thu nhỏ'}
          >
            {minimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          </button>
          <button
            onClick={() => {
              setIsOpen(false)
              onClose?.()
            }}
            className="p-1 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Đóng bảng nháp"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Text Area */}
          <div className="flex-1 p-2.5">
            <textarea
              value={content}
              onChange={(e) => handleSave(e.target.value)}
              placeholder="Nháp nhanh mốc thời gian, công thức, suy luận loại trừ..."
              className="w-full h-full resize-none rounded-xl bg-slate-50/60 dark:bg-slate-900/50 p-2.5 text-xs font-sans text-ink placeholder-slate-400 focus:outline-none border border-slate-200/80 dark:border-slate-800 focus:border-indigo-500 leading-relaxed"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-line text-[11px] text-muted bg-slate-50/50 dark:bg-slate-900/30">
            <span>{charCount} ký tự · {wordCount} từ</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!content}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer font-medium"
                title="Sao chép nội dung"
              >
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                <span>{copied ? 'Đã chép' : 'Chép'}</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={!content}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-rose-100/70 dark:hover:bg-rose-950/50 hover:text-rose-600 disabled:opacity-40 cursor-pointer font-medium"
                title="Xoá hết"
              >
                <Eraser size={12} />
                <span>Xoá</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
