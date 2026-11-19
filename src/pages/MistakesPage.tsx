import { useMemo, useState } from 'react'
import AppIcon from '../components/ui/AppIcon'
import { ArrowLeft, Layers, ListChecks, NotebookPen, Printer, Target, Zap, Tag, Sparkles, X } from 'lucide-react'
import type { Entry } from '../types'
import { allEntries, collections, itemTitle, progressKey } from '../data'
import { useProgress } from '../features/learning/ProgressContext'
import { availableKinds, buildQuiz, type Question } from '../services/quiz/generate'
import { chapterLabel } from '../services/quiz/exam'
import FlashcardSession from '../components/flashcards/FlashcardSession'
import QuizRunner from '../components/quiz/QuizRunner'
import ItemSummary from '../components/ui/ItemSummary'
import { Button, Card, Empty, PageHeader } from '../components/ui'
import { cx } from '../utils'

const LIMIT = 100
const MINS = [1, 2, 3]
const STORAGE_TAGS_KEY = 'psh.mistake_reasons'

export interface MistakeTag {
  id: string
  label: string
  shortLabel: string
  icon: string
  pillClass: string
}

export const MISTAKE_TAGS: MistakeTag[] = [
  {
    id: 'gap',
    label: 'Chưa học kỹ lý thuyết',
    shortLabel: 'Chưa học kỹ',
    icon: 'book',
    pillClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900',
  },
  {
    id: 'careless',
    label: 'Đọc ẩu / Nhầm đáp án',
    shortLabel: 'Đọc ẩu / Nhầm',
    icon: 'zap',
    pillClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900',
  },
  {
    id: 'timeline',
    label: 'Nhầm mốc thời gian / Số liệu',
    shortLabel: 'Mốc TG / Số liệu',
    icon: 'calendar',
    pillClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-900',
  },
  {
    id: 'tricky',
    label: 'Câu hỏi bẫy / Khó hiểu',
    shortLabel: 'Câu bẫy / Khó',
    icon: 'help',
    pillClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900',
  },
]

type Run = { kind: 'quiz'; qs: Question[]; n: number } | { kind: 'cards'; entries: Entry[] }

/** Notebook of every item answered wrong at least once, hardest first, with radar and reason tagging. */
export default function MistakesPage() {
  const { progress, notes } = useProgress()
  const [subject, setSubject] = useState('')
  const [chapter, setChapter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [min, setMin] = useState(1)
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [run, setRun] = useState<Run | null>(null)

  const [tags, setTags] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_TAGS_KEY) ?? '{}')
    } catch {
      return {}
    }
  })

  const handleSetTag = (key: string, tagId: string | null) => {
    setTags((prev) => {
      const next = { ...prev }
      if (tagId) {
        next[key] = tagId
      } else {
        delete next[key]
      }
      try {
        localStorage.setItem(STORAGE_TAGS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const subjects = useMemo(() => [...new Set(collections.map((c) => c.subject))].sort(), [])

  // Base list of all items with mistakes in selected subject
  const subjectMistakes = useMemo(() => {
    return allEntries()
      .map((e) => {
        const key = progressKey(e.collection.id, e.item.id)
        return {
          e,
          key,
          p: progress.get(key),
          tag: tags[key],
          chapter: chapterLabel(e.collection),
        }
      })
      .filter((x) => x.p && x.p.incorrect >= 1 && (!subject || x.e.collection.subject === subject))
  }, [progress, subject, tags])

  // Chapter statistics for Radar
  const chapterStats = useMemo(() => {
    const map = new Map<string, { label: string; entries: Entry[]; totalMistakes: number }>()
    for (const item of subjectMistakes) {
      const cl = item.chapter
      const existing = map.get(cl)
      if (existing) {
        existing.entries.push(item.e)
        existing.totalMistakes += item.p!.incorrect
      } else {
        map.set(cl, {
          label: cl,
          entries: [item.e],
          totalMistakes: item.p!.incorrect,
        })
      }
    }
    return [...map.values()].sort((a, b) => b.entries.length - a.entries.length || b.totalMistakes - a.totalMistakes)
  }, [subjectMistakes])

  const weakestChapter = chapterStats[0]

  // Filtered rows for the list
  const rows = useMemo(
    () =>
      subjectMistakes
        .filter((x) => {
          if (!x.p || x.p.incorrect < min) return false
          if (chapter && x.chapter !== chapter) return false
          if (onlyOpen && x.p.lastResult !== 'incorrect') return false
          if (tagFilter) {
            if (tagFilter === '__none__') {
              if (x.tag) return false
            } else if (x.tag !== tagFilter) {
              return false
            }
          }
          return true
        })
        .sort((a, b) => b.p!.incorrect - a.p!.incorrect || a.p!.correct - b.p!.correct),
    [subjectMistakes, min, chapter, onlyOpen, tagFilter],
  )

  const startQuizWithEntries = (list: Entry[]) => {
    const qs = buildQuiz(list, {
      count: list.length,
      kinds: availableKinds(list).filter((k) => k !== 'match'),
      randomize: true,
      distractorPool: allEntries(),
    })
    if (qs.length) setRun({ kind: 'quiz', qs, n: 0 })
  }

  if (run)
    return (
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => setRun(null)}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Quay lại Sổ câu sai
        </button>
        {run.kind === 'cards' ? (
          <FlashcardSession entries={run.entries} mode="review" />
        ) : (
          <QuizRunner
            key={run.n}
            questions={run.qs}
            mode="practice"
            onExit={() => setRun(null)}
            onRetry={(qs) => setRun({ kind: 'quiz', qs: qs.map((q) => ({ ...q, id: `${q.id}r` })), n: run.n + 1 })}
          />
        )}
      </div>
    )

  const entries = rows.map((x) => x.e)

  const pill = (active: boolean) =>
    cx(
      'rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer select-none',
      active
        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
        : 'border border-line bg-card text-muted hover:border-slate-300 dark:hover:border-slate-700 hover:text-ink',
    )

  // Reason tag counts
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = { __none__: 0 }
    MISTAKE_TAGS.forEach((t) => (counts[t.id] = 0))
    for (const item of subjectMistakes) {
      if (item.tag && counts[item.tag] !== undefined) {
        counts[item.tag]++
      } else {
        counts.__none__++
      }
    }
    return counts
  }, [subjectMistakes])

  return (
    <div className="space-y-6">
      <div className="print:hidden space-y-5">
        <PageHeader
          title="Sổ tay câu làm sai"
          subtitle="Tự động phân tích điểm yếu kiến thức, gắn nhãn nguyên nhân sai và luyện tập cấp tốc"
          actions={
            <div className="flex items-center gap-2">
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value)
                  setChapter('')
                }}
                className="rounded-xl border border-line bg-card px-3 py-2 text-xs font-semibold text-ink outline-none cursor-pointer"
                aria-label="Lọc theo môn"
              >
                <option value="">Tất cả môn học</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          }
        />

        {/* Radar phát hiện chương yếu nhất */}
        {weakestChapter && weakestChapter.entries.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-gradient-to-r from-rose-50/90 via-amber-50/40 to-card dark:from-rose-950/40 dark:via-amber-950/20 dark:to-card p-4.5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                  <Target size={24} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <Sparkles size={12} /> Radar phát hiện vùng yếu nhất
                    </span>
                    <span className="rounded-full bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                      Cần củng cố gấp
                    </span>
                  </div>
                  <h3 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                    {weakestChapter.label} ({weakestChapter.entries.length} câu hay sai · {weakestChapter.totalMistakes} lượt trả lời sai)
                  </h3>
                  <p className="mt-0.5 text-xs text-muted">
                    Đây là nội dung đang làm bạn mất điểm nhiều nhất. Hãy làm lại ngay để kịp thời bù lấp lỗ hổng!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <Button
                  variant="primary"
                  onClick={() => startQuizWithEntries(weakestChapter.entries)}
                  className="py-1.5 px-3 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                >
                  <Zap size={14} /> Luyện cấp tốc ({weakestChapter.entries.length})
                </Button>
                <Button
                  onClick={() => setRun({ kind: 'cards', entries: weakestChapter.entries })}
                  className="py-1.5 px-3 text-xs font-semibold cursor-pointer"
                >
                  <Layers size={14} /> Lật thẻ
                </Button>
              </div>
            </div>

            {/* Chapter Quick Selection Chips */}
            {chapterStats.length > 1 && (
              <div className="mt-3.5 pt-3 border-t border-rose-200/60 dark:border-rose-900/40 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted font-medium mr-1">Các chương có câu sai:</span>
                {chapterStats.map((c) => {
                  const isCurrent = chapter === c.label
                  return (
                    <button
                      key={c.label}
                      onClick={() => setChapter(isCurrent ? '' : c.label)}
                      className={cx(
                        'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5',
                        isCurrent
                          ? 'bg-rose-600 text-white shadow-2xs font-bold'
                          : 'bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose-300 dark:hover:border-rose-700',
                      )}
                    >
                      <span>{c.label}</span>
                      <span
                        className={cx(
                          'text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold',
                          isCurrent ? 'bg-rose-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-muted',
                        )}
                      >
                        {c.entries.length}
                      </span>
                    </button>
                  )
                })}
                {chapter && (
                  <button
                    onClick={() => setChapter('')}
                    className="text-[11px] text-muted hover:text-ink underline ml-1 cursor-pointer font-medium"
                  >
                    Xem tất cả chương
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reason Tag Filters */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-muted font-medium mr-1 flex items-center gap-1">
            <Tag size={12} /> Lọc lý do sai:
          </span>
          <button
            onClick={() => setTagFilter('')}
            className={cx(
              'rounded-xl px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer select-none',
              tagFilter === ''
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                : 'border border-line bg-card text-muted hover:border-slate-300 dark:hover:border-slate-700 hover:text-ink',
            )}
          >
            Tất cả ({subjectMistakes.length})
          </button>
          {MISTAKE_TAGS.map((t) => {
            const count = tagCounts[t.id] || 0
            const active = tagFilter === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTagFilter(active ? '' : t.id)}
                className={cx(
                  'rounded-xl px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer select-none flex items-center gap-1',
                  active
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                    : 'border border-line bg-card text-muted hover:border-slate-300 dark:hover:border-slate-700 hover:text-ink',
                )}
              >
                <AppIcon name={t.icon} size={13} />
                <span>{t.shortLabel}</span>
                <span className="font-mono text-[10px] opacity-75">({count})</span>
              </button>
            )
          })}
          <button
            onClick={() => setTagFilter(tagFilter === '__none__' ? '' : '__none__')}
            className={cx(
              'rounded-xl px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer select-none flex items-center gap-1',
              tagFilter === '__none__'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                : 'border border-line bg-card text-muted hover:border-slate-300 dark:hover:border-slate-700 hover:text-ink',
            )}
          >
            <span>Chưa gắn</span>
            <span className="font-mono text-[10px] opacity-75">({tagCounts.__none__})</span>
          </button>
        </div>

        {/* Filter Pills & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {MINS.map((n) => (
              <button key={n} onClick={() => setMin(n)} className={pill(min === n)}>
                Sai từ {n} lần
              </button>
            ))}
            <button
              onClick={() => setOnlyOpen((v) => !v)}
              className={pill(onlyOpen)}
              title="Chỉ giữ câu mà lần gần nhất vẫn làm sai"
            >
              Lần gần nhất còn sai
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              disabled={!rows.length}
              onClick={() => window.print()}
              title="In hoặc lưu thành PDF tài liệu ôn thi"
              className="py-2 px-3 text-xs cursor-pointer"
            >
              <Printer size={14} /> In / PDF
            </Button>
            <Button
              disabled={!rows.length}
              onClick={() => setRun({ kind: 'cards', entries })}
              className="py-2 px-3 text-xs cursor-pointer"
            >
              <Layers size={14} /> Ôn bằng thẻ ({rows.length})
            </Button>
            <Button
              variant="primary"
              disabled={!rows.length}
              onClick={() => startQuizWithEntries(entries)}
              className="py-2 px-4 text-xs font-bold cursor-pointer"
            >
              <ListChecks size={14} /> Làm lại {rows.length} câu này
            </Button>
          </div>
        </div>

        {!rows.length ? (
          <Empty icon={<NotebookPen size={36} />}>
            <div className="font-bold text-ink text-base mb-1">Không có câu sai nào phù hợp</div>
            <p className="text-xs text-muted leading-relaxed">
              {subjectMistakes.length > 0
                ? 'Thử điều chỉnh lại bộ lọc chương, lý do sai hoặc số lần sai để xem danh sách câu hỏi.'
                : 'Các câu bạn trả lời sai ở Thẻ ghi nhớ, Trắc nghiệm hay Thi thử sẽ tự động được ghi nhận về đây để bạn ôn tập lại.'}
            </p>
          </Empty>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-muted font-medium flex items-center justify-between">
              <span>
                Tìm thấy <b className="text-ink">{rows.length}</b> câu hỏi cần lưu ý:
              </span>
              {chapter && (
                <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                  Đang lọc: {chapter}
                </span>
              )}
            </div>
            <Card className="divide-y divide-line/70 overflow-hidden shadow-xs">
              {rows.slice(0, LIMIT).map(({ e, p, key, tag }) => {
                const currentTag = MISTAKE_TAGS.find((t) => t.id === tag)
                return (
                  <ItemSummary
                    key={key}
                    entry={e}
                    meta={
                      <div className="flex items-center gap-1.5">
                        {currentTag && (
                          <span className={cx('rounded-lg border px-2 py-0.5 text-[11px] font-bold shrink-0', currentTag.pillClass)}>
                            <AppIcon name={currentTag.icon} size={12} className="inline" /> {currentTag.shortLabel}
                          </span>
                        )}
                        <span className="rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                          sai {p!.incorrect}
                        </span>
                        <span className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                          đúng {p!.correct}
                        </span>
                      </div>
                    }
                    extra={
                      <div className="rounded-xl border border-line/70 bg-slate-50/70 dark:bg-slate-800/40 p-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[11px] font-bold text-muted flex items-center gap-1">
                            <Tag size={12} /> Gắn nhãn nguyên nhân làm sai:
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            {MISTAKE_TAGS.map((t) => {
                              const isSelected = tag === t.id
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={(ev) => {
                                    ev.stopPropagation()
                                    handleSetTag(key, isSelected ? null : t.id)
                                  }}
                                  className={cx(
                                    'rounded-lg px-2 py-0.5 text-[11px] font-semibold transition-all border cursor-pointer select-none flex items-center gap-1',
                                    isSelected
                                      ? t.pillClass + ' ring-1 ring-current font-bold'
                                      : 'border-line bg-card text-muted hover:border-slate-300 dark:hover:border-slate-700 hover:text-ink',
                                  )}
                                  title={t.label}
                                >
                                  <AppIcon name={t.icon} size={13} />
                                  <span>{t.shortLabel}</span>
                                </button>
                              )
                            })}
                            {tag && (
                              <button
                                type="button"
                                onClick={(ev) => {
                                  ev.stopPropagation()
                                  handleSetTag(key, null)
                                }}
                                className="rounded-lg border border-line bg-card px-2 py-0.5 text-[11px] font-semibold text-muted hover:text-rose-500 cursor-pointer"
                                title="Xóa nhãn"
                              >
                                <X size={12} className="inline" /> Bỏ nhãn
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    }
                  />
                )
              })}
            </Card>
            {rows.length > LIMIT && (
              <p className="text-center text-xs text-muted">
                Đang hiển thị {LIMIT} / {rows.length} câu đầu tiên. Nút “Làm lại” hoặc “Ôn bằng thẻ” vẫn gồm đầy đủ {rows.length} câu.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Sheet in ấn ra PDF / Giấy A4 */}
      <div className="hidden text-[12px] leading-snug text-black print:block font-sans">
        <div className="border-b-2 border-black pb-3 mb-4">
          <h1 className="text-xl font-bold uppercase tracking-tight">
            Sổ tay tổng hợp câu hỏi làm sai{subject ? ` · Môn ${subject}` : ''}
          </h1>
          <p className="mt-1 text-[11px] text-gray-700">
            Tổng số: {rows.length} câu hỏi · Lọc: sai từ {min} lần{chapter ? ` · Chương: ${chapter}` : ''}
            {tagFilter ? ` · Lý do: ${MISTAKE_TAGS.find((t) => t.id === tagFilter)?.label ?? tagFilter}` : ''}
            {onlyOpen ? ' · Lần gần nhất còn sai' : ''} · Ngày in: {new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>
        <ol className="space-y-3">
          {rows.map(({ e, p, tag }, n) => {
            const note = notes.get(progressKey(e.collection.id, e.item.id))?.text
            const it = e.item
            const tagObj = MISTAKE_TAGS.find((t) => t.id === tag)
            return (
              <li key={progressKey(e.collection.id, it.id)} className="break-inside-avoid border-b border-gray-300 pb-3">
                <div className="font-bold text-[13px]">
                  Câu {n + 1}. {itemTitle(it)}
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5 flex items-center gap-2">
                  <span>
                    Bộ học: {e.collection.title} {it.source?.ref ? `· Nguồn: ${it.source.ref}` : ''} (Sai: {p!.incorrect} lần, Đúng: {p!.correct} lần)
                  </span>
                  {tagObj && (
                    <span className="font-bold text-amber-900 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      <AppIcon name={tagObj.icon} size={13} className="inline" /> {tagObj.label}
                    </span>
                  )}
                </div>

                {it.type === 'multiple-choice' && (
                  <ul className="mt-1.5 space-y-0.5 pl-2">
                    {it.content.options.map((o) => {
                      const right = it.content.answer.includes(o.key)
                      return (
                        <li key={o.key} className={right ? 'font-bold text-black' : 'text-gray-800'}>
                          <span className="inline-block w-6">{right ? '● ' : '○ '}</span>
                          <b>{o.key}.</b> {o.text}
                        </li>
                      )
                    })}
                  </ul>
                )}

                {it.type === 'true-false' && (
                  <div className="mt-1 font-bold text-black">Đáp án: {it.content.answer ? 'Đúng' : 'Sai'}</div>
                )}
                {it.type === 'vocabulary' && (
                  <div className="mt-1 font-bold text-black">Nghĩa: {it.content.meaning}</div>
                )}
                {(it.type === 'theory' || it.type === 'programming') && (
                  <div className="mt-1 font-bold text-black">Định nghĩa: {it.content.definition}</div>
                )}
                {'explanation' in it.content && it.content.explanation && (
                  <div className="mt-1 text-[11px] text-gray-800 italic bg-gray-50 p-1.5 rounded border border-gray-200">
                    Giải thích: {it.content.explanation}
                  </div>
                )}
                {note && (
                  <div className="mt-1 text-[11px] text-indigo-900 bg-indigo-50 p-1.5 rounded">
                    Ghi chú cá nhân: {note}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
