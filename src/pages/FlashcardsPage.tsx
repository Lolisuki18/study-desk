import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { entriesFor, getCollection } from '../data'
import CollectionPicker from '../components/dashboard/CollectionPicker'
import FlashcardSession from '../components/flashcards/FlashcardSession'
import { Empty, PageHeader } from '../components/ui'

export default function FlashcardsPage() {
  const { id } = useParams()
  const entries = useMemo(() => (id ? entriesFor(id) : []), [id])
  if (!id)
    return (
      <div>
        <PageHeader title="Thẻ ghi nhớ" subtitle="Chọn bộ học để bắt đầu" />
        <CollectionPicker base="/flashcards" />
      </div>
    )
  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/flashcards" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} /> Chọn bộ khác
      </Link>
      <PageHeader title={id === 'all' ? 'Thẻ ghi nhớ · Tất cả' : getCollection(id)?.title ?? 'Thẻ ghi nhớ'} />
      {entries.length ? <FlashcardSession entries={entries} /> : <Empty>Không tìm thấy bộ học.</Empty>}
    </div>
  )
}
