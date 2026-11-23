import { Check, X } from 'lucide-react'
import type { Entry, Grade, Item, Status } from '../../types'

export type Filter = 'all' | Status | 'review'
export const FILTERS: { v: Filter; label: string }[] = [
  { v: 'all', label: 'Tất cả thẻ' },
  { v: 'new', label: 'Thẻ mới' },
  { v: 'unknown', label: 'Chưa nhớ' },
  { v: 'known', label: 'Đã thuộc' },
  { v: 'review', label: 'Cần ôn lại' },
]

export const GRADES: { g: Grade; label: string; hint: string; k: string; cls: string; icon?: typeof Check }[] = [
  { g: 'again', label: 'Quên', hint: 'Chưa nhớ: về hộp 1, ôn lại ngay', k: '1', cls: 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900/60', icon: X },
  { g: 'hard', label: 'Khó', hint: 'Nhớ nhưng chật vật: giữ nguyên hộp, ôn lại sớm hơn', k: '2', cls: 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-900/60' },
  { g: 'good', label: 'Được', hint: 'Nhớ đúng: lên 1 hộp', k: '3', cls: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600', icon: Check },
  { g: 'easy', label: 'Dễ', hint: 'Nhớ ngay lập tức: lên 2 hộp', k: '4', cls: 'bg-sky-100 text-sky-800 hover:bg-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:hover:bg-sky-900/60' },
]

/** learn-until-known: a card answered wrong comes back this many cards later */
export const REQUEUE_GAP = 3
export type Slot = { e: Entry; repeat: boolean }

/** Where the learner stopped: the deck order (item keys), the filter and the current card. */
export interface Resume {
  filter: Filter
  shuffled: boolean
  keys: string[]
  cur: string
}
export const resumeStorageKey = (k: string) => `psh.flashcards.resume.${k}`
export const entryKey = (e: Entry) => `${e.collection.id}::${e.item.id}`

export function loadResume(resumeKey: string | undefined, entries: Entry[]): Resume | null {
  if (!resumeKey) return null
  try {
    const r = JSON.parse(localStorage.getItem(resumeStorageKey(resumeKey)) ?? 'null') as Resume | null
    if (!r || !Array.isArray(r.keys) || !r.keys.length) return null
    const known = new Set(entries.map(entryKey))
    return r.keys.every((k) => known.has(k)) && r.keys.includes(r.cur) ? r : null
  } catch {
    return null
  }
}

export function getTextToSpeak(item: Item, back: boolean): string {
  if (back) {
    if (item.type === 'multiple-choice') {
      const ans = [...item.content.answer].map((k) => item.content.options.find((o) => o.key === k)?.text).filter(Boolean).join(', ')
      return `Đáp án: ${ans}. ${item.content.explanation ?? ''}`
    }
    if (item.type === 'true-false') {
      return `Đáp án: ${item.content.answer ? 'Đúng' : 'Sai'}. ${item.content.explanation ?? ''}`
    }
    if (item.type === 'theory' || item.type === 'programming') {
      return `${item.content.definition}. ${item.content.explanation ?? ''}`
    }
    if (item.type === 'vocabulary') {
      return `${item.content.meaning}. ${item.content.example ?? ''}`
    }
  } else {
    if (item.type === 'multiple-choice') return item.content.question
    if (item.type === 'true-false') return item.content.statement
    if (item.type === 'theory' || item.type === 'programming') return item.content.concept
    if (item.type === 'vocabulary') return item.content.term
  }
  return ''
}

export function getHintText(item: Item): string {
  if (item.type === 'multiple-choice') {
    const keys = [...item.content.answer].join(', ')
    const expSnippet = item.content.explanation ? ` · ${item.content.explanation.split('.')[0]}` : ''
    return `Đáp án thuộc nhóm [ ${keys} ]${expSnippet}`
  }
  if (item.type === 'vocabulary') {
    return `Bắt đầu bằng "${item.content.meaning.slice(0, 4)}..." (${item.content.partOfSpeech || 'Từ vựng'})`
  }
  if (item.type === 'true-false') {
    return 'Gợi ý: Đọc kỹ mốc thời gian hoặc từ ngữ khẳng định/phủ định trong mệnh đề.'
  }
  if (item.type === 'theory') {
    return `Khái niệm liên quan đến: "${item.content.definition.slice(0, 30)}..."`
  }
  return 'Hãy nhớ lại các ý chính đã học trong giáo trình.'
}
