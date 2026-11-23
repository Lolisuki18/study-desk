import { useState, useEffect } from 'react'
import {
  Search,
  Volume2,
  X,
  BookA,
  Sparkles,
  ArrowRight,
  BookOpen,
  Check,
} from 'lucide-react'
import { cx } from '../../utils'
import { speakEnglish } from '../../utils/speech'
import { playSound } from '../../utils/sound'
import {
  searchDictionary,
  lookupWord,
  type DictionaryEntry,
} from '../../services/english/dictionary'

interface DictionaryModalProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
}

export function DictionaryModal({ isOpen, onClose, initialQuery = '' }: DictionaryModalProps) {
  const [query, setQuery] = useState(initialQuery)
  const [selectedWord, setSelectedWord] = useState<DictionaryEntry | null>(null)

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery)
      const exact = lookupWord(initialQuery)
      if (exact) setSelectedWord(exact)
    }
  }, [initialQuery, isOpen])

  const results = searchDictionary(query, 10)

  useEffect(() => {
    if (results.length > 0 && !selectedWord) {
      setSelectedWord(results[0])
    }
  }, [query, results, selectedWord])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border-2 border-slate-200 dark:border-line bg-white dark:bg-card shadow-2xl flex flex-col max-h-[85vh]">
        {/* Top Search Bar */}
        <div className="p-4 sm:p-5 border-b border-line flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50">
          <BookA size={20} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                const exact = lookupWord(e.target.value)
                if (exact) setSelectedWord(exact)
              }}
              placeholder="Tra từ điển offline (Gõ từ tiếng Anh hoặc nghĩa tiếng Việt)..."
              className="w-full rounded-2xl border border-line bg-white dark:bg-card py-2.5 pl-10 pr-4 text-sm font-bold text-ink outline-none focus:border-indigo-500 shadow-2xs"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-ink hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Đóng (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body: Left quick list, Right full entry */}
        <div className="grid grid-cols-1 sm:grid-cols-12 flex-1 overflow-hidden">
          {/* Quick List (4 cols) */}
          <div className="sm:col-span-4 border-r border-line p-3 overflow-y-auto space-y-1 bg-slate-50/40 dark:bg-slate-900/20 max-h-56 sm:max-h-none">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted px-2 py-1">
              Gợi ý từ ({results.length})
            </div>
            {results.map((entry) => (
              <button
                key={entry.word}
                onClick={() => setSelectedWord(entry)}
                className={cx(
                  'w-full text-left rounded-xl px-3 py-2 text-xs transition-all cursor-pointer flex flex-col gap-0.5',
                  selectedWord?.word === entry.word
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold">{entry.word}</span>
                  <span className="font-mono text-[10px] opacity-80">{entry.band}</span>
                </div>
                <span className="text-[10px] truncate opacity-90">{entry.meaningVi}</span>
              </button>
            ))}
          </div>

          {/* Full Word Details (8 cols) */}
          <div className="sm:col-span-8 p-5 sm:p-6 overflow-y-auto space-y-4">
            {selectedWord ? (
              <div className="space-y-4 animate-in fade-in">
                {/* Word Header */}
                <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                        {selectedWord.word}
                      </h3>
                      <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                        {selectedWord.pos}
                      </span>
                      <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-xs font-black text-emerald-800 dark:text-emerald-300">
                        Band {selectedWord.band}
                      </span>
                    </div>

                    <div className="mt-1 font-mono text-xs text-muted flex items-center gap-2">
                      <span>{selectedWord.ipa}</span>
                      <span>· {selectedWord.topic}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => speakEnglish(selectedWord.word, { accent: 'UK' })}
                      className="inline-flex items-center gap-1 rounded-xl border border-line bg-card hover:bg-slate-50 dark:hover:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      title="Nghe phát âm UK"
                    >
                      <Volume2 size={14} />
                      <span>UK</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => speakEnglish(selectedWord.word, { accent: 'US' })}
                      className="inline-flex items-center gap-1 rounded-xl border border-line bg-card hover:bg-slate-50 dark:hover:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      title="Nghe phát âm US"
                    >
                      <Volume2 size={14} />
                      <span>US</span>
                    </button>
                  </div>
                </div>

                {/* Meaning & Definition */}
                <div className="space-y-1.5">
                  <div className="text-base font-extrabold text-indigo-700 dark:text-indigo-300">
                    {selectedWord.meaningVi}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {selectedWord.definitionEn}
                  </div>
                </div>

                {/* Collocations */}
                {selectedWord.collocations.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                      Collocations hay gặp:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedWord.collocations.map((c, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Examples */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    Ví dụ câu học thuật:
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 italic font-serif">
                    {selectedWord.examples.map((ex, i) => (
                      <li key={i} className="rounded-xl border border-line bg-slate-50/70 dark:bg-slate-800/40 p-2.5">
                        "{ex}"
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Synonyms & Antonyms */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  {selectedWord.synonyms.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-bold text-muted">Từ đồng nghĩa:</span>
                      <div className="text-emerald-700 dark:text-emerald-400 font-medium">
                        {selectedWord.synonyms.join(', ')}
                      </div>
                    </div>
                  )}

                  {selectedWord.antonyms.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-bold text-muted">Từ trái nghĩa:</span>
                      <div className="text-rose-700 dark:text-rose-400 font-medium">
                        {selectedWord.antonyms.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-muted">
                Nhập từ cần tra cứu ở ô tìm kiếm bên trên
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
