import { useEffect, type ReactNode } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { cx } from '../../utils'
import { Button } from './index'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={cx(
          'w-full max-w-lg rounded-3xl border border-line bg-card p-6 shadow-2xl transition-all duration-200',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
            <div className="text-base font-bold text-ink">{title}</div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  tone?: 'danger' | 'primary'
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  tone = 'primary',
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <div className="flex gap-4">
        {tone === 'danger' && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <AlertTriangle size={22} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-ink">{title}</h3>
          <p className="mt-1.5 text-sm text-muted leading-relaxed whitespace-pre-line">{description}</p>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2.5">
        <Button variant="outline" onClick={onClose}>
          {cancelText}
        </Button>
        <Button
          variant={tone === 'danger' ? 'err' : 'primary'}
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}
