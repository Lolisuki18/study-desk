import { useMemo, useState } from 'react'
import {
  CalendarRange,
  ChevronDown,
  ChevronRight,
  Clock,
  Layers,
  ListChecks,
  Milestone,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { allEntries, collections } from '../data'
import { extractTimelineMilestones, type TimelineMilestone } from '../services/timeline'
import { Card, PageHeader, Button } from '../components/ui'
import CramView from '../components/ui/CramView'
import { cx } from '../utils'
import type { MultipleChoiceContent } from '../types'

export default function TimelinePage() {
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [expandedYear, setExpandedYear] = useState<number | null>(null)
  const [cramMilestone, setCramMilestone] = useState<TimelineMilestone | null>(null)

  // Get distinct subjects
  const subjects = useMemo(() => {
    const set = new Set<string>()
    collections.forEach((c) => set.add(c.subject))
    return Array.from(set)
  }, [])

  // Filter entries
  const entries = useMemo(() => {
    if (subjectFilter === 'all') return allEntries()
    return allEntries().filter((e) => e.collection.subject === subjectFilter)
  }, [subjectFilter])

  // Extract milestones
  const allMilestones = useMemo(() => {
    return extractTimelineMilestones(entries)
  }, [entries])

  // Filter milestones by search query
  const filteredMilestones = useMemo(() => {
    if (!search.trim()) return allMilestones
    const q = search.toLowerCase()
    return allMilestones.filter(
      (m) =>
        String(m.year).includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.entries.some((e) => e.item.type === 'multiple-choice' && e.item.content.question.toLowerCase().includes(q)),
    )
  }, [allMilestones, search])

  if (cramMilestone) {
    return (
      <CramView
        entries={cramMilestone.entries}
        title={`Ôn tập sự kiện mốc năm ${cramMilestone.year} (${cramMilestone.entries.length} câu)`}
        onClose={() => setCramMilestone(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trục thời gian Sự kiện Lịch sử"
        subtitle="Hệ thống tự động xâu chuỗi các mốc thời gian và sự kiện từ ngân hàng câu hỏi theo thứ tự niên đại"
      />

      {/* Control Bar: Subject filter & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Subject Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSubjectFilter('all')}
            className={cx(
              'px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer',
              subjectFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'border border-line bg-card text-muted hover:text-ink',
            )}
          >
            Tất cả ({allEntries.length})
          </button>
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => setSubjectFilter(s)}
              className={cx(
                'px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap',
                subjectFilter === s
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'border border-line bg-card text-muted hover:text-ink',
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mốc năm (1930, 1945...)"
            className="w-full rounded-xl border border-line bg-card pl-9 pr-3 py-1.5 text-xs font-semibold text-ink placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Timeline Summary Banner */}
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/50 dark:from-slate-900/80 dark:via-slate-900 dark:to-indigo-950/40 p-4 border border-indigo-100 dark:border-indigo-900/50 text-xs text-muted">
        <span className="flex items-center gap-1.5 font-bold text-ink">
          <CalendarRange size={16} className="text-indigo-600 dark:text-indigo-400" />
          <span>Đã trích xuất {filteredMilestones.length} mốc niên đại</span>
        </span>
        <span>Từ năm {allMilestones[0]?.year ?? 1858} đến {allMilestones[allMilestones.length - 1]?.year ?? 2020}</span>
      </div>

      {/* Vertical Interactive Timeline */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:bottom-3 before:top-3 before:left-3 sm:before:left-4 before:w-0.5 before:bg-indigo-200 dark:before:bg-indigo-950">
        {filteredMilestones.map((m) => {
          const isExpanded = expandedYear === m.year
          return (
            <div key={m.year} className="relative group">
              {/* Year Milestone Node Dot */}
              <div className="absolute -left-6 sm:-left-8 top-3 flex h-6 w-6 sm:h-7 sm:w-7 -translate-x-1/2 items-center justify-center rounded-full border-2 border-indigo-600 bg-white dark:bg-card text-indigo-600 dark:text-indigo-400 shadow-md group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <div className="h-2 w-2 rounded-full bg-current" />
              </div>

              {/* Milestone Card */}
              <Card className="p-4 sm:p-5 transition-all hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl sm:text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400 font-mono">
                        {m.year}
                      </span>
                      {m.dateStr && (
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-bold text-muted">
                          {m.dateStr}
                        </span>
                      )}
                      <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                        {m.entries.length} câu hỏi
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-ink leading-snug">{m.title}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="text-xs py-1.5 px-3 font-bold"
                      onClick={() => setCramMilestone(m)}
                      title="Lướt nhanh câu hỏi của mốc này"
                    >
                      <ListChecks size={14} className="text-indigo-600 dark:text-indigo-400" />
                      <span>Ôn mốc này</span>
                    </Button>

                    <button
                      onClick={() => setExpandedYear(isExpanded ? null : m.year)}
                      className="p-1.5 rounded-lg border border-line text-muted hover:text-ink cursor-pointer"
                      title={isExpanded ? 'Thu gọn' : 'Xem các câu hỏi'}
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Questions List */}
                {isExpanded && (
                  <div className="mt-4 pt-3.5 border-t border-line space-y-2.5 animate-in fade-in duration-150">
                    <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
                      Danh sách {m.entries.length} câu hỏi liên quan mốc năm {m.year}:
                    </div>
                    {m.entries.map((e, idx) => (
                      <div
                        key={e.item.id}
                        className="rounded-xl border border-line bg-slate-50/70 dark:bg-slate-900/40 p-3 text-xs space-y-1.5"
                      >
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0 font-mono">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-ink leading-relaxed">
                            {e.item.type === 'multiple-choice'
                              ? e.item.content.question
                              : e.item.type === 'true-false'
                              ? e.item.content.statement
                              : (e.item.content as any).concept}
                          </span>
                        </div>
                        {e.item.type === 'multiple-choice' && (() => {
                          const mc = e.item.content as MultipleChoiceContent
                          const ansText = mc.options.find((o) => o.key === mc.answer)?.text
                          return (
                            <div className="pl-5 text-muted">
                              <b className="text-emerald-600 dark:text-emerald-400">Đáp án:</b> {mc.answer}.{' '}
                              {ansText}
                            </div>
                          )
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )
        })}

        {filteredMilestones.length === 0 && (
          <div className="py-12 text-center text-xs text-muted">
            Không tìm thấy mốc thời gian phù hợp với từ khóa "{search}".
          </div>
        )}
      </div>
    </div>
  )
}
