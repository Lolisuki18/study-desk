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
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import Pomodoro from './Pomodoro'
import ThemeToggle from './ThemeToggle'
import CommandPalette from './CommandPalette'
import ShortcutsModal from './ShortcutsModal'
import ScrollToTop from './ScrollToTop'
import { ToastProvider } from '../ui'
import { useProgress } from '../../features/learning/ProgressContext'
import { cx } from '../../utils'
import { Keyboard } from 'lucide-react'

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
      { to: '/import', label: 'Tải lên & Mẫu', icon: Upload },
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
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('psh.sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('psh.sidebar_collapsed', String(next))
      } catch {}
      return next
    })
  }

  const location = useLocation()

  useEffect(() => {
    setMobileDrawerOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen((prev) => !prev)
      } else if (!isInput && e.key === '?') {
        e.preventDefault()
        setShortcutsOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <ToastProvider>
      <div className="flex min-h-full flex-col md:flex-row bg-bg text-ink transition-colors duration-150">
        {/* Global Command Palette */}
        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

        {/* Global Shortcuts Modal */}
        <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

        {/* Smooth Scroll To Top */}
        <ScrollToTop />

        {/* Top bar on Mobile */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/90 dark:border-line bg-white/95 dark:bg-card/95 px-4 py-3 backdrop-blur-md md:hidden print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <GraduationCap size={18} />
            </div>
            <span className="font-extrabold tracking-tight text-slate-900 dark:text-ink">Góc học tập</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCmdOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-line bg-white dark:bg-card text-slate-600 dark:text-muted hover:text-slate-900 dark:hover:text-ink active:scale-95 transition-all cursor-pointer"
              aria-label="Tìm kiếm nhanh"
              title="Tìm kiếm nhanh (Ctrl + K)"
            >
              <Search size={15} />
            </button>
            <Pomodoro compact />
            {summary.needReview > 0 && (
              <NavLink
                to="/today"
                className="flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
              >
                <RefreshCw size={12} className="animate-spin-slow" />
                <span>{summary.needReview}</span>
              </NavLink>
            )}
            <ThemeToggle className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-line text-slate-600 dark:text-muted hover:text-slate-900 dark:hover:text-ink" />
          </div>
        </header>

        {/* Desktop Sidebar */}
        <aside
          className={cx(
            'sticky top-0 hidden h-screen shrink-0 flex-col overflow-y-auto border-r border-slate-200 dark:border-line bg-white dark:bg-card py-5 md:flex print:hidden transition-all duration-200',
            collapsed ? 'w-20 px-2.5 items-center' : 'w-64 px-3.5',
          )}
        >
          {/* Brand Header */}
          {collapsed ? (
            <div className="mb-4 flex flex-col items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                title="Góc học tập (Study Hub)"
              >
                <GraduationCap size={20} />
              </div>
              <button
                onClick={toggleCollapsed}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-ink cursor-pointer transition-colors"
                title="Mở rộng thanh điều hướng"
                aria-label="Mở rộng thanh điều hướng"
              >
                <PanelLeftOpen size={15} />
              </button>
            </div>
          ) : (
            <div className="mb-4 flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/20">
                  <GraduationCap size={20} />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold tracking-tight text-slate-900 dark:text-ink text-sm leading-tight whitespace-nowrap">
                    Góc học tập
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-muted font-medium tracking-tight whitespace-nowrap">
                    Study Hub & SRS
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => setShortcutsOpen(true)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-ink transition-colors cursor-pointer"
                  title="Phím tắt học tập (?)"
                  aria-label="Phím tắt học tập"
                >
                  <Keyboard size={14} />
                </button>
                <ThemeToggle className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-ink transition-colors" />
                <button
                  onClick={toggleCollapsed}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-ink transition-colors cursor-pointer"
                  title="Thu gọn thanh điều hướng"
                  aria-label="Thu gọn thanh điều hướng"
                >
                  <PanelLeftClose size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Quick Search Button */}
          {collapsed ? (
            <button
              onClick={() => setCmdOpen(true)}
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-line bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-muted hover:border-indigo-400 hover:text-ink cursor-pointer transition-all"
              title="Tìm kiếm nhanh (Ctrl + K)"
              aria-label="Tìm kiếm nhanh"
            >
              <Search size={16} />
            </button>
          ) : (
            <button
              onClick={() => setCmdOpen(true)}
              className="mb-5 flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-line bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-muted transition-all hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-ink cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Search size={14} className="text-slate-400 dark:text-slate-500" />
                <span>Tìm kiếm nhanh…</span>
              </div>
              <kbd className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300 shadow-2xs">
                Ctrl K
              </kbd>
            </button>
          )}

          {/* Navigation Groups */}
          <nav className={cx('flex flex-col gap-4 flex-1 overflow-y-auto pr-1', collapsed && 'items-center')}>
            {navGroups.map((group) => (
              <div key={group.groupName} className={collapsed ? 'w-full flex flex-col items-center' : ''}>
                {!collapsed && (
                  <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {group.groupName}
                  </div>
                )}
                <div className={cx('flex flex-col gap-1', collapsed && 'items-center w-full')}>
                  {group.items.map(({ to, label, icon: Icon, end, badge }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      title={collapsed ? label : undefined}
                      className={({ isActive }) =>
                        cx(
                          'group relative flex items-center transition-all duration-150',
                          collapsed
                            ? 'h-10 w-10 justify-center rounded-xl'
                            : 'gap-3 rounded-xl px-3 py-2 text-sm font-semibold',
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 shadow-2xs'
                            : 'text-slate-600 dark:text-muted hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-ink',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={collapsed ? 19 : 17} strokeWidth={isActive ? 2.3 : 1.9} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} />
                          {!collapsed && <span className="flex-1 truncate">{label}</span>}
                          {badge && summary.needReview > 0 && (
                            collapsed ? (
                              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs">
                                {summary.needReview > 99 ? '99+' : summary.needReview}
                              </span>
                            ) : (
                              <span
                                className={cx(
                                  'rounded-full px-2 py-0.5 text-xs font-bold leading-none transition-colors',
                                  isActive ? 'bg-indigo-600 text-white' : 'bg-rose-500 text-white shadow-2xs',
                                )}
                              >
                                {summary.needReview}
                              </span>
                            )
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
          <div className="mt-auto pt-3 w-full">
            <Pomodoro compact={collapsed} />
          </div>
          {!collapsed && (
            <div className="rounded-2xl border border-slate-200 dark:border-line bg-slate-50/90 dark:bg-slate-800/40 p-3 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-muted mb-1.5 font-semibold">
                <span>Độ thành thạo</span>
                <span className="font-extrabold text-slate-900 dark:text-ink">
                  {summary.items > 0 ? Math.round((summary.mastered / summary.items) * 100) : 0}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                  style={{
                    width: `${summary.items > 0 ? Math.round((summary.mastered / summary.items) * 100) : 0}%`,
                  }}
                />
              </div>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex justify-between font-medium">
                <span>{summary.mastered} đã thuộc</span>
                <span>{summary.items} mục</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="mt-2 flex flex-col items-center gap-2">
              <ThemeToggle className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-line text-slate-600 dark:text-muted hover:text-ink" />
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8">
          <div className="mx-auto max-w-5xl">{loaded ? <Outlet /> : <p className="text-sm text-slate-500 dark:text-muted">Đang nạp dữ liệu…</p>}</div>
        </main>

        {/* Modern Mobile Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200 dark:border-line bg-white/95 dark:bg-card/95 py-1.5 px-3 backdrop-blur-md md:hidden print:hidden shadow-lg">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cx(
                'flex flex-col items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-colors',
                isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-muted hover:text-slate-900 dark:hover:text-ink',
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
                'relative flex flex-col items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-colors',
                isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-muted hover:text-slate-900 dark:hover:text-ink',
              )
            }
          >
            <Sparkles size={20} strokeWidth={2} />
            <span>Học ngay</span>
            {summary.needReview > 0 && (
              <span className="absolute top-0.5 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                {summary.needReview > 99 ? '99+' : summary.needReview}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/collections"
            className={({ isActive }) =>
              cx(
                'flex flex-col items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-colors',
                isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-muted hover:text-slate-900 dark:hover:text-ink',
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
                'flex flex-col items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-colors',
                isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-muted hover:text-slate-900 dark:hover:text-ink',
              )
            }
          >
            <NotebookPen size={20} strokeWidth={2} />
            <span>Sổ sai</span>
          </NavLink>

          <button
            onClick={() => setMobileDrawerOpen(true)}
            className={cx(
              'flex flex-col items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-colors text-slate-500 dark:text-muted hover:text-slate-900 dark:hover:text-ink cursor-pointer',
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
              className="max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 dark:border-line bg-white dark:bg-card p-5 shadow-2xl animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 dark:border-line pb-3">
                <div className="flex items-center gap-2">
                  <Menu size={18} className="text-slate-400 dark:text-slate-500" />
                  <span className="font-extrabold text-slate-900 dark:text-ink text-base">Tính năng & Chế độ học</span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="rounded-lg p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Grid of Other Features */}
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                <NavLink
                  to="/flashcards"
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-line bg-slate-50 dark:bg-slate-800/40 p-3 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Layers size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Thẻ ghi nhớ</span>
                </NavLink>

                <NavLink
                  to="/quiz"
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-line bg-slate-50 dark:bg-slate-800/40 p-3 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ListChecks size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Trắc nghiệm</span>
                </NavLink>

                <NavLink
                  to="/exam"
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-line bg-slate-50 dark:bg-slate-800/40 p-3 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition-colors"
                >
                  <FileCheck2 size={18} className="text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Thi thử</span>
                </NavLink>

                <NavLink
                  to="/review"
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-line bg-slate-50 dark:bg-slate-800/40 p-3 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition-colors"
                >
                  <RefreshCw size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Ôn tập SRS</span>
                </NavLink>

                <NavLink
                  to="/statistics"
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-line bg-slate-50 dark:bg-slate-800/40 p-3 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition-colors"
                >
                  <BarChart3 size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Thống kê</span>
                </NavLink>

                <NavLink
                  to="/settings"
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-line bg-slate-50 dark:bg-slate-800/40 p-3 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Settings size={18} className="text-slate-600 dark:text-slate-300 shrink-0" />
                  <span>Cài đặt</span>
                </NavLink>

                <button
                  onClick={() => {
                    setMobileDrawerOpen(false)
                    setShortcutsOpen(true)
                  }}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-line bg-slate-50 dark:bg-slate-800/40 p-3 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition-colors col-span-2 cursor-pointer"
                >
                  <Keyboard size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Bảng phím tắt học tập (?)</span>
                </button>
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
