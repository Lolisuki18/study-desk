import { useMemo, useState } from 'react'
import { CalendarRange, ChevronDown, ChevronRight, ListChecks, Search, X } from 'lucide-react'
import { allEntries, progressKey } from '../data'
import { extractTimelineMilestones, type TimelineMilestone } from '../services/timeline'
import { Card, PageHeader, Button } from '../components/ui'
import CramView from '../components/ui/CramView'
import { previewOf } from '../utils/preview'
import { matcher } from '../utils/search'
import { cx } from '../utils'

/** A subject needs at least this many dated milestones to be worth a timeline (others only have stray numbers). */
const MIN_MILESTONES = 5

export default function TimelinePage() {
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [expandedYear, setExpandedYear] = useState<number | null>(null)
  const [cramMilestone, setCramMilestone] = useState<TimelineMilestone | null>(null)

  // milestones per subject, once; subjects with too few dates are left out
  const bySubject = useMemo(() => {
    const groups = new Map<string, ReturnType<typeof allEntries>>()
    for (const e of allEntries()) {
      const list = groups.get(e.collection.subject)
      if (list) list.push(e)
      else groups.set(e.collection.subject, [e])
    }
    return [...groups]
      .map(([subject, entries]) => ({ subject, entries, milestones: extractTimelineMilestones(entries) }))
      .filter((g) => g.milestones.length >= MIN_MILESTONES)
      .sort((a, b) => b.milestones.length - a.milestones.length)
  }, [])

  const allMilestones = useMemo(() => {
    const list = subjectFilter === 'all' ? bySubject.flatMap((g) => g.entries) : (bySubject.find((g) => g.subject === subjectFilter)?.entries ?? [])
    return extractTimelineMilestones(list)
  }, [bySubject, subjectFilter])

  const filteredMilestones = useMemo(() => {
    if (!search.trim()) return allMilestones
    // same matcher as the Search page: no need to type diacritics, every word must appear
    const match = matcher(search)
    return allMilestones.filter((m) => match(`${m.year} ${m.dateStr ?? ''} ${m.title} ${m.entries.map((e) => previewOf(e.item).q).join(' ')}`))
  }, [allMilestones, search])

  if (cramMilestone) {
    return (
      <CramView
        entries={cramMilestone.entries}
        title={`Ôn tập mốc năm ${cramMilestone.year} (${cramMilestone.entries.length} câu)`}
        onClose={() => setCramMilestone(null)}
      />
    )
  }

  const pill = (active: boolean) =>
    cx(
      'whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer',
      active ? 'bg-indigo-600 text-white shadow-xs' : 'border border-line bg-card text-muted hover:text-ink',
    )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trục thời gian sự kiện"
        subtitle="Các mốc năm rút ra từ câu hỏi, đáp án đúng và lời giải, xếp theo thứ tự thời gian. Năm chỉ xuất hiện trong phương án sai được bỏ qua."
      />

      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-1.5">
          <button onClick={() => setSubjectFilter('all')} className={pill(subjectFilter === 'all')}>
            Tất cả
          </button>
          {bySubject.map((g) => (
            <button key={g.subject} onClick={() => setSubjectFilter(g.subject)} className={pill(subjectFilter === g.subject)}>
              {g.subject} ({g.milestones.length})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm năm hoặc từ khóa (1930, cuong linh…)"
            className="w-full rounded-xl border border-line bg-card py-1.5 pl-9 pr-8 text-xs font-semibold text-ink placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-muted hover:text-ink" aria-label="Xoá từ khoá">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/50 p-4 text-xs text-muted dark:border-indigo-900/50 dark:from-slate-900/80 dark:via-slate-900 dark:to-indigo-950/40">
        <span className="flex items-center gap-1.5 font-bold text-ink">
          <CalendarRange size={16} className="text-indigo-600 dark:text-indigo-400" />
          <span>
            {filteredMilestones.length} mốc niên đại{search.trim() ? ` khớp “${search.trim()}”` : ''}
          </span>
        </span>
        {allMilestones.length > 0 && (
          <span>
            Từ năm {allMilestones[0].year} đến {allMilestones[allMilestones.length - 1].year}
          </span>
        )}
      </div>

      <div className="relative space-y-6 pl-6 before:absolute before:bottom-3 before:left-3 before:top-3 before:w-0.5 before:bg-indigo-200 sm:pl-8 sm:before:left-4 dark:before:bg-indigo-950">
        {filteredMilestones.map((m) => {
          const isExpanded = expandedYear === m.year
          return (
            <div key={m.year} className="group relative">
              <div className="absolute -left-6 top-3 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border-2 border-indigo-600 bg-white text-indigo-600 shadow-md transition-all group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white sm:-left-8 sm:h-7 sm:w-7 dark:bg-card dark:text-indigo-400">
                <div className="h-2 w-2 rounded-full bg-current" />
              </div>

              <Card className="p-4 transition-all hover:border-indigo-300 hover:shadow-md sm:p-5 dark:hover:border-indigo-700">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xl font-black tracking-tight text-indigo-600 sm:text-2xl dark:text-indigo-400">{m.year}</span>
                      {m.dateStr && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-muted dark:bg-slate-800">{m.dateStr}</span>}
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {m.entries.length} câu hỏi
                      </span>
                    </div>
                    <p className="text-sm font-semibold leading-snug text-ink">{m.title}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="px-3 py-1.5 text-xs font-bold" onClick={() => setCramMilestone(m)} title="Lướt nhanh câu hỏi của mốc này">
                      <ListChecks size={14} className="text-indigo-600 dark:text-indigo-400" />
                      <span>Ôn mốc này</span>
                    </Button>
                    <button
                      onClick={() => setExpandedYear(isExpanded ? null : m.year)}
                      aria-expanded={isExpanded}
                      className="cursor-pointer rounded-lg border border-line p-1.5 text-muted hover:text-ink"
                      title={isExpanded ? 'Thu gọn' : 'Xem các câu hỏi'}
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-2.5 border-t border-line pt-3.5">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
                      {m.entries.length} câu hỏi liên quan mốc năm {m.year}
                    </div>
                    {m.entries.map((e, idx) => {
                      const p = previewOf(e.item)
                      return (
                        // ids repeat between collections, so the pair identifies a question
                        <div key={progressKey(e.collection.id, e.item.id)} className="space-y-1.5 rounded-xl border border-line bg-slate-50/70 p-3 text-xs dark:bg-slate-900/40">
                          <div className="flex items-start gap-2">
                            <span className="shrink-0 font-mono font-bold text-indigo-600 dark:text-indigo-400">#{idx + 1}</span>
                            <span className="font-semibold leading-relaxed text-ink">{p.q}</span>
                          </div>
                          <div className="pl-5 text-muted">
                            <b className="text-emerald-600 dark:text-emerald-400">Đáp án:</b> {p.a}
                          </div>
                          {p.exp && <div className="pl-5 text-muted">{p.exp}</div>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </div>
          )
        })}

        {filteredMilestones.length === 0 && (
          <div className="py-12 text-center text-xs text-muted">
            {search.trim() ? `Không tìm thấy mốc thời gian phù hợp với “${search}”.` : 'Chưa có mốc thời gian nào. Cần bộ học có năm trong câu hỏi hoặc đáp án.'}
          </div>
        )}
      </div>
    </div>
  )
}
