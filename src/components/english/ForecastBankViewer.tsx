import { useState } from 'react'
import {
  Flame,
  Volume2,
  Sparkles,
  ArrowRight,
  Award,
  Layers,
  HelpCircle,
  Lightbulb,
} from 'lucide-react'
import { Card } from '../ui'
import { cx } from '../../utils'
import { speakEnglish } from '../../utils/speech'
import { playSound } from '../../utils/sound'
import { haptic } from '../../utils/haptic'
import {
  FORECAST_TOPICS,
  type ForecastTopic,
} from '../../services/english/forecastBank'

export function ForecastBankViewer() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [activeTopicId, setActiveTopicId] = useState<string>(FORECAST_TOPICS[0]?.id || '')
  const [activeBandView, setActiveBandView] = useState<'band7' | 'band8'>('band8')

  const filteredTopics = FORECAST_TOPICS.filter((t) => {
    if (selectedCategory !== 'All' && t.category !== selectedCategory) return false
    return true
  })

  const activeTopic =
    FORECAST_TOPICS.find((t) => t.id === activeTopicId) || filteredTopics[0] || FORECAST_TOPICS[0]

  return (
    <div className="space-y-6">
      {/* Top Header & Category Filter */}
      <div className="rounded-3xl border-2 border-slate-200 dark:border-line bg-white dark:bg-card p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 px-3 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              <Flame size={13} className="text-rose-600 dark:text-rose-400" />
              <span>BỘ ĐỀ FORECAST THỰC CHIẾN THEO QUÝ (Q1 - Q2 2026)</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Dự đoán đề thi Speaking & Writing bám sát đề thi thật
            </h3>
          </div>

          <div className="text-xs font-bold text-muted">
            Tổng cộng: {filteredTopics.length} chủ đề trọng tâm
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/60">
          {(['All', 'Speaking Part 1', 'Speaking Part 2', 'Writing Task 2'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cx(
                'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer',
                selectedCategory === cat
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'border border-line bg-card text-muted hover:border-rose-300'
              )}
            >
              {cat === 'All' ? 'Tất cả các phần' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dual-View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Forecast Topic List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted">
            Chủ đề trong bộ đề Forecast:
          </div>

          <div className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
            {filteredTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setActiveTopicId(topic.id)}
                className={cx(
                  'w-full text-left rounded-2xl border-2 p-4 transition-all cursor-pointer space-y-2 shadow-2xs',
                  activeTopic?.id === topic.id
                    ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/30'
                    : 'border-line bg-white dark:bg-card hover:border-rose-300'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300">
                    {topic.category}
                  </span>

                  <span
                    className={cx(
                      'rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider',
                      topic.tag === 'HOT' && 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300',
                      topic.tag === 'New' && 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300',
                      topic.tag === 'High Frequency' && 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                    )}
                  >
                    {topic.tag} · {topic.frequencyScore}%
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                  {topic.topicName}
                </h4>

                <p className="text-[11px] text-muted line-clamp-2 italic">
                  "{topic.prompt}"
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Forecast Details, Model Comparison & Collocations */}
        {activeTopic && (
          <div className="lg:col-span-8 space-y-5">
            <div className="rounded-3xl border-2 border-slate-200 dark:border-line bg-white dark:bg-card p-6 sm:p-8 space-y-5 shadow-sm">
              {/* Header */}
              <div className="border-b border-line pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase">
                      {activeTopic.category} · {activeTopic.quarter}
                    </span>
                    <span className="rounded-full bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 text-[10px] font-black text-amber-800 dark:text-amber-300">
                      Tần suất ra thi: {activeTopic.frequencyScore}%
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    {activeTopic.topicName}
                  </h3>
                </div>

                {/* Audio Button */}
                <button
                  type="button"
                  onClick={() =>
                    speakEnglish(activeBandView === 'band8' ? activeTopic.band8Model : activeTopic.band7Model, {
                      accent: 'UK',
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <Volume2 size={15} />
                  <span>Nghe bài mẫu</span>
                </button>
              </div>

              {/* Prompt box */}
              <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 p-4 text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed font-serif space-y-2">
                <div>
                  <b>Đề bài thực chiến:</b> {activeTopic.prompt}
                </div>
                {activeTopic.bulletPoints && (
                  <ul className="space-y-1 text-muted text-[11px] font-sans pl-2">
                    {activeTopic.bulletPoints.map((bp, i) => (
                      <li key={i}>• {bp}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Band Score Model Switcher */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveBandView('band8')}
                      className={cx(
                        'rounded-xl px-3.5 py-1 text-xs font-bold transition-all cursor-pointer',
                        activeBandView === 'band8'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'border border-line bg-card text-muted'
                      )}
                    >
                      Mẫu Band 8.0+ (Ăn điểm Lexical Resource)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveBandView('band7')}
                      className={cx(
                        'rounded-xl px-3.5 py-1 text-xs font-bold transition-all cursor-pointer',
                        activeBandView === 'band7'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'border border-line bg-card text-muted'
                      )}
                    >
                      Mẫu Band 7.0 (Gọn gàng, dễ học)
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-line bg-slate-50/60 dark:bg-slate-800/30 text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-serif italic text-justify">
                  "{activeBandView === 'band8' ? activeTopic.band8Model : activeTopic.band7Model}"
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 font-sans italic border-t border-line/60 pt-2">
                  <b>Dịch nghĩa tiếng Việt:</b> {activeTopic.vietnameseTranslation}
                </div>
              </div>

              {/* Highlighted Collocations */}
              <div className="space-y-2 pt-2 border-t border-line">
                <div className="text-[11px] font-bold text-muted uppercase">
                  Cụm từ Collocations đắt giá dùng cho chủ đề này:
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeTopic.highlightedCollocations.map((colloc, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/40 px-3 py-1.5 text-xs font-semibold text-rose-950 dark:text-rose-200"
                    >
                      <b>{colloc.term}</b>:{' '}
                      <span className="text-[11px] text-rose-700 dark:text-rose-400">
                        {colloc.meaningVi}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Examiner Tips */}
              <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <Lightbulb size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div className="space-y-0.5">
                  <div className="font-bold">Lời khuyên chiến thuật phòng thi:</div>
                  <p className="leading-relaxed">{activeTopic.examinerTips}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
