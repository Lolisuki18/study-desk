/**
 * Smart raw text / AI answer parser.
 * Turns text pasted from ChatGPT, Gemini, Word or a PDF into a Collection.
 *
 * Principle: it never guesses. A question whose correct answer cannot be read from the text is skipped, with a
 * warning that says why, instead of being saved with a made-up answer key.
 *
 * Shape of the work: every line becomes a token (question start, option, answer, explanation, plain text, blank),
 * then a small state machine groups tokens into questions. Markers are only recognised at the start of a line, so a
 * question that merely contains words like "Chọn" or "Lý do" is left alone.
 */

import type { Collection, Item, McOption } from '../../types'

export interface ParseResult {
  collection: Collection
  /** problems worth the learner's attention, one sentence each */
  warnings: string[]
  /** questions / terms that were imported */
  itemCount: number
  /** questions found but left out (no readable answer, broken options...) */
  skipped: number
}

// ---------------------------------------------------------------------------------------------- text helpers

/** lowercase, no diacritics (đ → d) */
const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
const norm = (s: string) => fold(s).replace(/[^a-z0-9]+/g, ' ').trim()

/** URL-safe id part. The id rule (src/utils/validate.ts) allows lowercase letters, digits and hyphens only. */
export function slugify(text: string): string {
  const slug = fold(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '')
  return slug || 'bo-hoc'
}

/** Remove Markdown noise (**bold**, `code`, headings, quotes, list bullets in front of questions and options). */
function clean(line: string): string {
  return line
    .replace(/ /g, ' ')
    .replace(/\*\*|__|`/g, '')
    .replace(/^\s*(?:#{1,6}\s+|>\s+)/, '')
    .replace(/^\s*[-*•–]\s+(?=[([]?[A-Ha-h][)\].:]|\d+[.)]|(?:Câu|Question|Bài)\b)/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ---------------------------------------------------------------------------------------------- line classification

const QSTART = /^(?:(?:Câu(?:\s*hỏi)?|Question|Q|Bài)\s*(\d+)\s*[:.)\-–]?\s*|(\d+)\s*[.)]\s+)(.*)$/i
const OPTION = /^[([]?([A-Ha-h])[)\].:](?:\s+(.*))?$/
const EXPL = /^(?:Giải\s*thích(?:\s*chi\s*tiết)?|Lời\s*giải(?:\s*chi\s*tiết)?|Lý\s*giải|Explanation)\s*[:：.\-–]\s*(.*)$/i
const EXPL_INLINE = /(?:Giải\s*thích|Lời\s*giải|Explanation)\s*[:：]\s*/i
const ANSWER_LINE = /^(?:Đáp\s*án(?:\s*(?:đúng|chính\s*xác|là))?|Đ\/A|Answer|Ans|Key|Correct\s*answer)\s*[:：]\s*(.*)$/i
const ANSWER_NO_COLON = /^Đáp\s*án(?:\s*(?:đúng|chính\s*xác|là))?\s+(?=[([]?[A-Ha-h]\b|đúng\b|sai\b)(.*)$/i
const ANSWER_INLINE = /(?:^|[\s.!?;)])(?:Đáp\s*án(?:\s*(?:đúng|chính\s*xác|là))?|Đ\/A|Answer)\s*[:：]\s*(.+)$/i
const TF_VALUE = /^(đúng|sai|true|false)\b/i
const MARK = /[✅✔✓☑]/

type Tok =
  | { kind: 'blank' }
  | { kind: 'q'; num?: number; text: string }
  | { kind: 'opt'; key: string; text: string }
  | { kind: 'ans'; value: string; expl?: string }
  | { kind: 'exp'; text: string }
  | { kind: 'text'; text: string }

/** "Đáp án: C. Giải thích: …" → the answer part and the explanation that follows on the same line. */
function splitAnswerValue(value: string): { value: string; expl?: string } {
  const m = value.match(EXPL_INLINE)
  if (!m || m.index === undefined) return { value: value.trim() }
  return { value: value.slice(0, m.index).trim(), expl: value.slice(m.index + m[0].length).trim() }
}

/** An answer written inside a question or option line must at least look like one: a key or Đúng/Sai. */
const looksLikeAnswer = (v: string) => /^[([]?[A-Ha-h]\b/.test(v.trim()) || TF_VALUE.test(v.trim())

/** "A. one B. two C. three" on one line → separate options (letters must run A, B, C… in order). */
function splitInlineOptions(first: { key: string; text: string }): { key: string; text: string }[] {
  const out: { key: string; text: string }[] = []
  const re = /\s+[([]?([B-Ha-h])[)\].:]\s+/g
  let expected = first.key.toUpperCase().charCodeAt(0) + 1
  let last = 0
  let curKey = first.key
  const text = first.text
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m[1].toUpperCase().charCodeAt(0) !== expected) continue
    out.push({ key: curKey, text: text.slice(last, m.index).trim() })
    curKey = m[1]
    last = m.index + m[0].length
    expected++
  }
  out.push({ key: curKey, text: text.slice(last).trim() })
  return out
}

function tokenize(rawLines: string[], numberedQuestions: boolean): Tok[] {
  const toks: Tok[] = []

  const push = (line: string) => {
    // 1. explanation
    let m = line.match(EXPL)
    if (m) return toks.push({ kind: 'exp', text: m[1].trim() })

    // 2. answer (whole line)
    m = line.match(ANSWER_LINE) ?? line.match(ANSWER_NO_COLON)
    if (m) {
      const a = splitAnswerValue(m[1])
      return toks.push({ kind: 'ans', value: a.value, expl: a.expl })
    }

    // 3. an answer tacked onto the end of a question or option line: "… năm 1930. Đáp án: Đúng"
    const inline = line.match(ANSWER_INLINE)
    if (inline && inline.index !== undefined && looksLikeAnswer(splitAnswerValue(inline[1]).value)) {
      const head = line.slice(0, inline.index).trim()
      if (head) push(head)
      const a = splitAnswerValue(inline[1])
      return toks.push({ kind: 'ans', value: a.value, expl: a.expl })
    }

    // 4. option (a line may hold several: "A. x B. y C. z")
    m = line.match(OPTION)
    if (m) {
      const opts = splitInlineOptions({ key: m[1], text: (m[2] ?? '').trim() })
      for (const o of opts) toks.push({ kind: 'opt', key: o.key.toUpperCase(), text: o.text })
      return
    }

    // 5. question start
    m = line.match(QSTART)
    if (m && (m[1] !== undefined || numberedQuestions)) {
      return toks.push({ kind: 'q', num: Number(m[1] ?? m[2]), text: (m[3] ?? '').trim() })
    }

    toks.push({ kind: 'text', text: line })
  }

  for (const raw of rawLines) {
    const line = clean(raw)
    if (!line) toks.push({ kind: 'blank' })
    else push(line)
  }
  return toks
}

// ---------------------------------------------------------------------------------------------- answers

/** Read the correct option key(s) from an answer value ("B", "AC", "A, C", "B. Trần Phú", "Trần Phú"…), or null. */
export function resolveAnswerKeys(raw: string, options: McOption[]): string | null {
  const v = raw.replace(/[✅✔✓☑]/g, '').trim().replace(/[.。]+$/, '').trim()
  if (!v) return null
  const keys = new Set(options.map((o) => o.key))

  // letters: only when they stand alone ("Bác Hồ" or "Cách mạng" must not read as B or C)
  // brackets around letters are noise: "(A)(C)" reads as "A C"
  const spaced = v.replace(/[()[\]]/g, ' ').replace(/\s+/g, ' ').trim()
  const m = spaced.match(/^([A-Ha-h](?:\s*(?:,|;|\/|&|và|and)?\s*[A-Ha-h])*)(?=$|[\s.:,;])/)
  if (m) {
    const letters = [...new Set(m[1].replace(/[^A-Ha-h]/g, '').toUpperCase())]
    if (letters.length && letters.every((k) => keys.has(k))) return letters.sort().join('')
  }

  // the answer written out as text, optionally after its letter: "B. Trần Phú"
  const byText = (s: string): string | null => {
    const n = norm(s.replace(/^[([]?[A-Ha-h][)\].:]\s+/, ''))
    if (!n) return null
    const exact = options.filter((o) => norm(o.text) === n)
    if (exact.length === 1) return exact[0].key
    if (n.length >= 6) {
      const loose = options.filter((o) => norm(o.text).includes(n) || n.includes(norm(o.text)))
      if (loose.length === 1 && norm(loose[0].text).length >= 6) return loose[0].key
    }
    return null
  }
  const whole = byText(v)
  if (whole) return whole
  if (v.includes(';')) {
    const parts = v.split(';').map((p) => byText(p.trim()))
    if (parts.length > 1 && parts.every(Boolean)) return [...new Set(parts as string[])].sort().join('')
  }
  return null
}

// ---------------------------------------------------------------------------------------------- grouping

interface Draft {
  num?: number
  stem: string[]
  options: { key: string; text: string; marked: boolean }[]
  ans?: string
  expl: string[]
  inExpl: boolean
  state: 'stem' | 'options' | 'after'
}

const newDraft = (num?: number): Draft => ({ num, stem: [], options: [], expl: [], inExpl: false, state: 'stem' })
const snippet = (s: string) => (s.length > 55 ? s.slice(0, 52) + '…' : s)

export function parseRawText(
  rawText: string,
  options: { title?: string; subject?: string; description?: string } = {},
): ParseResult {
  const text = rawText.replace(/\r\n?/g, '\n').trim()
  if (!text) throw new Error('Văn bản trống. Hãy dán nội dung câu hỏi vào ô nhập.')

  const title = options.title?.trim() || 'Bộ câu hỏi tự nhập'
  const subject = options.subject?.trim() || 'Bộ tự nhập'
  const description = options.description?.trim() || 'Bộ câu hỏi được tạo từ văn bản thô / AI'

  const lines = text.split('\n')
  // "1." / "2)" only start a question when the text has no "Câu N" markers (otherwise they are list items)
  const hasCau = lines.some((l) => /^\s*(?:[-*•]\s*)?(?:\*\*)?(?:Câu|Question|Q|Bài)(?:\s*hỏi)?\s*\d+/i.test(l))
  const toks = tokenize(lines, !hasCau)

  const warnings: string[] = []
  const items: Item[] = []
  let skipped = 0

  const hasStructure = toks.some((t) => t.kind === 'opt' || t.kind === 'ans')
  if (!hasStructure) {
    const vocab = parseVocabulary(lines.map(clean), warnings)
    if (!vocab.length) {
      throw new Error('Không nhận diện được câu hỏi nào từ văn bản. Hãy kiểm tra định dạng (ví dụ: Câu 1: … A. … B. … Đáp án: A).')
    }
    return finish(vocab, warnings, vocab.length, 0)
  }

  const drafts: Draft[] = []
  let cur: Draft | null = null
  let blankBefore = false

  const close = () => {
    if (cur) drafts.push(cur)
    cur = null
  }
  const open = (num?: number) => {
    close()
    cur = newDraft(num)
    return cur
  }

  for (const t of toks) {
    if (t.kind === 'blank') {
      blankBefore = true
      if (cur && (cur as Draft).state === 'after') close()
      continue
    }
    const d = cur as Draft | null
    switch (t.kind) {
      case 'q': {
        // "Câu 1:" followed by the stem on the next line reuses the empty draft
        if (d && !d.stem.length && !d.options.length && d.ans === undefined) {
          d.num = t.num
          if (t.text) d.stem.push(t.text)
        } else open(t.num).stem.push(...(t.text ? [t.text] : []))
        break
      }
      case 'text': {
        if (!d) open().stem.push(t.text)
        else if (d.state === 'stem') d.stem.push(t.text)
        else if (d.state === 'after' && d.inExpl && !blankBefore) d.expl.push(t.text)
        else if (d.state === 'options' && !blankBefore && d.options.length) d.options[d.options.length - 1].text += ' ' + t.text
        else open().stem.push(t.text) // a new, unnumbered question
        break
      }
      case 'opt': {
        let target = d
        if (!target || target.state === 'after') target = open()
        target.state = 'options'
        const marked = MARK.test(t.text)
        target.options.push({ key: t.key, text: t.text.replace(MARK, '').trim(), marked })
        break
      }
      case 'ans': {
        const target = d ?? open()
        target.ans = t.value
        target.inExpl = false
        if (t.expl !== undefined) {
          target.expl = [t.expl]
          target.inExpl = true
        }
        target.state = 'after'
        break
      }
      case 'exp': {
        const target = d ?? open()
        target.expl = [t.text]
        target.inExpl = true
        target.state = 'after'
        break
      }
    }
    blankBefore = false
  }
  close()

  let ordinal = 0
  for (const dr of drafts) {
    const label = dr.num !== undefined ? `Câu ${dr.num}` : `Câu thứ ${drafts.indexOf(dr) + 1}`
    const stem = dr.stem.join(' ').trim()
    const expl = dr.expl.join(' ').trim() || undefined
    const skip = (why: string) => {
      skipped++
      warnings.push(`${label} (${snippet(stem || '…')}): ${why}`)
    }

    if (!stem) {
      skip('không có nội dung câu hỏi, đã bỏ qua.')
      continue
    }

    if (dr.options.length >= 2) {
      const keys = dr.options.map((o) => o.key)
      if (new Set(keys).size !== keys.length) {
        skip('có phương án trùng chữ cái (A, A…), đã bỏ qua.')
        continue
      }
      if (dr.options.some((o) => !o.text)) {
        skip('có phương án trống, đã bỏ qua.')
        continue
      }
      const opts: McOption[] = dr.options.map((o) => ({ key: o.key, text: o.text }))
      let answer: string | null = null
      if (dr.ans !== undefined) answer = resolveAnswerKeys(dr.ans, opts)
      else {
        const marked = dr.options.filter((o) => o.marked)
        if (marked.length) answer = marked.map((o) => o.key).sort().join('')
      }
      if (!answer) {
        skip(dr.ans ? `không đối chiếu được đáp án "${snippet(dr.ans)}" với các phương án, nên không nhập câu này.` : 'chưa có dòng "Đáp án", nên không nhập câu này (app không tự đoán đáp án).')
        continue
      }
      ordinal++
      items.push({
        id: `q-${String(ordinal).padStart(3, '0')}`,
        type: 'multiple-choice',
        source: { ref: label },
        content: { question: stem, options: opts, answer, explanation: expl },
      })
      continue
    }

    if (dr.options.length === 1) {
      skip('chỉ nhận ra 1 phương án (có thể các phương án bị dính vào nhau), đã bỏ qua.')
      continue
    }

    const tf = dr.ans?.match(TF_VALUE)
    if (tf) {
      ordinal++
      items.push({
        id: `q-${String(ordinal).padStart(3, '0')}`,
        type: 'true-false',
        source: { ref: label },
        content: { statement: stem, answer: /^(đúng|true)$/i.test(tf[1]), explanation: expl },
      })
      continue
    }
    skip(dr.ans ? `đáp án "${snippet(dr.ans)}" không phải Đúng/Sai và câu không có phương án, đã bỏ qua.` : 'không có phương án A/B/C/D lẫn đáp án Đúng/Sai, đã bỏ qua.')
  }

  if (!items.length) {
    throw new Error(
      `Không nhập được câu nào.${warnings.length ? ' ' + warnings.slice(0, 3).join(' ') : ' Hãy kiểm tra định dạng (ví dụ: Câu 1: … A. … B. … Đáp án: A).'}`,
    )
  }
  return finish(items, warnings, items.length, skipped)

  function finish(list: Item[], w: string[], count: number, skip: number): ParseResult {
    const mc = list.filter((i) => i.type === 'multiple-choice').length
    const tf = list.filter((i) => i.type === 'true-false').length
    const vocab = list.filter((i) => i.type === 'vocabulary').length
    const contentType = mc === list.length ? 'multiple-choice' : tf === list.length ? 'true-false' : vocab === list.length ? 'vocabulary' : 'mixed'
    const collection: Collection = {
      id: `custom-${slugify(title)}-${Date.now().toString(36).slice(-4)}`,
      title,
      subject,
      contentType,
      description,
      source: { note: 'Tự động tạo từ văn bản thô / AI' },
      items: list,
    }
    return { collection, warnings: w, itemCount: count, skipped: skip }
  }
}

// ---------------------------------------------------------------------------------------------- glossary mode

/** Text with no options and no answers: "Term: meaning", "Word /IPA/ (type): meaning", or multiline blocks. */
function parseVocabulary(lines: string[], warnings: string[]): Item[] {
  const hasBlank = lines.some((l) => !l)
  const blocks: string[][] = []
  if (hasBlank) {
    let acc: string[] = []
    for (const l of lines) {
      if (!l) {
        if (acc.length) blocks.push(acc)
        acc = []
      } else acc.push(l)
    }
    if (acc.length) blocks.push(acc)
  } else {
    for (const l of lines) if (l) blocks.push([l])
  }

  const items: Item[] = []
  blocks.forEach((b, i) => {
    let term = ''
    let meaning = ''
    let pronunciation: string | undefined
    let partOfSpeech: string | undefined
    let example: string | undefined
    let translation: string | undefined
    const collocations: string[] = []
    const synonyms: string[] = []

    const firstLine = b[0]

    // Check if block has key-value pairs
    const isLabeled = b.some((l) => /^(?:Word|Term|Từ|Meaning|Nghĩa|Định nghĩa)\s*[:：]/i.test(l))
    if (isLabeled) {
      for (const line of b) {
        let m = line.match(/^(?:Word|Term|Từ\s*vựng|Thuật\s*ngữ)\s*[:：]\s*(.+)$/i)
        if (m) {
          term = m[1].trim()
          continue
        }
        m = line.match(/^(?:Meaning|Nghĩa|Ý\s*nghĩa|Định\s*nghĩa)\s*[:：]\s*(.+)$/i)
        if (m) {
          meaning = m[1].trim()
          continue
        }
        m = line.match(/^(?:IPA|Pronunciation|Phát\s*âm|Phiên\s*âm)\s*[:：]\s*(.+)$/i)
        if (m) {
          pronunciation = m[1].trim()
          if (!pronunciation.startsWith('/')) pronunciation = `/${pronunciation}/`
          continue
        }
        m = line.match(/^(?:Type|Part\s*of\s*Speech|Từ\s*loại)\s*[:：]\s*(.+)$/i)
        if (m) {
          partOfSpeech = m[1].trim()
          continue
        }
        m = line.match(/^(?:Example|Ví\s*dụ|Ex)\s*[:：]\s*(.+)$/i)
        if (m) {
          example = m[1].trim()
          continue
        }
        m = line.match(/^(?:Translation|Dịch|Bản\s*dịch)\s*[:：]\s*(.+)$/i)
        if (m) {
          translation = m[1].trim()
          continue
        }
        m = line.match(/^(?:Collocations?|Cụm\s*từ)\s*[:：]\s*(.+)$/i)
        if (m) {
          collocations.push(...m[1].split(/[,;·•]/).map((s) => s.trim()).filter(Boolean))
          continue
        }
        m = line.match(/^(?:Synonyms?|Đồng\s*nghĩa|Từ\s*đồng\s*nghĩa)\s*[:：]\s*(.+)$/i)
        if (m) {
          synonyms.push(...m[1].split(/[,;·•]/).map((s) => s.trim()).filter(Boolean))
          continue
        }
      }
    } else {
      // Inline formats
      const tabParts = firstLine.split('\t').map((s) => s.trim()).filter(Boolean)
      if (tabParts.length >= 2) {
        term = tabParts[0]
        if (tabParts.length === 2) {
          meaning = tabParts[1]
        } else if (tabParts.length === 3) {
          if (tabParts[1].startsWith('/') || tabParts[1].startsWith('[')) {
            pronunciation = tabParts[1]
            meaning = tabParts[2]
          } else {
            partOfSpeech = tabParts[1]
            meaning = tabParts[2]
          }
        } else {
          pronunciation = tabParts[1]
          partOfSpeech = tabParts[2]
          meaning = tabParts[3]
        }
      } else {
        const m = firstLine.match(/^(.{1,70}?)\s*(?::|\s[-–—]\s|\t)\s*(.+)$/)
        if (!m || /\?\s*$/.test(m[1])) {
          warnings.push(`Mục ${i + 1} (${snippet(firstLine)}): không có dạng "Thuật ngữ: giải nghĩa", đã bỏ qua.`)
          return
        }

        let rawTerm = m[1].trim()
        meaning = m[2].trim()

        const ipaMatch = rawTerm.match(/[/[]([^/\]]+)[/\]]/)
        if (ipaMatch) {
          pronunciation = `/${ipaMatch[1].trim()}/`
          rawTerm = rawTerm.replace(ipaMatch[0], '').trim()
        }

        const posMatch = rawTerm.match(/\(([^)]+)\)/)
        if (posMatch) {
          partOfSpeech = posMatch[1].trim()
          rawTerm = rawTerm.replace(posMatch[0], '').trim()
        }

        term = rawTerm
      }

      // Remaining lines in block for additional fields
      for (const line of b.slice(1)) {
        let m = line.match(/^(?:Example|Ví\s*dụ|Ex)\s*[:：]\s*(.+)$/i)
        if (m) {
          example = m[1].trim()
          continue
        }
        m = line.match(/^(?:Translation|Dịch|Bản\s*dịch)\s*[:：]\s*(.+)$/i)
        if (m) {
          translation = m[1].trim()
          continue
        }
        m = line.match(/^(?:Collocations?|Cụm\s*từ)\s*[:：]\s*(.+)$/i)
        if (m) {
          collocations.push(...m[1].split(/[,;·•]/).map((s) => s.trim()).filter(Boolean))
          continue
        }
        m = line.match(/^(?:Synonyms?|Đồng\s*nghĩa|Từ\s*đồng\s*nghĩa)\s*[:：]\s*(.+)$/i)
        if (m) {
          synonyms.push(...m[1].split(/[,;·•]/).map((s) => s.trim()).filter(Boolean))
          continue
        }
        if (!example) {
          example = line.trim()
        } else if (!translation) {
          translation = line.trim()
        }
      }
    }

    if (!term || !meaning) {
      warnings.push(`Mục ${i + 1} (${snippet(firstLine)}): thiếu từ hoặc nghĩa, đã bỏ qua.`)
      return
    }

    items.push({
      id: `v-${String(items.length + 1).padStart(3, '0')}`,
      type: 'vocabulary',
      content: {
        term,
        meaning,
        pronunciation: pronunciation || undefined,
        partOfSpeech: partOfSpeech || undefined,
        example: example || undefined,
        translation: translation || undefined,
        collocations: collocations.length ? collocations : undefined,
        synonyms: synonyms.length ? synonyms : undefined,
      },
    })
  })
  return items
}
