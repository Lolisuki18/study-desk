import { Sparkles, X } from 'lucide-react'
import type { ProgressRecord } from '../../types'
import { Button, Modal } from '../ui'
import { itemTitle } from '../../data'
import { cx } from '../../utils'
import type { CardTheme, CardFont } from './ContinuousFeedView'
import type { Slot } from './sessionHelpers'

/** Jump-to-card grid: the session's cards coloured by how well they are known. */
export function CardGridModal({
  open,
  onClose,
  order,
  idx,
  get,
  onPick,
}: {
  open: boolean
  onClose: () => void
  order: Slot[]
  idx: number
  get: (collectionId: string, itemId: string) => ProgressRecord | undefined
  onPick: (i: number) => void
}) {
  return (
  <Modal open={open} onClose={onClose} title="Danh sách thẻ trong phiên">
    <div className="max-h-[60vh] overflow-y-auto space-y-3 pt-1">
      <p className="text-xs text-muted">
        Nhấn vào số thẻ để nhảy nhanh tới câu đó. Màu xanh: Đã thuộc, Đỏ: Chưa nhớ / Hộp 1, Xám: Mới.
      </p>
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 pt-1">
        {order.map((slot, i) => {
          const it = slot.e.item
          const p = get(slot.e.collection.id, it.id)
          const isCur = i === idx
          return (
            <button
              key={`${slot.e.collection.id}::${it.id}::${i}`}
              onClick={() => onPick(i)}
              title={itemTitle(it)}
              className={cx(
                'flex flex-col items-center justify-center h-12 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer',
                isCur && 'ring-2 ring-indigo-500 scale-105 z-10 font-black shadow-md',
                p?.status === 'known'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : p?.status === 'unknown'
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-line text-muted'
              )}
            >
              <span>{i + 1}</span>
              {p?.level ? <span className="text-[9px] font-normal opacity-70">H{p.level}</span> : null}
            </button>
          )
        })}
      </div>
    </div>
  </Modal>
  )
}

const SHORTCUTS: { label: string; keys: string; cls: string }[] = [
  { label: 'Lật thẻ trước / sau', keys: 'Space / Enter', cls: '' },
  { label: 'Đánh giá 1: Quên (về Hộp 1)', keys: '1 hoặc U', cls: 'rose' },
  { label: 'Đánh giá 2: Khó (ôn sớm)', keys: '2 hoặc H', cls: 'amber' },
  { label: 'Đánh giá 3: Được (lên 1 hộp)', keys: '3 hoặc K', cls: 'emerald' },
  { label: 'Đánh giá 4: Dễ (lên 2 hộp)', keys: '4 hoặc E', cls: 'sky' },
  { label: 'Chọn đáp án trắc nghiệm ở mặt trước', keys: 'A, B, C, D (hoặc 1-4)', cls: '' },
  { label: 'Đọc to câu hỏi (Text-to-Speech)', keys: 'S', cls: '' },
  { label: 'Đánh dấu sao / Cần ôn lại', keys: 'R', cls: '' },
  { label: 'Đảo mặt trước / sau', keys: 'F', cls: '' },
]

// full class names so Tailwind can see them
const KBD_CLS: Record<string, string> = {
  '': 'border-line bg-card text-ink',
  rose: 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300',
  amber: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
  emerald: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
  sky: 'border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300',
}

export function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-line bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-ink">Phím tắt nhanh</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-2 text-sm">
          {SHORTCUTS.map((s) => (
            <div key={s.label} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5">
              <span className="font-medium text-ink">{s.label}</span>
              <kbd className={cx('rounded-md border px-2 py-1 font-mono text-xs font-bold shadow-2xs', KBD_CLS[s.cls])}>{s.keys}</kbd>
            </div>
          ))}
        </div>
        <Button variant="primary" className="mt-5 w-full py-2.5" onClick={onClose}>
          Đã hiểu
        </Button>
      </div>
    </div>
  )
}

/** Card background theme + typography picker. */
export function ThemeModal({
  open,
  onClose,
  cardTheme,
  cardFont,
  changeTheme,
  changeFont,
}: {
  open: boolean
  onClose: () => void
  cardTheme: CardTheme
  cardFont: CardFont
  changeTheme: (t: CardTheme) => void
  changeFont: (f: CardFont) => void
}) {
  return (
  <Modal open={open} onClose={onClose} title="Giao diện nền thẻ & Kiểu chữ">
    <div className="space-y-4 pt-1">
      {/* Card Themes */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">
          Màu nền thẻ học (Theme)
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => changeTheme('default')}
            className={cx(
              'flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 text-xs font-bold transition-all cursor-pointer',
              cardTheme === 'default'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                : 'border-slate-200 dark:border-line bg-card text-muted hover:text-ink'
            )}
          >
            <div className="h-6 w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
            <span>Trắng sáng</span>
          </button>

          <button
            type="button"
            onClick={() => changeTheme('paper')}
            className={cx(
              'flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 text-xs font-bold transition-all cursor-pointer',
              cardTheme === 'paper'
                ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                : 'border-slate-200 dark:border-line bg-card text-muted hover:text-ink'
            )}
          >
            <div className="h-6 w-full rounded-lg bg-[#faf6ed] dark:bg-[#1a1917] border border-[#e8dfcf] dark:border-[#2e2c28]" />
            <span>Giấy kem ấm</span>
          </button>

          <button
            type="button"
            onClick={() => changeTheme('midnight')}
            className={cx(
              'flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 text-xs font-bold transition-all cursor-pointer',
              cardTheme === 'midnight'
                ? 'border-indigo-500 bg-slate-900 text-white'
                : 'border-slate-200 dark:border-line bg-card text-muted hover:text-ink'
            )}
          >
            <div className="h-6 w-full rounded-lg bg-[#030712] border border-slate-800" />
            <span>Tối OLED</span>
          </button>
        </div>
      </div>

      {/* Typography */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">
          Kiểu chữ hiển thị (Typography)
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => changeFont('sans')}
            className={cx(
              'rounded-xl border-2 p-2.5 text-xs font-sans font-bold transition-all cursor-pointer text-center',
              cardFont === 'sans'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                : 'border-slate-200 dark:border-line bg-card text-muted hover:text-ink'
            )}
          >
            Sans-serif
            <span className="block text-[10px] font-normal opacity-70">Hiện đại</span>
          </button>

          <button
            type="button"
            onClick={() => changeFont('serif')}
            className={cx(
              'rounded-xl border-2 p-2.5 text-xs font-serif font-bold transition-all cursor-pointer text-center',
              cardFont === 'serif'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                : 'border-slate-200 dark:border-line bg-card text-muted hover:text-ink'
            )}
          >
            Serif
            <span className="block text-[10px] font-normal opacity-70">Sách giáo khoa</span>
          </button>

          <button
            type="button"
            onClick={() => changeFont('mono')}
            className={cx(
              'rounded-xl border-2 p-2.5 text-xs font-mono font-bold transition-all cursor-pointer text-center',
              cardFont === 'mono'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                : 'border-slate-200 dark:border-line bg-card text-muted hover:text-ink'
            )}
          >
            Monospace
            <span className="block text-[10px] font-normal opacity-70">Kỹ thuật</span>
          </button>
        </div>
      </div>
    </div>
  </Modal>
  )
}
