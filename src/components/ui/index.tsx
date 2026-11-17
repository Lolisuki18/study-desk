import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../utils'

export { ToastProvider, useToast } from './Toast'
export { Modal, ConfirmDialog } from './Modal'

export function Card({ className, children, ...p }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...p}
      className={cx(
        'rounded-2xl border border-line bg-card shadow-[0_2px_10px_rgba(15,23,42,0.03)] transition-all',
        className,
      )}
    >
      {children}
    </div>
  )
}

type Variant = 'primary' | 'outline' | 'ok' | 'err' | 'ghost'
const variants: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-slate-800 border-ink shadow-2xs active:scale-[0.98]',
  outline: 'bg-card text-ink border-line hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs active:scale-[0.98]',
  ok: 'bg-ok text-white border-ok shadow-2xs hover:opacity-95 active:scale-[0.98]',
  err: 'bg-err text-white border-err shadow-2xs hover:opacity-95 active:scale-[0.98]',
  ghost: 'border-transparent text-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98]',
}

export function Button({
  variant = 'outline',
  className,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...p}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 select-none cursor-pointer',
        variants[variant],
        className,
      )}
    />
  )
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full bg-line/80', className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Stat({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string
  value: ReactNode
  hint?: string
  tone?: 'ok' | 'err' | 'primary'
  icon?: ReactNode
}) {
  return (
    <Card className="p-4 sm:p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</div>
        {icon && <div className="text-muted group-hover:text-ink transition-colors">{icon}</div>}
      </div>
      <div
        className={cx(
          'mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight',
          tone === 'ok' && 'text-ok',
          tone === 'err' && 'text-err',
          tone === 'primary' && 'text-indigo-600 dark:text-indigo-400',
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted font-medium">{hint}</div>}
    </Card>
  )
}

export function Empty({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-line bg-card/40 p-10 sm:p-12 text-center text-sm text-muted flex flex-col items-center justify-center">
      {icon && <div className="mb-3 text-muted/80">{icon}</div>}
      <div className="max-w-md">{children}</div>
    </div>
  )
}
