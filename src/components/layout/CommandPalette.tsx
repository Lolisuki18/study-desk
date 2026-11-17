import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CalendarCheck2,
  FileCheck2,
  Layers,
  LayoutDashboard,
  Library,
  ListChecks,
  NotebookPen,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'
import { allEntries, collections, itemTitle } from '../../data'
import { matcher, searchText } from '../../utils/search'
import { cx } from '../../utils'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

const STATIC_NAV = [
  { label: 'Tổng quan', path: '/', icon: LayoutDashboard, category: 'Điều hướng' },
  { label: 'Học hôm nay (Phiên học tổng hợp)', path: '/today', icon: Sparkles, category: 'Điều hướng' },
  { label: 'Bộ học (Tất cả bộ câu hỏi)', path: '/collections', icon: Library, category: 'Điều hướng' },
  { label: 'Thẻ ghi nhớ (Flashcards SRS)', path: '/flashcards', icon: Layers, category: 'Điều hướng' },
  { label: 'Trắc nghiệm (Luyện tập)', path: '/quiz', icon: ListChecks, category: 'Điều hướng' },
  { label: 'Thi thử (Tính giờ & chấm điểm)', path: '/exam', icon: FileCheck2, category: 'Điều hướng' },
  { label: 'Ôn tập SRS (Leitner 5 hộp)', path: '/review', icon: RefreshCw, category: 'Điều hướng' },
  { label: 'Sổ câu sai (Notebook & In PDF)', path: '/mistakes', icon: NotebookPen, category: 'Điều hướng' },
  { label: 'Thống kê & Biểu đồ học tập', path: '/statistics', icon: CalendarCheck2, category: 'Điều hướng' },
  { label: 'Cài đặt & Sao lưu dữ liệu', path: '/settings', icon: Settings, category: 'Điều hướng' },
]

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [q, setQ] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setQ('')
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Lọc kết quả tìm kiếm
  const results = useMemo(() => {
    const trimmed = q.trim()
    if (!trimmed) {
      return STATIC_NAV.map((item) => ({
        id: item.path,
        title: item.label,
        sub: item.category,
        icon: item.icon,
        action: () => navigate(item.path),
      }))
    }

    const match = matcher(trimmed)

    // 1. Khớp trang cố định
    const matchedNav = STATIC_NAV.filter((item) => match(item.label)).map((item) => ({
      id: item.path,
      title: item.label,
      sub: 'Chức năng',
      icon: item.icon,
      action: () => navigate(item.path),
    }))

    // 2. Khớp bộ học
    const matchedCollections = collections
      .filter((c) => match(`${c.title} ${c.subject} ${c.description}`))
      .slice(0, 5)
      .map((c) => ({
        id: `col-${c.id}`,
        title: c.title,
        sub: `Bộ học · ${c.subject} (${c.items.length} câu)`,
        icon: BookOpen,
        action: () => navigate(`/collections/${c.id}`),
      }))

    // 3. Khớp câu hỏi / mục kiến thức
    const matchedItems = allEntries()
      .filter((e) => match(searchText(e.item)))
      .slice(0, 8)
      .map((e) => ({
        id: `item-${e.collection.id}-${e.item.id}`,
        title: itemTitle(e.item),
        sub: `Câu hỏi trong "${e.collection.title}"`,
        icon: ListChecks,
        action: () => navigate(`/collections/${e.collection.id}`),
      }))

    return [...matchedNav, ...matchedCollections, ...matchedItems]
  }, [q, navigate])

  const handleSelect = (idx: number) => {
    const item = results[idx]
    if (item) {
      item.action()
      onClose()
    }
  }

  // Keyboard navigation: Mũi tên lên/xuống, Enter, Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx((prev) => (prev + 1 < results.length ? prev + 1 : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx((prev) => (prev - 1 >= 0 ? prev - 1 : results.length - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleSelect(selectedIdx)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, selectedIdx])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/50 p-4 pt-16 sm:pt-24 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-3xl border border-line bg-card shadow-2xl transition-all duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
          <Search size={18} className="text-muted shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setSelectedIdx(0)
            }}
            placeholder="Tìm tính năng, bộ học hoặc nội dung câu hỏi…"
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-ink outline-none placeholder:text-muted"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="rounded-lg p-1 text-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:inline-block rounded-md border border-line bg-slate-50 dark:bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-bold text-muted">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {results.length > 0 ? (
            results.map((item, idx) => {
              const isSelected = idx === selectedIdx
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(idx)}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-all duration-100 cursor-pointer',
                    isSelected
                      ? 'bg-ink text-white shadow-xs'
                      : 'text-ink hover:bg-slate-100/80 dark:hover:bg-slate-800/60',
                  )}
                >
                  <div
                    className={cx(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors',
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-muted',
                    )}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate leading-tight">{item.title}</div>
                    <div
                      className={cx(
                        'text-xs truncate mt-0.5',
                        isSelected ? 'text-white/80' : 'text-muted',
                      )}
                    >
                      {item.sub}
                    </div>
                  </div>
                  <ArrowRight
                    size={15}
                    className={cx('shrink-0 transition-opacity', isSelected ? 'opacity-100' : 'opacity-0')}
                  />
                </button>
              )
            })
          ) : (
            <div className="py-12 text-center text-sm text-muted">
              Không tìm thấy kết quả nào phù hợp với "{q}".
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between border-t border-line bg-slate-50/60 dark:bg-slate-900/60 px-4 py-2 text-[11px] text-muted">
          <div className="flex items-center gap-2">
            <span>Dùng</span>
            <kbd className="rounded border border-line bg-card px-1.5 py-0.5 font-mono text-[10px]">↑</kbd>
            <kbd className="rounded border border-line bg-card px-1.5 py-0.5 font-mono text-[10px]">↓</kbd>
            <span>để chọn</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Nhấn</span>
            <kbd className="rounded border border-line bg-card px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd>
            <span>để mở</span>
          </div>
        </div>
      </div>
    </div>
  )
}
