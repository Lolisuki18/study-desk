import { Link } from 'react-router-dom'
import {
  BookA,
  BookOpen,
  Code2,
  FileText,
  Layers,
  ListChecks,
} from 'lucide-react'
import type { Collection, ContentType } from '../../types'
import { collectionStats, useProgress } from '../../features/learning/ProgressContext'
import { Card, ProgressBar } from '../ui'
import { cx, pct } from '../../utils'

export function getContentTypeBadge(type: ContentType) {
  switch (type) {
    case 'multiple-choice':
      return { label: 'Trắc nghiệm', icon: ListChecks, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-100 dark:border-indigo-900/60' }
    case 'vocabulary':
      return { label: 'Từ vựng', icon: BookA, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-900/60' }
    case 'theory':
      return { label: 'Lý thuyết', icon: FileText, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-900/60' }
    case 'programming':
      return { label: 'Lập trình', icon: Code2, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-100 dark:border-blue-900/60' }
    default:
      return { label: 'Tổng hợp', icon: BookOpen, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-100 dark:border-purple-900/60' }
  }
}

export function getSubjectColor(subject: string) {
  const s = subject.toLowerCase()
  if (s.includes('lịch sử') || s.includes('đảng')) {
    return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
  }
  if (s.includes('cnxh') || s.includes('chủ nghĩa') || s.includes('triết')) {
    return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60'
  }
  if (s.includes('tiếng anh') || s.includes('english') || s.includes('từ vựng')) {
    return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
  }
  return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
}

export default function CollectionCard({ c }: { c: Collection }) {
  const { progress } = useProgress()
  const st = collectionStats(c.id, c.items.map((i) => i.id), progress)
  const percent = pct(st.mastered, st.total)
  const badge = getContentTypeBadge(c.contentType)
  const BadgeIcon = badge.icon
  const subjectStyle = getSubjectColor(c.subject)

  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 dark:hover:border-slate-700 hover:shadow-md">
      {/* Top badges: Subject & Content Type */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span
            className={cx(
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
              subjectStyle,
            )}
          >
            <span>{c.subject}</span>
          </span>

          <span
            className={cx(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
              badge.color,
            )}
          >
            <BadgeIcon size={12} />
            <span>{badge.label}</span>
          </span>
        </div>

        {/* Title & Description */}
        <Link to={`/collections/${c.id}`} className="block">
          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
            {c.title}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-muted line-clamp-2 leading-relaxed">
            {c.description || 'Chưa có mô tả cho bộ học này.'}
          </p>
        </Link>
      </div>

      {/* Progress & Quick Stats */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-line/60">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-slate-600 dark:text-muted">
            {c.items.length} mục
            {st.need > 0 && (
              <span className="ml-2 font-bold text-rose-600 dark:text-rose-400">
                · {st.need} cần ôn
              </span>
            )}
          </span>
          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
            {st.mastered}/{st.total} ({percent}%)
          </span>
        </div>

        <ProgressBar value={percent} className="h-2" />

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            to={`/flashcards/${c.id}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 shadow-2xs active:scale-[0.98]"
          >
            <Layers size={14} className="text-indigo-600" />
            <span>Thẻ ghi nhớ</span>
          </Link>
          <Link
            to={`/quiz/${c.id}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2 text-xs font-bold text-white transition-all shadow-xs active:scale-[0.98]"
          >
            <ListChecks size={14} />
            <span>Trắc nghiệm</span>
          </Link>
        </div>
      </div>
    </Card>
  )
}

export function CollectionsBySubject({ list }: { list: Collection[] }) {
  const subjects = [...new Set(list.map((c) => c.subject))].sort()
  return (
    <div className="space-y-8">
      {subjects.map((s) => {
        const items = list.filter((c) => c.subject === s)

        return (
          <section key={s}>
            <div className="mb-3.5 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-indigo-600" />
              <h2 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200 uppercase">
                {s} ({items.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {items.map((c) => (
                <CollectionCard key={c.id} c={c} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
