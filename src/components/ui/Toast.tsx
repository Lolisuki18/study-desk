import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cx } from '../../utils'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
    info: (msg: string) => void
  }
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = {
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    info: (msg: string) => addToast(msg, 'info'),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((t) => {
          return (
            <div
              key={t.id}
              className={cx(
                'pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3',
                t.type === 'success' && 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800 text-slate-800 dark:text-slate-100',
                t.type === 'error' && 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800 text-slate-800 dark:text-slate-100',
                t.type === 'info' && 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 text-slate-800 dark:text-slate-100',
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {t.type === 'success' && <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />}
                {t.type === 'error' && <AlertCircle size={18} className="shrink-0 text-rose-500" />}
                {t.type === 'info' && <Info size={18} className="shrink-0 text-indigo-500" />}
                <span className="text-xs sm:text-sm font-medium leading-snug break-words">{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                aria-label="Đóng thông báo"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      toast: {
        // No provider mounted (e.g. isolated tests): fail quietly, but never hide errors.
        success: () => {},
        error: (msg: string) => console.error('[Error]', msg),
        info: () => {},
      },
    }
  }
  return ctx
}
