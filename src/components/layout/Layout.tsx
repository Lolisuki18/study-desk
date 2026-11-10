import { NavLink, Outlet } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Library,
  ListChecks,
  RefreshCw,
  Settings,
} from 'lucide-react'
import { useProgress } from '../../features/learning/ProgressContext'
import { cx } from '../../utils'

const nav = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/collections', label: 'Bộ học', icon: Library },
  { to: '/flashcards', label: 'Thẻ ghi nhớ', icon: Layers },
  { to: '/quiz', label: 'Trắc nghiệm', icon: ListChecks },
  { to: '/review', label: 'Ôn tập', icon: RefreshCw, badge: true },
  { to: '/statistics', label: 'Thống kê', icon: BarChart3 },
  { to: '/settings', label: 'Cài đặt', icon: Settings },
]

export default function Layout() {
  const { summary, loaded } = useProgress()

  return (
    <div className="flex min-h-full flex-col md:flex-row bg-bg">
      {/* Top bar on Mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-card/90 px-4 py-3 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-slate-900 to-indigo-600 text-white shadow-xs">
            <GraduationCap size={18} />
          </div>
          <span className="font-bold tracking-tight text-ink">Góc học tập</span>
        </div>
        {summary.needReview > 0 && (
          <NavLink
            to="/review"
            className="flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 border border-rose-200"
          >
            <RefreshCw size={12} className="animate-spin-slow" />
            <span>Cần ôn {summary.needReview}</span>
          </NavLink>
        )}
      </header>

      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-card px-4 py-6 md:flex">
        {/* Brand Header */}
        <div className="mb-7 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-950 via-slate-850 to-indigo-600 text-white shadow-md shadow-indigo-500/10">
            <GraduationCap size={22} />
          </div>
          <div>
            <div className="font-bold tracking-tight text-ink text-[15px]">Góc học tập</div>
            <div className="text-[11px] text-muted font-medium">Study Hub & SRS</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 flex-1">
          {nav.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cx(
                  'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-ink text-white shadow-sm'
                    : 'text-muted hover:bg-slate-100 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span className="flex-1">{label}</span>
                  {badge && summary.needReview > 0 && (
                    <span
                      className={cx(
                        'rounded-full px-2 py-0.5 text-xs font-bold leading-none transition-colors',
                        isActive ? 'bg-white text-ink' : 'bg-rose-500 text-white shadow-2xs',
                      )}
                    >
                      {summary.needReview}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer SRS status */}
        <div className="mt-auto rounded-xl border border-line bg-slate-50/70 p-3.5 text-xs">
          <div className="flex items-center justify-between text-muted mb-1.5 font-medium">
            <span>Tiến độ tổng</span>
            <span className="font-bold text-ink">
              {summary.items > 0 ? Math.round((summary.mastered / summary.items) * 100) : 0}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{
                width: `${summary.items > 0 ? Math.round((summary.mastered / summary.items) * 100) : 0}%`,
              }}
            />
          </div>
          <div className="mt-2 text-[11px] text-muted flex justify-between">
            <span>{summary.mastered} đã thuộc</span>
            <span>{summary.items} mục</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-8 pb-24 md:pb-8">
        <div className="mx-auto max-w-4xl">{loaded ? <Outlet /> : <p className="text-sm text-muted">Đang nạp dữ liệu…</p>}</div>
      </main>

      {/* Bottom Navigation on Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-line bg-card/95 py-2 px-1 backdrop-blur-md md:hidden shadow-lg">
        {nav.slice(0, 5).map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cx(
                'relative flex flex-col items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors',
                isActive ? 'text-ink font-semibold' : 'text-muted hover:text-ink',
              )
            }
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
            {badge && summary.needReview > 0 && (
              <span className="absolute -top-0.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {summary.needReview}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
