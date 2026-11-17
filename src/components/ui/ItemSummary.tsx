import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import type { Entry } from '../../types'
import { itemTitle } from '../../data'
import { cx } from '../../utils'
import { CardBack, Enrichment } from '../flashcards/CardContent'
import NoteBox from './NoteBox'

/** One item as an expandable row: title + collection, opening to the answer, explanation and personal note. */
export default function ItemSummary({ entry, meta, defaultOpen = false }: { entry: Entry; meta?: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const { collection, item } = entry
  return (
    <div className="text-sm">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50/70">
        <ChevronDown size={16} className={cx('mt-0.5 shrink-0 text-muted transition-transform', open && 'rotate-180')} />
        <span className="min-w-0 flex-1">
          <span className={cx('block font-medium text-slate-800', !open && 'line-clamp-2')}>{itemTitle(item)}</span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {collection.title}
            {item.source?.ref ? ` · ${item.source.ref}` : ''}
          </span>
        </span>
        {meta && <span className="flex shrink-0 items-center gap-1.5">{meta}</span>}
      </button>
      {open && (
        <div className="space-y-3 px-4 pb-4 pl-11">
          {item.type === 'multiple-choice' ? (
            <>
              <ul className="space-y-1">
                {item.content.options.map((o) => {
                  const right = item.content.answer.includes(o.key)
                  return (
                    <li key={o.key} className={cx('flex gap-2 rounded-lg px-2 py-1', right ? 'bg-emerald-50 font-semibold text-emerald-800' : 'text-slate-600')}>
                      <span className="shrink-0">{o.key}.</span>
                      <span>{o.text}</span>
                    </li>
                  )
                })}
              </ul>
              {item.content.explanation ? (
                <p className="leading-relaxed text-slate-700">{item.content.explanation}</p>
              ) : (
                !item.enrichment && <p className="italic text-muted">Tài liệu gốc chưa có giải thích cho câu này.</p>
              )}
              <Enrichment item={item} />
            </>
          ) : (
            <CardBack item={item} />
          )}
          <NoteBox collectionId={collection.id} itemId={item.id} />
          <Link to={`/collections/${collection.id}`} className="inline-block text-xs font-semibold text-indigo-600 hover:underline">
            Mở bộ học này
          </Link>
        </div>
      )}
    </div>
  )
}
