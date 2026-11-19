import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Star } from 'lucide-react'
import type { Entry } from '../../types'
import { itemTitle } from '../../data'
import { cx } from '../../utils'
import { CardBack, Enrichment } from '../flashcards/CardContent'
import NoteBox from './NoteBox'
import { useStarred } from '../../services/storage/starred'

/** One item as an expandable row: title + collection, opening to the answer, explanation and personal note. */
export default function ItemSummary({
  entry,
  meta,
  defaultOpen = false,
  extra,
}: {
  entry: Entry
  meta?: ReactNode
  defaultOpen?: boolean
  extra?: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const { collection, item } = entry
  const { isStarred, toggle: toggleStar } = useStarred()
  const starred = isStarred(collection.id, item.id)

  return (
    <div className="text-sm">
      <div className="flex w-full items-start gap-3 px-4 py-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mt-0.5 shrink-0 text-muted transition-transform cursor-pointer"
          aria-label={open ? 'Thu gọn' : 'Mở rộng'}
        >
          <ChevronDown size={16} className={cx(open && 'rotate-180')} />
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="min-w-0 flex-1 text-left cursor-pointer"
        >
          <span className={cx('block font-medium text-slate-800 dark:text-slate-100', !open && 'line-clamp-2')}>{itemTitle(item)}</span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {collection.title}
            {item.source?.ref ? ` · ${item.source.ref}` : ''}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {meta}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleStar(collection.id, item.id)
            }}
            className={cx(
              'shrink-0 p-1 rounded-lg transition-colors cursor-pointer',
              starred
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-slate-300 dark:text-slate-600 hover:text-amber-500',
            )}
            title={starred ? 'Bỏ gắn sao' : 'Gắn sao ôn tủ'}
          >
            <Star size={16} className={cx(starred && 'fill-amber-500')} />
          </button>
        </div>
      </div>
      {open && (
        <div className="space-y-3 px-4 pb-4 pl-11">
          {item.type === 'multiple-choice' ? (
            <>
              <ul className="space-y-1">
                {item.content.options.map((o) => {
                  const right = item.content.answer.includes(o.key)
                  return (
                    <li
                      key={o.key}
                      className={cx(
                        'flex gap-2 rounded-lg px-2 py-1',
                        right ? 'bg-emerald-50 dark:bg-emerald-950/50 font-semibold text-emerald-800 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400',
                      )}
                    >
                      <span className="shrink-0">{o.key}.</span>
                      <span>{o.text}</span>
                    </li>
                  )
                })}
              </ul>
              {item.content.explanation ? (
                <p className="leading-relaxed text-slate-700 dark:text-slate-300">{item.content.explanation}</p>
              ) : (
                !item.enrichment && <p className="italic text-muted">Tài liệu gốc chưa có giải thích cho câu này.</p>
              )}
              <Enrichment item={item} />
            </>
          ) : (
            <CardBack item={item} />
          )}
          {extra}
          <NoteBox collectionId={collection.id} itemId={item.id} />
          <Link to={`/collections/${collection.id}`} className="inline-block text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Mở bộ học này
          </Link>
        </div>
      )}
    </div>
  )
}
