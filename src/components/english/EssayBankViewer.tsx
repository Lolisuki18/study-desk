import { useState, useMemo } from 'react'
import {
  BookOpen,
  Filter,
  Search,
  Sparkles,
  Award,
  Layers,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Languages,
  CheckCircle2,
} from 'lucide-react'
import { Card } from '../ui'
import { cx } from '../../utils'
import { playSound } from '../../utils/sound'
import { haptic } from '../../utils/haptic'
import {
  ESSAY_BANK,
  filterEssays,
  type ModelEssay,
  type EssayTopic,
} from '../../services/english/essayBank'

interface EssayBankViewerProps {
  onLoadIntoEditor?: (essay: ModelEssay) => void
}

export function EssayBankViewer({ onLoadIntoEditor }: EssayBankViewerProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>('All')
  const [selectedTaskType, setSelectedTaskType] = useState<string>('All')
  const [selectedBand, setSelectedBand] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeEssayId, setActiveEssayId] = useState<string>(ESSAY_BANK[0]?.id || '')
  const [showTranslation, setShowTranslation] = useState(false)
  const [copied, setCopied] = useState(false)

  const filteredEssays = useMemo(() => {
    return filterEssays({
      taskType: selectedTaskType,
      topic: selectedTopic,
      bandScore: selectedBand,
      query: searchQuery,
    })
  }, [selectedTaskType, selectedTopic, selectedBand, searchQuery])

  const activeEssay = useMemo(() => {
    return ESSAY_BANK.find((e) => e.id === activeEssayId) || filteredEssays[0] || ESSAY_BANK[0]
  }, [activeEssayId, filteredEssays])

  const handleCopyEssay = () => {
    if (!activeEssay) return
    navigator.clipboard.writeText(activeEssay.essay)
    setCopied(true)
    playSound('correct')
    haptic('success')
    setTimeout(() => setCopied(false), 2000)
  }

  const topics: ('All' | EssayTopic)[] = [
    'All',
    'Technology & AI',
    'Education',
    'Environment & Climate',
    'Economy & Globalization',
  ]

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="rounded-3xl border-2 border-slate-200 dark:border-line bg-white dark:bg-card p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bài mẫu theo từ khóa, chủ đề, cụm collocations..."
              className="w-full rounded-2xl border border-line bg-slate-50 dark:bg-slate-800/60 py-2.5 pl-10 pr-3 text-xs text-ink outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 text-xs font-bold text-muted">
            <Award size={15} className="text-amber-500" />
            <span>Tìm thấy {filteredEssays.length} bài mẫu Band 7.0 - 8.5+</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-line/60">
          <div className="text-[11px] font-bold text-muted mr-1">Chủ đề:</div>
          {topics.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={cx(
                'rounded-xl px-3 py-1 text-xs font-bold transition-all cursor-pointer',
                selectedTopic === t
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'border border-line bg-card text-muted hover:border-indigo-300'
              )}
            >
              {t === 'All' ? 'Tất cả chủ đề' : t}
            </button>
          ))}

          <div className="text-[11px] font-bold text-muted ml-2 mr-1">Dạng bài:</div>
          {(['All', 'Task 1', 'Task 2'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedTaskType(type)}
              className={cx(
                'rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer',
                selectedTaskType === type
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-xs'
                  : 'border border-line bg-card text-muted hover:text-ink'
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dual-View: Essay Selector on Left, Full Essay Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Essay List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted">
            Danh sách bài mẫu ({filteredEssays.length})
          </div>

          <div className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
            {filteredEssays.map((essay) => (
              <button
                key={essay.id}
                onClick={() => {
                  setActiveEssayId(essay.id)
                  setShowTranslation(false)
                }}
                className={cx(
                  'w-full text-left rounded-2xl border-2 p-4 transition-all cursor-pointer space-y-2 shadow-2xs',
                  activeEssay?.id === essay.id
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-line bg-white dark:bg-card hover:border-indigo-300'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {essay.taskType} · {essay.topic}
                  </span>
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-black text-emerald-800 dark:text-emerald-300">
                    Band {essay.bandScore}
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                  {essay.title}
                </h4>

                <div className="text-[11px] text-muted flex items-center justify-between">
                  <span>{essay.questionType}</span>
                  <span>{essay.wordCount} từ</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Full Essay Content & 4-Criteria Breakdown */}
        {activeEssay && (
          <div className="lg:col-span-8 space-y-5">
            <div className="rounded-3xl border-2 border-slate-200 dark:border-line bg-white dark:bg-card p-6 sm:p-8 space-y-5 shadow-sm">
              {/* Header */}
              <div className="border-b border-line pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">
                      {activeEssay.taskType} · {activeEssay.topic}
                    </span>
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 dark:text-emerald-300">
                      Band {activeEssay.bandScore}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    {activeEssay.title}
                  </h3>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyEssay}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{copied ? 'Đã chép' : 'Sao chép bài'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTranslation((t) => !t)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                  >
                    <Languages size={14} />
                    <span>{showTranslation ? 'Ẩn bản dịch' : 'Dịch nghĩa Tiếng Việt'}</span>
                  </button>
                </div>
              </div>

              {/* Prompt box */}
              <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed font-serif">
                <b>Đề bài IELTS:</b> {activeEssay.prompt}
              </div>

              {/* Essay Body */}
              <div className="text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 font-serif space-y-4 text-justify">
                {activeEssay.essay.split('\n\n').map((para, i) => (
                  <p key={i} className="indent-4">
                    {para}
                  </p>
                ))}
              </div>

              {/* Translation (if enabled) */}
              {showTranslation && (
                <div className="rounded-2xl border border-line bg-slate-50 dark:bg-slate-800/40 p-5 space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed animate-in fade-in">
                  <div className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Bản dịch Tiếng Việt tham khảo:
                  </div>
                  <p className="font-serif italic text-justify leading-relaxed">
                    {activeEssay.vietnameseTranslation}
                  </p>
                </div>
              )}

              {/* 4-Criteria Examiner Assessment (ZIM / Ngọc Bách Style) */}
              <div className="border-t border-line pt-5 space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Award size={15} className="text-amber-500" />
                  <span>Phân tích chi tiết 4 Tiêu chí Chấm điểm của Giám khảo:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-2xl border border-line bg-slate-50 dark:bg-slate-800/40 p-3.5 space-y-1">
                    <div className="font-black text-indigo-700 dark:text-indigo-300">
                      1. Task Response (TR):
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {activeEssay.examinerCriteria.tr}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-line bg-slate-50 dark:bg-slate-800/40 p-3.5 space-y-1">
                    <div className="font-black text-indigo-700 dark:text-indigo-300">
                      2. Coherence & Cohesion (CC):
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {activeEssay.examinerCriteria.cc}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-line bg-slate-50 dark:bg-slate-800/40 p-3.5 space-y-1">
                    <div className="font-black text-emerald-700 dark:text-emerald-300">
                      3. Lexical Resource (LR):
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {activeEssay.examinerCriteria.lr}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-line bg-slate-50 dark:bg-slate-800/40 p-3.5 space-y-1">
                    <div className="font-black text-purple-700 dark:text-purple-300">
                      4. Grammatical Range & Accuracy (GRA):
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {activeEssay.examinerCriteria.gra}
                    </div>
                  </div>
                </div>

                {/* Key Collocations extracted */}
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-bold text-muted uppercase">
                    Cụm Collocations ăn điểm trích xuất từ bài:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeEssay.keyCollocations.map((colloc, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200"
                      >
                        <b>{colloc.phrase}</b>: <span className="text-[11px] text-emerald-700 dark:text-emerald-400">{colloc.meaningVi}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Structural Takeaways */}
                <div className="rounded-2xl border border-slate-200 dark:border-line bg-slate-50/70 dark:bg-slate-800/30 p-4 space-y-2 text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Sườn dàn bài & Bí kíp áp dụng:
                  </div>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                    {activeEssay.structuralTakeaways.map((takeaway, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
