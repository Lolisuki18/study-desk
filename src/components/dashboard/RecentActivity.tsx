import { Check, X } from 'lucide-react'
import { getCollection, itemTitle } from '../../data'
import { useProgress } from '../../features/learning/ProgressContext'
import { timeAgo } from '../../utils'
import { Card } from '../ui'

export default function RecentActivity({ limit = 8 }: { limit?: number }) {
  const { activity } = useProgress()
  const recent = [...activity].reverse().slice(0, limit)
  if (!recent.length) return <p className="text-sm text-muted">Chưa có hoạt động nào.</p>
  return (
    <Card className="divide-y divide-line">
      {recent.map((a, i) => {
        const c = getCollection(a.collectionId)
        const item = c?.items.find((x) => x.id === a.itemId)
        return (
          <div key={a.id ?? i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <span className={a.result === 'correct' ? 'text-ok' : 'text-err'}>
              {a.result === 'correct' ? <Check size={15} /> : <X size={15} />}
            </span>
            <span className="min-w-0 flex-1 truncate">{item ? itemTitle(item) : a.itemId}</span>
            <span className="hidden shrink-0 text-xs text-muted sm:block">{c?.title}</span>
            <span className="shrink-0 text-xs capitalize text-muted">{{ flashcard: 'thẻ', quiz: 'trắc nghiệm', review: 'ôn tập' }[a.kind]}</span>
            <span className="w-20 shrink-0 text-right text-xs text-muted">{timeAgo(a.ts)}</span>
          </div>
        )
      })}
    </Card>
  )
}
