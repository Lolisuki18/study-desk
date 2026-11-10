import type { Entry, Item } from '../../types'
import { normalizeAnswer, pick, shuffle } from '../../utils'
import { sameKeys } from '../../utils/answers'

export type QuizKind = 'mc' | 'tf' | 'fill' | 'match' | 'short'
export const KIND_LABEL: Record<QuizKind, string> = {
  mc: 'Trắc nghiệm',
  tf: 'Đúng / Sai',
  fill: 'Điền chỗ trống',
  match: 'Nối cặp',
  short: 'Trả lời ngắn',
}

interface Base {
  id: string
  collectionId: string
  itemId: string
  explanation?: string
  enrichment?: string
}
export type Question =
  | (Base & { kind: 'mc'; prompt: string; options: { key: string; text: string }[]; answer: string; answerText: string })
  | (Base & { kind: 'tf'; prompt: string; answer: boolean })
  | (Base & { kind: 'fill'; prompt: string; answer: string })
  | (Base & { kind: 'short'; prompt: string; answer: string })
  | (Base & {
      kind: 'match'
      prompt: string
      pairs: { itemId: string; collectionId: string; left: string; right: string }[]
      rights: string[]
    })

export type Answer = string | boolean | Record<number, string> | undefined

/** Pair-like items (term → meaning / concept → definition). */
function pair(item: Item): { term: string; def: string } | null {
  switch (item.type) {
    case 'vocabulary':
      return { term: item.content.term, def: item.content.meaning }
    case 'theory':
    case 'programming':
      return { term: item.content.concept, def: item.content.definition }
    default:
      return null
  }
}

const explanationOf = (item: Item) => ('explanation' in item.content ? item.content.explanation : undefined)

const base = (e: Entry): Base => ({
  id: `${e.collection.id}::${e.item.id}::${Math.random().toString(36).slice(2, 7)}`,
  collectionId: e.collection.id,
  itemId: e.item.id,
  explanation: explanationOf(e.item),
  enrichment: e.item.enrichment?.text,
})

const blankOut = (sentence: string, term: string) => {
  const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  return re.test(sentence) ? sentence.replace(re, '_____') : null
}

/** Which question kinds make sense for this set of entries? */
export function availableKinds(entries: Entry[]): QuizKind[] {
  const kinds = new Set<QuizKind>()
  const pairs = entries.filter((e) => pair(e.item))
  for (const e of entries) {
    const it = e.item
    if (it.type === 'multiple-choice') kinds.add('mc')
    if (it.type === 'true-false') kinds.add('tf')
    if (it.type === 'vocabulary' && it.content.example && blankOut(it.content.example, it.content.term)) kinds.add('fill')
  }
  if (pairs.length >= 4) {
    kinds.add('mc')
    kinds.add('short')
    kinds.add('match')
    kinds.add('tf')
  }
  return (['mc', 'tf', 'fill', 'match', 'short'] as QuizKind[]).filter((k) => kinds.has(k))
}

/** Options such as "Cả B và C đều đúng" depend on their position, so never reorder those questions. */
export function canShuffle(options: { text: string }[]): boolean {
  return !options.some((o) => /đều\s+(đúng|sai)|tất cả (các )?(ý|phương án|đáp án)|(cả|và|hoặc)\s+[A-D](?![\p{L}])/iu.test(o.text))
}

export interface BuildOptions {
  count: number
  kinds: QuizKind[]
  randomize: boolean
  /** shuffle the A-D order of native multiple-choice questions (skipped when an option refers to other options) */
  shuffleOptions?: boolean
  /** extra entries used only to draw distractors from */
  distractorPool?: Entry[]
}

export function buildQuiz(entries: Entry[], opts: BuildOptions): Question[] {
  const chosen = (opts.randomize ? shuffle(entries) : entries).slice(0, opts.count)
  const pool = (opts.distractorPool ?? entries).filter((e) => pair(e.item))
  const questions: Question[] = []
  const kinds = opts.kinds
  const rest: Entry[] = []

  // Matching groups (4 items per question) take priority when selected.
  const matchable = chosen.filter((e) => pair(e.item))
  const used = new Set<Entry>()
  if (kinds.includes('match') && matchable.length >= 4) {
    const groups = kinds.length === 1 ? Math.floor(matchable.length / 4) : 1
    for (let g = 0; g < groups; g++) {
      const group = matchable.slice(g * 4, g * 4 + 4)
      group.forEach((e) => used.add(e))
      const pairs = group.map((e) => ({ itemId: e.item.id, collectionId: e.collection.id, left: pair(e.item)!.term, right: pair(e.item)!.def }))
      questions.push({
        id: `match::${g}::${Math.random().toString(36).slice(2, 7)}`,
        collectionId: group[0].collection.id,
        itemId: group[0].item.id,
        kind: 'match',
        prompt: 'Nối mỗi mục bên trái với phần mô tả đúng',
        pairs,
        rights: shuffle(pairs.map((p) => p.right)),
      })
    }
  }
  for (const e of chosen) if (!used.has(e)) rest.push(e)

  for (const e of rest) {
    const it = e.item
    const opts_: QuizKind[] = []
    if (it.type === 'multiple-choice' && kinds.includes('mc')) opts_.push('mc')
    if (it.type === 'true-false' && kinds.includes('tf')) opts_.push('tf')
    if (it.type === 'vocabulary' && kinds.includes('fill') && it.content.example && blankOut(it.content.example, it.content.term)) opts_.push('fill')
    const pr = pair(it)
    if (pr && pool.length >= 4) {
      if (kinds.includes('mc')) opts_.push('mc')
      if (kinds.includes('short')) opts_.push('short')
      if (kinds.includes('tf')) opts_.push('tf')
    }
    if (!opts_.length) continue
    const kind = opts_[Math.floor(Math.random() * opts_.length)]
    const b = base(e)

    if (it.type === 'multiple-choice') {
      const keysC = [...it.content.answer]
      const correctText = keysC.map((k) => it.content.options.find((o) => o.key === k)!.text).join(' · ')
      let options = it.content.options
      let answer = it.content.answer
      if (opts.shuffleOptions && canShuffle(options)) {
        const mixed = shuffle(options)
        options = mixed.map((o, i) => ({ key: String.fromCharCode(65 + i), text: o.text }))
        answer = keysC.map((k) => options[mixed.findIndex((o) => o.key === k)].key).sort().join('')
      }
      questions.push({ ...b, kind: 'mc', prompt: it.content.question, options, answer, answerText: correctText })
    } else if (it.type === 'true-false') {
      questions.push({ ...b, kind: 'tf', prompt: it.content.statement, answer: it.content.answer })
    } else if (kind === 'fill' && it.type === 'vocabulary') {
      questions.push({ ...b, kind: 'fill', prompt: blankOut(it.content.example!, it.content.term)!, answer: it.content.term })
    } else if (pr) {
      const others = pool.filter((o) => o.item.id !== it.id || o.collection.id !== e.collection.id)
      if (kind === 'mc') {
        const wrong = pick(others, 3)
        const opts2 = shuffle([{ text: pr.def, correct: true }, ...wrong.map((w) => ({ text: pair(w.item)!.def, correct: false }))])
        const options = opts2.map((o, i) => ({ key: String.fromCharCode(65 + i), text: o.text }))
        const ans = options[opts2.findIndex((o) => o.correct)]
        questions.push({ ...b, kind: 'mc', prompt: `${pr.term} — nghĩa / định nghĩa đúng là gì?`, options, answer: ans.key, answerText: ans.text })
      } else if (kind === 'tf') {
        const truth = Math.random() < 0.5
        const shown = truth ? pr.def : pair(pick(others, 1)[0].item)!.def
        questions.push({ ...b, kind: 'tf', prompt: `${pr.term}: ${shown}`, answer: shown === pr.def })
      } else {
        questions.push({ ...b, kind: 'short', prompt: pr.def, answer: pr.term })
      }
    }
  }
  return opts.randomize ? shuffle(questions) : questions
}

export function isCorrect(q: Question, a: Answer): boolean {
  switch (q.kind) {
    case 'mc':
      return typeof a === 'string' && sameKeys(a, q.answer)
    case 'tf':
      return a === q.answer
    case 'fill':
    case 'short':
      return typeof a === 'string' && normalizeAnswer(a) === normalizeAnswer(q.answer)
    case 'match': {
      const m = (a ?? {}) as Record<number, string>
      return q.pairs.every((p, i) => m[i] === p.right)
    }
  }
}

/** Per-item correctness for progress tracking (matching spans several items). */
export function itemResults(q: Question, a: Answer, overrideCorrect?: boolean) {
  if (q.kind === 'match') {
    const m = (a ?? {}) as Record<number, string>
    return q.pairs.map((p, i) => ({ collectionId: p.collectionId, itemId: p.itemId, correct: m[i] === p.right }))
  }
  return [{ collectionId: q.collectionId, itemId: q.itemId, correct: overrideCorrect ?? isCorrect(q, a) }]
}
