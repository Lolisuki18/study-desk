import type { ReactNode } from 'react'
import {
  ArrowLeftRight, Bookmark, BookOpen, Check, ChevronLeft, ChevronRight, Clock, Flame, Headphones, HelpCircle, LayoutGrid, List,
  Maximize2, Minimize2, Palette, PartyPopper, PauseCircle, PenLine, PlayCircle, Repeat, RotateCcw, Shuffle, Star, Type, Volume1,
  Volume2, VolumeX, X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Entry, Grade, ProgressRecord } from '../../types'
import { Button, Card, ProgressBar } from '../ui'
import { cx } from '../../utils'
import { toggleZen, useZen } from '../../utils/zen'
import { speakEnglish } from '../../utils/speech'
import { isLeech } from '../../services/review/srs'
import type { CardTheme } from './ContinuousFeedView'
import { FILTERS, GRADES, type Filter } from './sessionHelpers'

export function SessionToolbar({
  mode, filter, onFilter, shuffled, onShuffle, inverted, onInvert, learn, onToggleLearn, autoPlay, onToggleAutoPlay,
  isVocab, autoPronounce, onToggleAutoPronounce, spellingMode, onToggleSpellingMode, viewMode, onToggleViewMode,
  onThemeSettings, onSpeak, reading, onCardGrid, fontZoom, onCycleFontZoom, onCram, sound, onToggleSound, onHelp, position,
}: {
  mode: 'study' | 'review'
  filter: Filter
  onFilter: (f: Filter) => void
  shuffled: boolean
  onShuffle: () => void
  inverted: boolean
  onInvert: () => void
  learn: boolean
  onToggleLearn: () => void
  autoPlay: boolean
  onToggleAutoPlay: () => void
  isVocab: boolean
  autoPronounce: boolean
  onToggleAutoPronounce: () => void
  spellingMode: boolean
  onToggleSpellingMode: () => void
  viewMode: 'flip' | 'feed'
  onToggleViewMode: () => void
  onThemeSettings: () => void
  onSpeak: () => void
  reading: boolean
  onCardGrid: () => void
  fontZoom: string
  onCycleFontZoom: () => void
  onCram: () => void
  sound: boolean
  onToggleSound: () => void
  onHelp: () => void
  position: string
}) {
  const zenMode = useZen()
const pill = (active: boolean) =>
  cx(
    'inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer select-none sm:min-h-0',
    active ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700',
  )

  return (
  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-card px-3 py-2 shadow-xs">
    <div className="flex flex-wrap items-center gap-1.5">
      {mode === 'study' && (
        <>
          <select
            value={filter}
          onChange={(e) => onFilter(e.target.value as Filter)}
            className="rounded-xl bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-ink outline-none hover:bg-slate-100 cursor-pointer"
            aria-label="Lọc theo trạng thái"
          >
            {FILTERS.map((f) => (
              <option key={f.v} value={f.v}>
                {f.label}
              </option>
            ))}
          </select>
          <button
            className={pill(shuffled)}
            onClick={onShuffle}
          >
            <Shuffle size={13} /> <span className="hidden sm:inline">Trộn thẻ</span>
          </button>
          <button className={pill(inverted)} onClick={onInvert} title="Đảo mặt trước / sau (phím F)">
            <ArrowLeftRight size={13} /> <span className="hidden sm:inline">Đảo mặt</span>
          </button>
        </>
      )}
      <button
        className={pill(learn)}
        onClick={onToggleLearn}
        title="Lặp lại thẻ sai đến khi nhớ mới hoàn thành phiên"
      >
        <Repeat size={13} /> <span className="hidden sm:inline">Học đến khi thuộc</span>
      </button>

      <button
        className={pill(autoPlay)}
        onClick={onToggleAutoPlay}
        title="Tự động lật và chuyển câu sau 4 giây"
      >
        {autoPlay ? <PauseCircle size={13} className="text-amber-400 animate-pulse" /> : <PlayCircle size={13} />}
        <span className="hidden sm:inline">{autoPlay ? 'Dừng phát' : 'Tự động phát'}</span>
      </button>

      {isVocab && (
        <>
          <button
            className={pill(autoPronounce)}
            onClick={onToggleAutoPronounce}
            title="Tự động phát âm tiếng Anh khi chuyển sang thẻ mới"
          >
            <Headphones size={13} />
            <span className="hidden sm:inline">Tự phát âm</span>
          </button>
          <button
            className={pill(spellingMode)}
            onClick={onToggleSpellingMode}
            title="Luyện gõ từ vựng / Chép chính tả (Dictation)"
          >
            <PenLine size={13} />
            <span className="hidden sm:inline">Chính tả</span>
          </button>
        </>
      )}

      <button
        className={cx(
          'inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer select-none sm:min-h-0',
          viewMode === 'feed'
            ? 'bg-indigo-600 text-white shadow-2xs'
            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
        )}
        onClick={onToggleViewMode}
        title="Chuyển sang chế độ cuộn danh sách liên tục (Continuous Feed View)"
      >
        <List size={13} />
        <span className="hidden sm:inline">Cuộn liên tục</span>
      </button>
    </div>

    <div className="flex items-center gap-1.5">
      {/* Nút tùy chỉnh Nền thẻ & Kiểu chữ */}
      <button
        onClick={onThemeSettings}
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink cursor-pointer"
        title="Giao diện nền thẻ & kiểu chữ (Theme & Typography)"
      >
        <Palette size={16} />
      </button>

      {/* Nút đọc Text-to-Speech */}
      <button
        onClick={onSpeak}
        className={cx(
          'inline-flex h-8 w-8 items-center justify-center rounded-xl transition-colors cursor-pointer',
          reading ? 'bg-indigo-600 text-white animate-pulse' : 'text-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink'
        )}
        title={reading ? 'Dừng đọc (đang phát giọng nói)' : 'Đọc to nội dung thẻ (Text-to-Speech)'}
      >
        <Volume1 size={16} />
      </button>

      {/* Nút xem danh sách lưới tất cả thẻ */}
      <button
        onClick={onCardGrid}
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink cursor-pointer"
        title="Xem bảng danh sách thẻ trong phiên"
      >
        <LayoutGrid size={16} />
      </button>
      {/* Nút chỉnh cỡ chữ zoom */}
      <button
        onClick={onCycleFontZoom}
        className="inline-flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-bold text-muted transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink cursor-pointer"
        title={`Đổi cỡ chữ hiển thị (${fontZoom})`}
      >
        <Type size={14} />
        <span className="uppercase text-[10px]">{fontZoom}</span>
      </button>

      {/* Nút lướt nhanh Cram Mode */}
      <button
        onClick={onCram}
        className="inline-flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-900/40 cursor-pointer"
        title="Chế độ lướt nhanh siêu tốc (Cram Mode)"
      >
        <BookOpen size={14} />
        <span className="hidden sm:inline text-[11px]">Lướt nhanh</span>
      </button>

      {/* Nút Focus Zen Mode */}
      <button
        onClick={toggleZen}
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink cursor-pointer"
        title={zenMode ? 'Thoát tập trung' : 'Chế độ tập trung (Zen Mode)'}
      >
        {zenMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
      </button>

      {/* Nút bật tắt âm thanh */}
      <button
        onClick={onToggleSound}
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink cursor-pointer"
        title={sound ? 'Tắt âm thanh' : 'Bật âm thanh'}
      >
        {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </button>

      {/* Nút trợ giúp phím tắt */}
      <button
        onClick={onHelp}
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink cursor-pointer"
        title="Phím tắt (?)"
      >
        <HelpCircle size={16} />
      </button>

      {/* Bộ đếm vị trí thẻ */}
      <span className="rounded-xl bg-slate-900 dark:bg-slate-100 px-3 py-1.5 font-mono text-xs font-bold text-white dark:text-slate-900 shadow-2xs">
        {position}
      </span>
    </div>
  </div>
  )
}

export function SessionDone({ toolbar, total, repeats, onRestart }: { toolbar: ReactNode; total: number; repeats: number; onRestart: () => void }) {
  return (
    <div className="mx-auto w-full max-w-2xl py-4">
      {toolbar}
      <Card className="p-8 sm:p-12 text-center animate-in zoom-in-95 duration-200">
        <PartyPopper size={56} className="mx-auto animate-bounce text-amber-500" />
        <h2 className="mt-4 text-2xl font-extrabold text-ink">Hoàn thành xuất sắc!</h2>
        <p className="mt-2 text-sm text-muted max-w-md mx-auto leading-relaxed">
          Bạn đã hoàn thành toàn bộ {total} thẻ trong phiên học
          {repeats > 0 ? `, trong đó có ${repeats} lượt ôn lặp lại để ghi nhớ chắc chắn.` : ', không trả lời sai thẻ nào.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button
            onClick={onRestart}
            className="py-2.5 px-5"
          >
            <RotateCcw size={15} /> Học lại bộ thẻ này
          </Button>
          <Link to="/">
            <Button variant="primary" className="py-2.5 px-6">
              Về Tổng quan
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

export function SessionHud({ known, again, streak, idx, total }: { known: number; again: number; streak: number; idx: number; total: number }) {
  return (
    <>
    {/* Live Session HUD */}
    <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/80 dark:border-line bg-card/80 px-3.5 py-2 backdrop-blur-md shadow-2xs text-xs font-semibold">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400" title="Số thẻ đã đánh giá thuộc trong phiên này">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          <span>{known} Thuộc</span>
        </div>
        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400" title="Số thẻ cần ôn lại trong phiên này">
          <span className="flex h-2 w-2 rounded-full bg-rose-500" />
          <span>{again} Cần ôn</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted" title="Số thẻ còn lại trong cọc">
          <span className="flex h-2 w-2 rounded-full bg-slate-400" />
          <span>{Math.max(0, total - idx)} Còn lại</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {streak > 1 && (
          <div className="flex items-center gap-1 text-amber-500 font-bold animate-in fade-in">
            <Flame size={14} className="fill-amber-500" />
            <span>Chuỗi {streak}</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-muted font-mono text-[11px]" title="Ước tính thời gian học còn lại">
          <Clock size={12} />
          <span>~{Math.max(1, Math.ceil((total - idx) * 0.15))} phút</span>
        </div>
      </div>
    </div>

    {/* Thanh tiến độ */}
    <div className="mb-2 px-1">
      <ProgressBar value={((idx + 1) / total) * 100} className="h-2" />
    </div>
    </>
  )
}

export function CardMeta({ cur, isRepeat, p, starred, onToggleStar, onToggleBookmark }: { cur: Entry; isRepeat: boolean; p: ProgressRecord | undefined; starred: boolean; onToggleStar: () => void; onToggleBookmark: () => void }) {
  const statusLabel = p?.status === 'known' ? 'Đã thuộc' : p?.status === 'unknown' ? 'Chưa nhớ' : 'Mới'
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-1 text-xs text-muted">
      <span className="min-w-0 basis-full truncate font-bold text-ink sm:flex-1 sm:basis-auto sm:pr-2">{cur.collection.title}</span>
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        {isRepeat && <span className="rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-2.5 py-0.5 font-bold text-rose-600 dark:text-rose-400">Ôn lại</span>}
        {isLeech(p) && (
          <span
            className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
            title={`Bạn đã sai thẻ này ${p!.incorrect} lần. Thử đặt một mẹo nhớ riêng bằng nút Thêm ghi chú.`}
          >
            Ngoan cố ({p!.incorrect} lần sai)
          </span>
        )}
        {p && p.level > 0 && (
          <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 px-2.5 py-0.5 font-bold text-indigo-700 dark:text-indigo-300">
            Hộp {p.level}/5
          </span>
        )}
        <span
          className={cx(
            'rounded-full px-2.5 py-0.5 font-bold border',
            p?.status === 'known' && 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300',
            p?.status === 'unknown' && 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300',
            p?.status !== 'known' && p?.status !== 'unknown' && 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300',
          )}
        >
          {statusLabel}
        </span>
        <button
          onClick={onToggleStar}
          className={cx(
            'inline-flex h-9 items-center justify-center gap-1 rounded-full px-3 font-bold transition-colors cursor-pointer border sm:h-auto sm:px-2.5 sm:py-0.5',
            starred
              ? 'bg-amber-500 border-amber-600 text-white'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 hover:bg-amber-100',
          )}
          title="Đánh dấu sao câu hỏi trọng tâm (Ôn tủ)"
        >
          <Star size={13} className={cx(starred && 'fill-white')} />
          <span className="hidden sm:inline">{starred ? 'Đã gắn sao' : 'Gắn sao'}</span>
        </button>
        <button
          onClick={onToggleBookmark}
          className={cx(
            'inline-flex h-9 items-center justify-center gap-1 rounded-full px-3 font-bold transition-colors cursor-pointer border sm:h-auto sm:px-2.5 sm:py-0.5',
            p?.review
              ? 'bg-rose-500 border-rose-600 text-white'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-100',
          )}
          title="Đánh dấu cần ôn lại (phím R)"
        >
          <Bookmark size={13} className={cx(p?.review && 'fill-white')} /> <span className="hidden sm:inline">{p?.review ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
        </button>
      </div>
    </div>
  )
}

export function StackLayers({ remaining, cardTheme }: { remaining: number; cardTheme: CardTheme }) {
  return (
    <>
    {/* Layer 3 (farthest behind) */}
    {remaining > 3 && (
      <div
        className={cx(
          'absolute inset-x-6 -top-4 h-full rounded-3xl border opacity-30 shadow-xs pointer-events-none transition-all duration-300 transform scale-[0.96]',
          cardTheme === 'paper'
            ? 'bg-[#ede5d5] dark:bg-[#151413] border-[#ded3be] dark:border-[#242220]'
            : cardTheme === 'midnight'
            ? 'bg-[#02050b] border-slate-900'
            : 'bg-slate-200/60 dark:bg-slate-800/40 border-slate-300/40 dark:border-slate-700/40'
        )}
      />
    )}

    {/* Layer 2 (middle behind) */}
    {remaining > 2 && (
      <div
        className={cx(
          'absolute inset-x-4 -top-2.5 h-full rounded-3xl border opacity-55 shadow-xs pointer-events-none transition-all duration-300 transform scale-[0.98]',
          cardTheme === 'paper'
            ? 'bg-[#f4edd0] dark:bg-[#181715] border-[#e2d7c4] dark:border-[#2a2825]'
            : cardTheme === 'midnight'
            ? 'bg-[#050914] border-slate-800'
            : 'bg-slate-100/80 dark:bg-slate-800/60 border-slate-300/60 dark:border-slate-700/60'
        )}
      />
    )}

    {/* Layer 1 (immediately behind) */}
    {remaining > 1 && (
      <div
        className={cx(
          'absolute inset-x-2 -top-1 h-full rounded-3xl border opacity-80 shadow-sm pointer-events-none transition-all duration-300',
          cardTheme === 'paper'
            ? 'bg-[#f9f4ea] dark:bg-[#1a1917] border-[#e7dece] dark:border-[#2e2c28]'
            : cardTheme === 'midnight'
            ? 'bg-[#080d1a] border-slate-800'
            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
        )}
      />
    )}
    </>
  )
}

export function DragStamps({ dragOffset }: { dragOffset: { x: number; y: number } }) {
  return (
    <>
    {/* Dynamic Drag Stamp Indicators */}
    {dragOffset.x > 45 && (
      <div
        style={{ opacity: Math.min(1, (dragOffset.x - 45) / 55) }}
        className="absolute top-5 left-5 z-40 rounded-2xl border-4 border-emerald-500 bg-emerald-500/25 px-4 py-1.5 text-lg font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 shadow-lg -rotate-12 pointer-events-none"
      >
        ĐÃ THUỘC ✓
      </div>
    )}
    {dragOffset.x < -45 && (
      <div
        style={{ opacity: Math.min(1, (-dragOffset.x - 45) / 55) }}
        className="absolute top-5 right-5 z-40 rounded-2xl border-4 border-rose-500 bg-rose-500/25 px-4 py-1.5 text-lg font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 shadow-lg rotate-12 pointer-events-none"
      >
        CẦN ÔN ✗
      </div>
    )}
    {dragOffset.y < -45 && Math.abs(dragOffset.x) < 45 && (
      <div
        style={{ opacity: Math.min(1, (-dragOffset.y - 45) / 45) }}
        className="absolute top-5 inset-x-0 mx-auto w-fit z-40 rounded-2xl border-4 border-sky-500 bg-sky-500/25 px-4 py-1.5 text-lg font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 shadow-lg pointer-events-none"
      >
        RẤT DỄ
      </div>
    )}
    </>
  )
}

export function SpellingTray({ term, value, status, onChange, onCheck }: { term: string; value: string; status: 'idle' | 'correct' | 'incorrect'; onChange: (v: string) => void; onCheck: () => void }) {
  return (
    <div
      className="mt-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/80 bg-white dark:bg-card p-3.5 sm:p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          <PenLine size={14} />
          <span>Luyện gõ từ vựng (Dictation)</span>
        </span>
        <button
          type="button"
          onClick={() => speakEnglish(term, { accent: 'US' })}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-muted hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <Volume2 size={13} />
          <span>Nghe phát âm</span>
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onCheck()
            }
          }}
          placeholder="Gõ từ tiếng Anh bạn nghe được hoặc muốn trả lời…"
          className={cx(
            'flex-1 rounded-xl border px-3.5 py-2 text-sm font-semibold outline-none transition-colors shadow-2xs',
            status === 'correct' && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100',
            status === 'incorrect' && 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100',
            status === 'idle' && 'border-line bg-slate-50 dark:bg-slate-800/60 focus:border-indigo-500'
          )}
        />
        <button
          type="button"
          onClick={onCheck}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
        >
          Kiểm tra
        </button>
      </div>

      {status === 'correct' && (
        <p className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
          <Check size={14} strokeWidth={3} /> Chính xác! Đang mở mặt sau thẻ…
        </p>
      )}
      {status === 'incorrect' && (
        <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-in fade-in">
          <X size={14} strokeWidth={2.5} /> Chưa đúng chính tả. Hãy thử lại hoặc lật thẻ để xem từ chuẩn!
        </p>
      )}
    </div>
  )
}

export function ActionDock({ idx, total, go, grade }: { idx: number; total: number; go: (d: number) => void; grade: (g: Grade) => void }) {
  return (
    <div className="sticky bottom-[calc(var(--bottom-nav-h)+0.5rem)] z-20 mt-3.5 flex items-center gap-2 rounded-2xl border border-line bg-card p-2 shadow-lg md:static md:bottom-auto md:shadow-xs">
      <button
        onClick={() => go(-1)}
        disabled={idx === 0}
        aria-label="Thẻ trước"
        className="inline-flex h-12 items-center justify-center gap-1 rounded-xl bg-slate-50 dark:bg-slate-800 px-3 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 sm:px-4 cursor-pointer"
      >
        <ChevronLeft size={18} /> <span className="hidden sm:inline">Trước</span>
      </button>

      {/* 4 mức tự tin */}
      <div className="grid flex-1 grid-cols-4 gap-1.5 sm:gap-2">
        {GRADES.map(({ g, label, hint, k, cls, icon: Icon }) => (
          <button
            key={g}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              grade(g)
            }}
            title={`${hint} (phím ${k})`}
            className={cx(
              'inline-flex h-12 items-center justify-center gap-1 rounded-xl px-1 text-sm font-bold transition active:scale-95 sm:gap-1.5 cursor-pointer shadow-2xs select-none',
              cls,
            )}
          >
            {Icon && <Icon size={16} strokeWidth={2.75} className="hidden sm:block" />}
            <span>{label}</span>
            <kbd className="hidden rounded bg-white/40 dark:bg-slate-900/40 px-1.5 font-mono text-[10px] md:inline">{k}</kbd>
          </button>
        ))}
      </div>

      <button
        onClick={() => go(1)}
        disabled={idx >= total - 1}
        aria-label="Thẻ sau"
        className="inline-flex h-12 items-center justify-center gap-1 rounded-xl bg-slate-50 dark:bg-slate-800 px-3 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 sm:px-4 cursor-pointer"
      >
        <span className="hidden sm:inline">Sau</span> <ChevronRight size={18} />
      </button>
    </div>
  )
}

export function HotkeysBar() {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-muted">
      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono font-bold text-ink">
        Space
      </span>
      <span>Lật mặt</span>
      <span className="text-slate-300 dark:text-slate-700">·</span>

      <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.5 font-mono font-bold text-rose-700 dark:text-rose-300">
        1 Quên
      </span>
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 font-mono font-bold text-amber-800 dark:text-amber-300">
        2 Khó
      </span>
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 font-mono font-bold text-emerald-800 dark:text-emerald-300">
        3 Được
      </span>
      <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 dark:bg-sky-950/60 px-1.5 py-0.5 font-mono font-bold text-sky-800 dark:text-sky-300">
        4 Dễ
      </span>
      <span className="text-slate-300 dark:text-slate-700">·</span>

      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono font-bold text-ink">
        ← →
      </span>
      <span>Trước/Sau</span>
      <span className="text-slate-300 dark:text-slate-700">·</span>

      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono font-bold text-ink">
        S
      </span>
      <span>Đọc to</span>
    </div>
  )
}
