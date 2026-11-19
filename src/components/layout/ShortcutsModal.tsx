import { useEffect, useState } from 'react'
import { Command, Keyboard, X } from 'lucide-react'
import { Modal } from '../ui'

interface ShortcutItem {
  keys: string[]
  desc: string
}

interface ShortcutGroup {
  group: string
  items: ShortcutItem[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    group: 'Điều hướng & Toàn hệ thống',
    items: [
      { keys: ['Ctrl', 'K'], desc: 'Mở thanh tìm kiếm toàn cục' },
      { keys: ['?'], desc: 'Bật / Tắt bảng phím tắt này' },
      { keys: ['Esc'], desc: 'Đóng cửa sổ / hộp thoại hiện tại' },
    ],
  },
  {
    group: 'Học Thẻ Ghi Nhớ (Flashcards)',
    items: [
      { keys: ['Space'], desc: 'Lật mặt trước / mặt sau của thẻ' },
      { keys: ['1'], desc: 'Đánh giá: Quên (Hộp 1 - Học lại ngay)' },
      { keys: ['2'], desc: 'Đánh giá: Được (Tăng hộp Leitner)' },
      { keys: ['3'], desc: 'Đánh giá: Dễ (Tăng khoảng cách ôn tập)' },
      { keys: ['A'], desc: 'Tăng cỡ chữ nội dung thẻ' },
      { keys: ['S'], desc: 'Thu nhỏ cỡ chữ nội dung thẻ' },
    ],
  },
  {
    group: 'Làm bài Trắc nghiệm & Thi thử',
    items: [
      { keys: ['1', '2', '3', '4'], desc: 'Chọn tương ứng đáp án A, B, C, D' },
      { keys: ['A', 'B', 'C', 'D'], desc: 'Chọn nhanh đáp án theo chữ cái' },
      { keys: ['Enter'], desc: 'Xác nhận đáp án / Sang câu hỏi tiếp theo' },
      { keys: ['Z'], desc: 'Bật / Tắt chế độ tập trung (Zen / Focus Mode)' },
    ],
  },
]

export default function ShortcutsModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} title="Phím tắt học tập" className="max-w-lg">
      <div className="space-y-6 pt-1">
        {SHORTCUT_GROUPS.map((g) => (
          <div key={g.group} className="space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
              {g.group}
            </div>
            <div className="divide-y divide-line rounded-2xl border border-line bg-card overflow-hidden">
              {g.items.map((it) => (
                <div
                  key={it.desc}
                  className="flex items-center justify-between gap-4 px-4 py-2.5 text-xs sm:text-sm"
                >
                  <span className="font-medium text-ink">{it.desc}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {it.keys.map((k) => (
                      <kbd
                        key={k}
                        className="rounded-lg border border-line bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-ink shadow-2xs"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <p className="text-center text-xs text-muted">
          Mẹo: Nhấn phím <kbd className="font-mono font-bold text-ink bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-line">?</kbd> ở bất kỳ đâu để bật tắt nhanh bảng này.
        </p>
      </div>
    </Modal>
  )
}
