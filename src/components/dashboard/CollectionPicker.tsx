import { Link } from 'react-router-dom'
import { ChevronRight, Layers, Sparkles } from 'lucide-react'
import { collections } from '../../data'
import { collectionStats, useProgress } from '../../features/learning/ProgressContext'
import { Card, Empty, ProgressBar } from '../ui'
import { pct, cx } from '../../utils'
import { getContentTypeBadge, getSubjectColor } from './CollectionCard'

/** Pick a collection (or all) and jump to `${base}/${id}`. Used by Flashcards and Quiz. */
export default function CollectionPicker({ base, allowAll = true }: { base: string; allowAll?: boolean }) {
  const { progress, summary } = useProgress()
  if (!collections.length)
    return <Empty>Chưa có bộ học nào. Hãy nhờ AI Agent thêm một file JSON vào src/data/collections.</Empty>

  const subjects = [...new Set(collections.map((c) => c.subject))].sort()

  return (
    <div className="space-y-6">
      {allowAll && (
        <Link to={`${base}/all`} className="block group">
          <Card className="flex flex-col gap-3 p-4 transition-all duration-200 sm:flex-row sm:items-center sm:justify-between sm:p-5 sm:hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-600 text-white shadow-xs">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="font-bold text-base text-slate-900 dark:text-ink group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Tất cả bộ học (Ôn luyện toàn diện)
                </div>
                <div className="text-xs text-muted mt-0.5 font-medium">
                  Gồm toàn bộ {summary.items} mục từ {summary.collections} bộ học hiện có
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end text-xs font-semibold text-indigo-600 dark:text-indigo-400 sm:self-auto">
              <span className="whitespace-nowrap">Bắt đầu ngay</span>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>
      )}

      {subjects.map((s) => {
        return (
          <section key={s}>
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{s}</h2>
            </div>
            <div className="space-y-2.5">
              {collections
                .filter((c) => c.subject === s)
                .map((c) => {
                  const st = collectionStats(c.id, c.items.map((i) => i.id), progress)
                  const percent = pct(st.mastered, st.total)
                  const badge = getContentTypeBadge(c.contentType)
                  const BadgeIcon = badge.icon

                  return (
                    <Link key={c.id} to={`${base}/${c.id}`} className="block group">
                      <Card className="flex flex-col gap-2.5 p-4 transition-all duration-150 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs sm:flex-row sm:items-center sm:gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={cx(
                                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                                badge.color,
                              )}
                            >
                              <BadgeIcon size={11} />
                              <span>{badge.label}</span>
                            </span>
                            <span className="text-xs text-muted font-medium">· {c.items.length} mục</span>
                          </div>
                          <div className="line-clamp-2 text-sm font-bold leading-snug text-slate-800 transition-colors group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400 sm:truncate">
                            {c.title}
                          </div>
                        </div>

                        <div className="flex w-full items-center gap-2.5 sm:block sm:w-32 sm:shrink-0">
                          <ProgressBar value={percent} className="h-1.5 flex-1 sm:order-2" />
                          <div className="text-right font-mono text-xs font-bold text-slate-700 dark:text-slate-300 sm:order-1 sm:mb-1">
                            {percent}%
                          </div>
                        </div>

                        <ChevronRight
                          size={18}
                          className="hidden text-slate-400 sm:block dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all"
                        />
                      </Card>
                    </Link>
                  )
                })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
