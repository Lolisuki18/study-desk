import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { cx } from '../../utils'

export { ToastProvider, useToast } from './Toast'
export { Modal, ConfirmDialog } from './Modal'

export function Card({ className, children, ...p }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...p}
      className={cx(
        'rounded-2xl border border-slate-200/80 dark:border-line bg-card shadow-[0_1px_3px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.02)] transition-all',
        className,
      )}
    >
      {children}
    </div>
  )
}

type Variant = 'primary' | 'outline' | 'ok' | 'err' | 'ghost'
const variants: Record<Variant, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 border-transparent shadow-xs hover:shadow-indigo-500/20 active:scale-[0.98]',
  outline: 'bg-white dark:bg-card text-slate-700 dark:text-slate-200 border-slate-200 dark:border-line hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 shadow-2xs active:scale-[0.98]',
  ok: 'bg-emerald-600 text-white border-transparent shadow-xs hover:bg-emerald-700 active:scale-[0.98]',
  err: 'bg-rose-600 text-white border-transparent shadow-xs hover:bg-rose-700 active:scale-[0.98]',
  ghost: 'border-transparent text-slate-600 dark:text-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98]',
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
        'inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 select-none cursor-pointer',
        variants[variant],
        className,
      )}
    />
  )
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800', className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-muted">{subtitle}</p>}
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
  const iconBg =
    tone === 'ok'
      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
      : tone === 'err'
      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
      : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'

  return (
    <Card className="p-4 sm:p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-muted">{label}</div>
        {icon && (
          <div className={cx('flex h-8 w-8 items-center justify-center rounded-xl transition-transform group-hover:scale-105', iconBg)}>
            {icon}
          </div>
        )}
      </div>
      <div
        className={cx(
          'mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100',
          tone === 'ok' && 'text-emerald-600 dark:text-emerald-400',
          tone === 'err' && 'text-rose-600 dark:text-rose-400',
          tone === 'primary' && 'text-indigo-600 dark:text-indigo-400',
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-1.5 text-xs text-slate-500 dark:text-muted font-medium">{hint}</div>}
    </Card>
  )
}

export function Empty({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-line bg-card/40 p-10 sm:p-12 text-center text-sm text-slate-500 dark:text-muted flex flex-col items-center justify-center">
      {icon && <div className="mb-3 text-slate-400">{icon}</div>}
      <div className="max-w-md">{children}</div>
    </div>
  )
}
