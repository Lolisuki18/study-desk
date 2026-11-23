import { useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Languages,
  ArrowRight,
  Sparkles,
  FileText,
  Volume2,
} from 'lucide-react'
import { Card } from '../ui'
import { cx } from '../../utils'
import { speakEnglish } from '../../utils/speech'
import { playSound } from '../../utils/sound'
import { haptic } from '../../utils/haptic'
import {
  CAMBRIDGE_READING_TESTS,
  type CambridgeReadingTest,
} from '../../services/english/cambridgeBank'

export function CambridgeBankViewer() {
  const [selectedTestId, setSelectedTestId] = useState<string>(
    CAMBRIDGE_READING_TESTS[0]?.id || ''
  )
  const [showAllTranslations, setShowAllTranslations] = useState(false)
  const [revealedParagraphs, setRevealedParagraphs] = useState<Record<string, boolean>>({})

  const activeTest =
    CAMBRIDGE_READING_TESTS.find((t) => t.id === selectedTestId) || CAMBRIDGE_READING_TESTS[0]

  const toggleParagraphTranslation = (label: string) => {
    setRevealedParagraphs((prev) => ({
      ...prev,
      [label]: !prev[label],
    }))
  }

  return (
    <div className="space-y-6">
      {/* Test Selector Top Bar */}
      <div className="rounded-3xl border-2 border-slate-200 dark:border-line bg-white dark:bg-card p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-[10px] font-mono font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              CAMBRIDGE IELTS ACADEMIC READING VA GIAI THICH CHI TIET (STUDY4 / ZIM STYLE)
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {activeTest.title}
            </h3>
          </div>

          {/* Translation Toggle */}
          <button
            type="button"
            onClick={() => setShowAllTranslations((t) => !t)}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-line bg-slate-50 dark:bg-slate-800/80 px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
          >
            <Languages size={15} />
            <span>{showAllTranslations ? 'Ẩn bản dịch toàn bài' : 'Hiện dịch nghĩa song ngữ'}</span>
          </button>
        </div>

        {/* Test Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/60">
          {CAMBRIDGE_READING_TESTS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTestId(t.id)
                setRevealedParagraphs({})
              }}
              className={cx(
                'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer',
                selectedTestId === t.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'border border-line bg-card text-muted hover:border-indigo-400'
              )}
            >
              {t.source.split('-')[0].trim()} - {t.domain.split('&')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Paragraph-by-Paragraph Reader */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl border-2 border-slate-200 dark:border-line bg-white dark:bg-card p-6 sm:p-8 space-y-5 shadow-sm">
            <div className="border-b border-line pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                {activeTest.source}
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1 leading-snug">
                {activeTest.title}
              </h2>
              <p className="mt-1 text-xs text-muted italic">{activeTest.summary}</p>
            </div>

            {/* Paragraphs */}
            <div className="space-y-5 font-serif text-sm leading-relaxed text-slate-800 dark:text-slate-200">
              {activeTest.paragraphs.map((p) => {
                const isTranslated = showAllTranslations || revealedParagraphs[p.label]

                return (
                  <div key={p.label} className="space-y-2 border-b border-line/50 pb-4 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 font-mono text-xs font-black text-indigo-700 dark:text-indigo-300">
                        {p.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleParagraphTranslation(p.label)}
                        className="text-[11px] font-sans font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        {isTranslated ? 'Ẩn dịch đoạn' : 'Dịch đoạn này'}
                      </button>
                    </div>

                    <p className="text-justify leading-relaxed indent-4">{p.textEn}</p>

                    {isTranslated && (
                      <div className="rounded-2xl border border-line bg-slate-50 dark:bg-slate-800/40 p-3.5 text-xs text-slate-600 dark:text-slate-300 font-sans italic leading-relaxed animate-in fade-in">
                        <b>Dịch nghĩa:</b> {p.textVi}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Detailed Question Breakdown & Vocabulary */}
        <div className="lg:col-span-5 space-y-5">
          {/* Questions Analysis */}
          <div className="rounded-3xl border-2 border-slate-200 dark:border-line bg-white dark:bg-card p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Giải thích đáp án chi tiết theo từng câu:
              </span>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {activeTest.questions.length} câu hỏi
              </span>
            </div>

            <div className="space-y-4">
              {activeTest.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-line bg-slate-50/70 dark:bg-slate-800/30 p-4 space-y-3 text-xs"
                >
                  <div className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-white font-mono text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {q.statement}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-muted">Đáp án đúng:</span>
                    <span className="rounded-lg bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 font-mono text-xs font-black text-emerald-800 dark:text-emerald-300">
                      {q.correct}
                    </span>
                  </div>

                  {/* Locating sentence */}
                  <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-2.5 text-[11px] font-serif italic text-indigo-950 dark:text-indigo-200">
                    <b>Câu chứa đáp án trong bài:</b> "{q.locatingSentence}"
                  </div>

                  {/* Explanation */}
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {q.explanationVi}
                  </p>

                  {/* Key Vocab */}
                  {q.keyVocabulary.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-line/60">
                      {q.keyVocabulary.map((v, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-slate-200/70 dark:bg-slate-700 px-2 py-0.5 text-[10px] text-slate-800 dark:text-slate-200"
                        >
                          <b>{v.word}</b>: {v.meaningVi}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Topic Vocabulary Table */}
          <div className="rounded-3xl border-2 border-slate-200 dark:border-line bg-white dark:bg-card p-6 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                <span>Từ vựng ăn điểm trong bài đọc:</span>
              </span>
            </div>

            <div className="space-y-2">
              {activeTest.vocabularyTable.map((vocab, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-line bg-slate-50 dark:bg-slate-800/40 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-indigo-700 dark:text-indigo-300">
                        {vocab.word}
                      </span>
                      <span className="font-mono text-[11px] text-muted">{vocab.ipa}</span>
                    </div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300">
                      {vocab.meaningVi}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => speakEnglish(vocab.word, { accent: 'UK' })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Nghe phát âm"
                  >
                    <Volume2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
