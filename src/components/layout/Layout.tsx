import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  BarChart3,
  FileCheck2,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Library,
  ListChecks,
  Menu,
  MoreHorizontal,
  NotebookPen,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'
import Pomodoro from './Pomodoro'
import ThemeToggle from './ThemeToggle'
import CommandPalette from './CommandPalette'
import { ToastProvider } from '../ui'
import { useProgress } from '../../features/learning/ProgressContext'
import { cx } from '../../utils'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  badge?: boolean
}

interface NavGroup {
  groupName: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    groupName: 'Học hàng ngày',
    items: [
      { to: '/', label: 'Tổng quan', icon: LayoutDashboard, end: true },
      { to: '/today', label: 'Học hôm nay', icon: Sparkles },
      { to: '/review', label: 'Ôn tập SRS', icon: RefreshCw, badge: true },
    ],
  },
  {
    groupName: 'Luyện tập & Thi',
    items: [
      { to: '/collections', label: 'Bộ học', icon: Library },
      { to: '/flashcards', label: 'Thẻ ghi nhớ', icon: Layers },
      { to: '/quiz', label: 'Trắc nghiệm', icon: ListChecks },
      { to: '/exam', label: 'Thi thử', icon: FileCheck2 },
      { to: '/mistakes', label: 'Sổ câu sai', icon: NotebookPen },
    ],
  },
  {
    groupName: 'Hệ thống',
    items: [
      { to: '/search', label: 'Tìm kiếm', icon: Search },
      { to: '/statistics', label: 'Thống kê', icon: BarChart3 },
      { to: '/settings', label: 'Cài đặt', icon: Settings },
    ],
  },
]

export default function Layout() {
  const { summary, loaded } = useProgress()
  const [cmdOpen, setCmdOpen] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const location = useLocation()

  // Tự động đóng mobile drawer khi đổi trang
  useEffect(() => {
    setMobileDrawerOpen(false)
  }, [location.pathname])

  // Lắng nghe phím tắt Ctrl+K hoặc ⌘K toàn cục
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <ToastProvider>
      <div className="flex min-h-full flex-col md:flex-row bg-bg text-ink">
        {/* Global Command Palette */}
        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

        {/* Top bar on Mobile */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-card/90 px-4 py-3 backdrop-blur-md md:hidden print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-slate-900 to-indigo-600 text-white shadow-xs">
              <GraduationCap size={18} />
            </div>
            <span className="font-bold tracking-tight text-ink">Góc học tập</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCmdOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-card text-muted hover:text-ink active:scale-95 transition-all"
              aria-label="Tìm kiếm nhanh"
              title="Tìm kiếm nhanh (Ctrl + K)"
            >
              <Search size={15} />
            </button>
            <Pomodoro compact />
            {summary.needReview > 0 && (
              <NavLink
                to="/today"
                className="flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
              >
                <RefreshCw size={12} className="animate-spin-slow" />
                <span>{summary.needReview}</span>
              </NavLink>
            )}
            <ThemeToggle className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted hover:text-ink" />
          </div>
        </header>

        {/* Desktop Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-line bg-card px-4 py-5 md:flex print:hidden">
          {/* Brand Header */}
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-850 to-indigo-600 text-white shadow-md shadow-indigo-500/10">
              <GraduationCap size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-extrabold tracking-tight text-ink text-[15px] leading-snug">Góc học tập</div>
              <div className="text-[11px] text-muted font-medium">Study Hub & SRS</div>
            </div>
            <ThemeToggle className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink" />
          </div>

          {/* Quick Search Button */}
          <button
            onClick={() => setCmdOpen(true)}
            className="mb-5 flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-slate-50/70 dark:bg-slate-900/60 px-3 py-2 text-xs font-medium text-muted transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:text-ink cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search size={14} />
              <span>Tìm kiếm nhanh…</span>
            </div>
            <kbd className="rounded-md border border-line bg-card px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted">
              Ctrl K
            </kbd>
          </button>

          {/* Navigation Groups */}
          <nav className="flex flex-col gap-5 flex-1 overflow-y-auto pr-1">
            {navGroups.map((group) => (
              <div key={group.groupName}>
                <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted/80">
                  {group.groupName}
                </div>
                <div className="flex flex-col gap-0.5">
                  {group.items.map(({ to, label, icon: Icon, end, badge }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        cx(
                          'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150',
                          isActive
                            ? 'bg-ink text-white shadow-xs'
                            : 'text-muted hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-ink',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                          <span className="flex-1 truncate">{label}</span>
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
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer: Pomodoro + SRS status */}
          <div className="mt-auto pt-3">
            <Pomodoro />
          </div>
          <div className="rounded-2xl border border-line bg-slate-50/70 dark:bg-slate-900/50 p-3 text-xs">
            <div className="flex items-center justify-between text-muted mb-1.5 font-medium">
              <span>Tiến độ thành thạo</span>
              <span className="font-bold text-ink">
                {summary.items > 0 ? Math.round((summary.mastered / summary.items) * 100) : 0}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
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
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8">
          <div className="mx-auto max-w-4xl">{loaded ? <Outlet /> : <p className="text-sm text-muted">Đang nạp dữ liệu…</p>}</div>
        </main>

        {/* Modern Mobile Bottom Navigation Bar (5 core actions) */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-line bg-card/95 py-1.5 px-3 backdrop-blur-md md:hidden print:hidden shadow-lg">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cx(
                'flex flex-col items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-colors',
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted hover:text-ink',
              )
            }
          >
            <LayoutDashboard size={20} strokeWidth={2} />
            <span>Tổng quan</span>
          </NavLink>

          <NavLink
            to="/today"
            className={({ isActive }) =>
              cx(
                'relative flex flex-col items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-colors',
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted hover:text-ink',
              )
            }
          >
            <Sparkles size={20} strokeWidth={2} />
            <span>Học ngay</span>
            {summary.needReview > 0 && (
              <span className="absolute 0 top-0.5 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                {summary.needReview > 99 ? '99+' : summary.needReview}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/collections"
            className={({ isActive }) =>
              cx(
                'flex flex-col items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-colors',
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted hover:text-ink',
              )
            }
          >
            <Library size={20} strokeWidth={2} />
            <span>Bộ học</span>
          </NavLink>

          <NavLink
            to="/mistakes"
            className={({ isActive }) =>
              cx(
                'flex flex-col items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-colors',
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted hover:text-ink',
              )
            }
          >
            <NotebookPen size={20} strokeWidth={2} />
            <span>Sổ sai</span>
          </NavLink>

          <button
            onClick={() => setMobileDrawerOpen(true)}
            className={cx(
              'flex flex-col items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-colors text-muted hover:text-ink cursor-pointer',
              mobileDrawerOpen && 'text-indigo-600 dark:text-indigo-400',
            )}
          >
            <MoreHorizontal size={20} strokeWidth={2} />
            <span>Thêm</span>
          </button>
        </nav>

        {/* Mobile Full Action Sheet / Drawer */}
        {mobileDrawerOpen && (
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/50 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
            onClick={() => setMobileDrawerOpen(false)}
          >
            <div
              className="max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-line bg-card p-5 shadow-2xl animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <Menu size={18} className="text-muted" />
                  <span className="font-bold text-ink text-base">Tính năng & Chế độ học</span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="rounded-lg p-1 text-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Grid of Other Features */}
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                <NavLink
                  to="/flashcards"
                  className="flex items-center gap-3 rounded-2xl border border-line bg-slate-50/50 dark:bg-slate-800/40 p-3 text-xs font-bold text-ink hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
                >
                  <Layers size={18} className="text-indigo-600 shrink-0" />
                  <span>Thẻ ghi nhớ</span>
                </NavLink>

                <NavLink
                  to="/quiz"
                  className="flex items-center gap-3 rounded-2xl border border-line bg-slate-50/50 dark:bg-slate-800/40 p-3 text-xs font-bold text-ink hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
                >
                  <ListChecks size={18} className="text-emerald-600 shrink-0" />
                  <span>Trắc nghiệm</span>
                </NavLink>

                <NavLink
                  to="/exam"
                  className="flex items-center gap-3 rounded-2xl border border-line bg-slate-50/50 dark:bg-slate-800/40 p-3 text-xs font-bold text-ink hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
                >
                  <FileCheck2 size={18} className="text-purple-600 shrink-0" />
                  <span>Thi thử</span>
                </NavLink>

                <NavLink
                  to="/review"
                  className="flex items-center gap-3 rounded-2xl border border-line bg-slate-50/50 dark:bg-slate-800/40 p-3 text-xs font-bold text-ink hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
                >
                  <RefreshCw size={18} className="text-amber-600 shrink-0" />
                  <span>Ôn tập SRS</span>
                </NavLink>

                <NavLink
                  to="/statistics"
                  className="flex items-center gap-3 rounded-2xl border border-line bg-slate-50/50 dark:bg-slate-800/40 p-3 text-xs font-bold text-ink hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
                >
                  <BarChart3 size={18} className="text-blue-600 shrink-0" />
                  <span>Thống kê</span>
                </NavLink>

                <NavLink
                  to="/settings"
                  className="flex items-center gap-3 rounded-2xl border border-line bg-slate-50/50 dark:bg-slate-800/40 p-3 text-xs font-bold text-ink hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
                >
                  <Settings size={18} className="text-slate-600 shrink-0" />
                  <span>Cài đặt</span>
                </NavLink>
              </div>

              {/* Pomodoro Mobile Container */}
              <div className="pt-2">
                <Pomodoro />
              </div>
            </div>
          </div>
        )}
      </div>
    </ToastProvider>
  )
}
