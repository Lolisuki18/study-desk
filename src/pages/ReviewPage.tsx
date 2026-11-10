import { useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Bookmark, CalendarClock, CircleHelp, XCircle } from 'lucide-react'
import { allEntries, collections, entriesFor } from '../data'
import { useProgress } from '../features/learning/ProgressContext'
import { priority, reviewReasons, type ReviewReason } from '../services/review/srs'
import FlashcardSession from '../components/flashcards/FlashcardSession'
import { Card, Empty, PageHeader } from '../components/ui'

const CATS: { id: ReviewReason | 'all'; label: string; hint: string; icon: typeof CircleHelp }[] = [
  { id: 'all', label: 'Tất cả cần ôn', hint: 'Ưu tiên mục khó nhất trước', icon: CalendarClock },
  { id: 'unknown', label: 'Chưa biết', hint: 'Mục bạn đánh dấu chưa biết', icon: CircleHelp },
  { id: 'incorrect', label: 'Làm sai', hint: 'Lần gần nhất trả lời sai', icon: XCircle },
  { id: 'marked', label: 'Đã đánh dấu', hint: 'Mục bạn đã đánh dấu', icon: Bookmark },
  { id: 'due', label: 'Đến hạn', hint: 'Đến hạn theo Leitner', icon: CalendarClock },
]

export default function ReviewPage() {
  const { category } = useParams()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const { progress, get } = useProgress()
  const cid = sp.get('c') ?? ''

  // Queue snapshot for the *whole* page; recomputed when progress changes but only used for counts.
  const scoped = useMemo(() => (cid ? entriesFor(cid) : allEntries()), [cid])
  const withReasons = scoped
    .map((e) => ({ e, p: progress.get(`${e.collection.id}::${e.item.id}`) }))
    .map((x) => ({ ...x, reasons: reviewReasons(x.p) }))
    .filter((x) => x.reasons.length)

  const counts = Object.fromEntries(CATS.map((c) => [c.id, c.id === 'all' ? withReasons.length : withReasons.filter((x) => x.reasons.includes(c.id as ReviewReason)).length]))

  const queue = useMemo(() => {
    if (!category) return []
    const now = new Date()
    return scoped
      .map((e) => ({ e, p: get(e.collection.id, e.item.id) }))
      .filter((x) => x.p && (category === 'all' ? reviewReasons(x.p).length > 0 : reviewReasons(x.p).includes(category as ReviewReason)))
      .sort((a, b) => priority(b.p!, now) - priority(a.p!, now))
      .map((x) => x.e)
    // snapshot when entering a category
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, scoped])

  if (category)
    return (
      <div className="mx-auto max-w-3xl">
        <Link to={`/review${cid ? `?c=${cid}` : ''}`} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft size={14} /> Ôn tập
        </Link>
        <PageHeader title={`Ôn tập · ${CATS.find((c) => c.id === category)?.label ?? category}`} subtitle="Đã nhớ → lên hộp Leitner; Quên → về hộp 1" />
        <FlashcardSession key={category + cid} entries={queue} mode="review" />
      </div>
    )

  return (
    <div>
      <PageHeader
        title="Ôn tập"
        subtitle="Ôn tập tập trung, ưu tiên các mục khó (Leitner 5 hộp: 1 · 3 · 7 · 14 · 30 ngày)"
        actions={
          <select
            value={cid}
            onChange={(e) => nav(e.target.value ? `/review?c=${e.target.value}` : '/review')}
            className="rounded-lg border border-line bg-card px-3 py-2 text-sm"
          >
            <option value="">Tất cả bộ học</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        }
      />
      {counts.all === 0 && (
        <div className="mb-4">
          <Empty>Chưa có mục nào cần ôn. Hãy học Flashcards hoặc làm Quiz — các mục sai/chưa biết sẽ xuất hiện ở đây.</Empty>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {CATS.map(({ id, label, hint, icon: Icon }) => (
          <Link key={id} to={counts[id] ? `/review/${id}${cid ? `?c=${cid}` : ''}` : '#'} className={counts[id] ? '' : 'pointer-events-none opacity-50'}>
            <Card className="flex items-center gap-4 p-4 hover:bg-bg">
              <Icon size={20} className="text-muted" />
              <div className="flex-1">
                <div className="font-medium">{label}</div>
                <div className="text-sm text-muted">{hint}</div>
              </div>
              <div className="text-2xl font-semibold">{counts[id]}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
