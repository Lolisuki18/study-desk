import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Filter,
  Flame,
  GraduationCap,
  Grid,
  Layers,
  LayoutGrid,
  Library,
  List,
  ListChecks,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { collections } from '../../data'
import { collectionStats, useProgress } from '../../features/learning/ProgressContext'
import { Card, Empty, ProgressBar } from '../ui'
import { pct, cx } from '../../utils'
import { getContentTypeBadge, getSubjectColor } from './CollectionCard'
import type { Collection } from '../../types'

interface Props {
  base: string
  allowAll?: boolean
}

type SortOption = 'default' | 'progress-desc' | 'progress-asc' | 'items-desc' | 'name-asc'
type StatusFilter = 'all' | 'in-progress' | 'unstarted' | 'need-review'

export default function CollectionPicker({ base, allowAll = true }: Props) {
  const { progress, summary } = useProgress()

  const [search, setSearch] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('default')
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>({})

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try {
      return (localStorage.getItem('psh.collection_picker.view_mode') as 'grid' | 'list') || 'grid'
    } catch {
      return 'grid'
    }
  })

  const setViewModeAndSave = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    try {
      localStorage.setItem('psh.collection_picker.view_mode', mode)
    } catch {}
  }

  const toggleSubjectCollapse = (subject: string) => {
    setCollapsedSubjects((prev) => ({ ...prev, [subject]: !prev[subject] }))
  }

  if (!collections.length) {
    return <Empty>Chưa có bộ học nào. Hãy nhờ AI Agent thêm một file JSON vào src/data/collections.</Empty>
  }

  const subjects = useMemo(() => {
    return [...new Set(collections.map((c) => c.subject))].sort()
  }, [])

  // Calculate overall stats for each collection
  const statsMap = useMemo(() => {
    const map = new Map<string, { total: number; mastered: number; need: number; percent: number }>()
    collections.forEach((c) => {
      const st = collectionStats(c.id, c.items.map((i) => i.id), progress)
      const percent = pct(st.mastered, st.total)
      map.set(c.id, { ...st, percent })
    })
    return map
  }, [progress])

  // Filter and sort collections
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      // Subject filter
      if (selectedSubject !== 'all' && c.subject !== selectedSubject) return false

      // Status filter
      const st = statsMap.get(c.id) || { total: c.items.length, mastered: 0, need: 0, percent: 0 }
      if (statusFilter === 'in-progress' && (st.percent === 0 || st.percent === 100)) return false
      if (statusFilter === 'unstarted' && st.percent > 0) return false
      if (statusFilter === 'need-review' && st.need === 0) return false

      // Search keyword filter
      if (search.trim()) {
        const query = search.toLowerCase().trim()
        const matchTitle = c.title.toLowerCase().includes(query)
        const matchSubject = c.subject.toLowerCase().includes(query)
        const matchDesc = (c.description || '').toLowerCase().includes(query)
        if (!matchTitle && !matchSubject && !matchDesc) return false
      }

      return true
    })
  }, [selectedSubject, statusFilter, search, statsMap])

  // Group filtered collections by subject
  const groupedCollections = useMemo(() => {
    const map = new Map<string, Collection[]>()

    filteredCollections.forEach((c) => {
      const list = map.get(c.subject) || []
      list.push(c)
      map.set(c.subject, list)
    })

    // Sort items within each subject
    map.forEach((list, subj) => {
      const sorted = [...list].sort((a, b) => {
        const stA = statsMap.get(a.id) || { percent: 0, total: 0 }
        const stB = statsMap.get(b.id) || { percent: 0, total: 0 }

        if (sortOption === 'progress-desc') return stB.percent - stA.percent
        if (sortOption === 'progress-asc') return stA.percent - stB.percent
        if (sortOption === 'items-desc') return b.items.length - a.items.length
        if (sortOption === 'name-asc') return a.title.localeCompare(b.title)
        return 0 // default order
      })
      map.set(subj, sorted)
    })

    return map
  }, [filteredCollections, statsMap, sortOption])

  const overallMastered = summary.mastered
  const overallTotal = summary.items
  const overallPercent = pct(overallMastered, overallTotal)

  const isFlashcard = base.includes('flashcard')

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/90 dark:border-line bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Library size={20} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-ink">{summary.collections}</div>
            <div className="text-xs font-semibold text-muted">Bộ môn học</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/90 dark:border-line bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-ink">{summary.items.toLocaleString()}</div>
            <div className="text-xs font-semibold text-muted">Tổng câu hỏi</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/90 dark:border-line bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{summary.mastered}</span>
              <span className="text-xs font-bold text-muted font-mono">({overallPercent}%)</span>
            </div>
            <div className="text-xs font-semibold text-muted">Đã thuộc vững</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/90 dark:border-line bg-card p-3.5 sm:p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <RefreshCw size={20} className={summary.needReview > 0 ? 'animate-spin-slow' : ''} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">{summary.needReview}</div>
            <div className="text-xs font-semibold text-muted">Cần ôn tập SRS</div>
          </div>
        </div>
      </div>

      {/* 2. Hero All-in-One Comprehensive Practice Card */}
      {allowAll && (
        <Link to={`${base}/all`} className="block group">
          <div className="relative overflow-hidden rounded-3xl border border-indigo-100/90 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/40 dark:from-slate-900/90 dark:via-slate-900 dark:to-indigo-950/40 p-5 sm:p-6 shadow-[0_4px_20px_rgba(99,102,241,0.06)] dark:shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800">
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-400/10 dark:bg-indigo-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-sky-400/10 dark:bg-sky-500/10 blur-2xl" />

            <div className="relative z-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                  <Sparkles size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                      Tất cả bộ học (Ôn luyện toàn diện)
                    </h2>
                    <span className="inline-flex items-center rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 shadow-2xs">
                      Toàn kho đề
                    </span>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                    Trộn toàn bộ <b className="text-slate-900 dark:text-white font-bold">{summary.items.toLocaleString()}</b> câu hỏi từ <b className="text-slate-900 dark:text-white font-bold">{summary.collections}</b> bộ học để luyện phản xạ ngẫu nhiên không giới hạn theo từng chương.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/25 transition-all group-hover:shadow-lg group-hover:shadow-indigo-500/35 group-hover:translate-x-0.5">
                <span>{isFlashcard ? 'Lật thẻ toàn bộ' : 'Bắt đầu làm bài'}</span>
                <ArrowRight size={15} />
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* 3. Search, Filter & Control Toolbar */}
      <div className="space-y-3 rounded-3xl border border-slate-200/90 dark:border-line bg-card p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm bộ học theo tên, môn, chương..."
              className="w-full rounded-2xl border border-slate-200 dark:border-line bg-slate-50 dark:bg-slate-800/60 py-2.5 pl-10 pr-9 text-xs font-medium text-ink outline-none transition-colors focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-0.5 rounded-full"
                title="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Controls: Status, Sort, View Mode */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-xl border border-slate-200 dark:border-line bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs font-semibold text-ink outline-none hover:bg-slate-100 cursor-pointer"
              aria-label="Lọc theo trạng thái học"
            >
              <option value="all">Tất cả tiến độ</option>
              <option value="in-progress">Đang học dở</option>
              <option value="unstarted">Chưa học (0%)</option>
              <option value="need-review">Có câu cần ôn lại</option>
            </select>

            {/* Sort Options */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="rounded-xl border border-slate-200 dark:border-line bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs font-semibold text-ink outline-none hover:bg-slate-100 cursor-pointer"
              aria-label="Sắp xếp danh sách"
            >
              <option value="default">Thứ tự mặc định</option>
              <option value="progress-desc">Tiến độ cao nhất</option>
              <option value="progress-asc">Tiến độ thấp nhất</option>
              <option value="items-desc">Nhiều câu hỏi nhất</option>
              <option value="name-asc">Tên chương (A-Z)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-line bg-slate-50 dark:bg-slate-800/60 p-0.5">
              <button
                type="button"
                onClick={() => setViewModeAndSave('grid')}
                className={cx(
                  'flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                    : 'text-muted hover:text-ink'
                )}
                title="Hiển thị dạng thẻ lưới (Grid)"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewModeAndSave('list')}
                className={cx(
                  'flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer',
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                    : 'text-muted hover:text-ink'
                )}
                title="Hiển thị dạng danh sách gọn (List)"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Subject Pills (Horizontal Scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedSubject('all')}
            className={cx(
              'rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer',
              selectedSubject === 'all'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-muted hover:text-ink hover:bg-slate-200/70'
            )}
          >
            Tất cả môn ({collections.length})
          </button>

          {subjects.map((s) => {
            const count = collections.filter((c) => c.subject === s).length
            const isSelected = selectedSubject === s

            return (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSubject(s)}
                className={cx(
                  'rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer',
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-muted hover:text-ink hover:bg-slate-200/70'
                )}
              >
                {s} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. Grouped Collections Display */}
      {groupedCollections.size === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-line p-12 text-center">
          <Filter size={32} className="mx-auto text-muted mb-3" />
          <h3 className="font-bold text-ink text-base">Không tìm thấy bộ học nào</h3>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
            Không có bộ học nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại của bạn.
          </p>
          <button
            onClick={() => {
              setSearch('')
              setSelectedSubject('all')
              setStatusFilter('all')
              setSortOption('default')
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Đặt lại bộ lọc</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(groupedCollections.entries()).map(([subj, list]) => {
            const isCollapsed = !!collapsedSubjects[subj]

            // Calculate subject-level totals
            const totalSubjectItems = list.reduce((acc, c) => acc + c.items.length, 0)
            const masteredSubjectItems = list.reduce((acc, c) => {
              const st = statsMap.get(c.id)
              return acc + (st?.mastered || 0)
            }, 0)
            const subjectPercent = pct(masteredSubjectItems, totalSubjectItems)
            const subjectTone = getSubjectColor(subj)

            return (
              <section key={subj} className="space-y-3.5">
                {/* Subject Section Header */}
                <div
                  onClick={() => toggleSubjectCollapse(subj)}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-line hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-xs">
                      {subj.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-ink uppercase truncate">
                          {subj}
                        </h2>
                        <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {list.length} bộ học
                        </span>
                      </div>
                      <div className="text-[11px] text-muted font-medium mt-0.5">
                        {totalSubjectItems} câu hỏi · Đã thuộc {masteredSubjectItems} ({subjectPercent}%)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-2 w-28">
                      <ProgressBar value={subjectPercent} className="h-1.5 flex-1" />
                      <span className="font-mono text-xs font-bold text-muted">{subjectPercent}%</span>
                    </div>

                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted hover:text-ink hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                      title={isCollapsed ? 'Mở rộng môn này' : 'Thu gọn môn này'}
                    >
                      {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                  </div>
                </div>

                {/* Subject Items List / Grid */}
                {!isCollapsed && (
                  <>
                    {viewMode === 'grid' ? (
                      /* GRID VIEW */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 animate-in fade-in duration-150">
                        {list.map((c) => {
                          const st = statsMap.get(c.id) || { total: c.items.length, mastered: 0, need: 0, percent: 0 }
                          const badge = getContentTypeBadge(c.contentType)
                          const BadgeIcon = badge.icon

                          return (
                            <Link key={c.id} to={`${base}/${c.id}`} className="block group">
                              <Card className="flex flex-col justify-between h-full p-4 sm:p-5 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md">
                                <div>
                                  {/* Top Badges */}
                                  <div className="flex items-center justify-between gap-2 mb-2.5">
                                    <span
                                      className={cx(
                                        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold',
                                        badge.color
                                      )}
                                    >
                                      <BadgeIcon size={11} />
                                      <span>{badge.label}</span>
                                    </span>

                                    {st.need > 0 ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                        {st.need} câu cần ôn
                                      </span>
                                    ) : (
                                      <span className="text-[11px] font-semibold text-muted font-mono">
                                        {c.items.length} mục
                                      </span>
                                    )}
                                  </div>

                                  {/* Title & Desc */}
                                  <h3 className="text-sm sm:text-base font-bold text-ink group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                                    {c.title}
                                  </h3>
                                  {c.description && (
                                    <p className="mt-1 text-xs text-muted line-clamp-2 leading-relaxed">
                                      {c.description}
                                    </p>
                                  )}
                                </div>

                                {/* Bottom Progress & Action Button */}
                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-line/60">
                                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                                    <span className="text-muted">Độ thành thạo</span>
                                    <span className="font-bold text-ink font-mono">
                                      {st.mastered}/{st.total} ({st.percent}%)
                                    </span>
                                  </div>

                                  <ProgressBar value={st.percent} className="h-2" />

                                  <div className="mt-3.5 flex items-center justify-between pt-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                    <span>{isFlashcard ? 'Lật thẻ học' : 'Làm trắc nghiệm'}</span>
                                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                  </div>
                                </div>
                              </Card>
                            </Link>
                          )
                        })}
                      </div>
                    ) : (
                      /* LIST VIEW */
                      <div className="space-y-2.5 animate-in fade-in duration-150">
                        {list.map((c) => {
                          const st = statsMap.get(c.id) || { total: c.items.length, mastered: 0, need: 0, percent: 0 }
                          const badge = getContentTypeBadge(c.contentType)
                          const BadgeIcon = badge.icon

                          return (
                            <Link key={c.id} to={`${base}/${c.id}`} className="block group">
                              <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 transition-all duration-150 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span
                                      className={cx(
                                        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                                        badge.color
                                      )}
                                    >
                                      <BadgeIcon size={11} />
                                      <span>{badge.label}</span>
                                    </span>
                                    <span className="text-xs text-muted font-medium">· {c.items.length} mục</span>
                                    {st.need > 0 && (
                                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                                        · {st.need} cần ôn
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm font-bold text-ink group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                                    {c.title}
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 shrink-0">
                                  <div className="w-28 sm:w-36">
                                    <div className="flex justify-between text-xs font-mono font-bold text-muted mb-1">
                                      <span>{st.mastered}/{st.total}</span>
                                      <span>{st.percent}%</span>
                                    </div>
                                    <ProgressBar value={st.percent} className="h-1.5" />
                                  </div>

                                  <div className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 transition-colors">
                                    <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                                  </div>
                                </div>
                              </Card>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
