/**
 * Smart Raw Text / AI Prompt Parser.
 * Converts unstructured text (copy-pasted from ChatGPT, Word, PDF, Web) into valid Collection JSON.
 */

import type { Collection, Item, McOption, MultipleChoiceContent, TrueFalseContent, VocabularyContent } from '../../types'

export interface ParseResult {
  collection: Collection
  warnings: string[]
  itemCount: number
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || `deck-${Date.now().toString(36)}`
}

/**
 * Main parser entry point.
 */
export function parseRawText(
  rawText: string,
  options: {
    title?: string
    subject?: string
    description?: string
  } = {},
): ParseResult {
  const warnings: string[] = []
  const text = rawText.trim()
  if (!text) {
    throw new Error('Văn bản trống. Hãy dán nội dung câu hỏi vào ô nhập.')
  }

  const title = options.title?.trim() || 'Bộ câu hỏi tự nhập'
  const subject = options.subject?.trim() || 'Chung'
  const description = options.description?.trim() || 'Bộ câu hỏi được tạo từ văn bản thô / AI'
  const collectionId = `custom-${slugify(title)}-${Date.now().toString(36).slice(-4)}`

  const items: Item[] = []

  // Split into candidate question blocks.
  // Common dividers: double newlines, or line starting with "Câu \d+[:.]", "Question \d+[:.]", "\d+[\.)]"
  const blocks = splitIntoBlocks(text)

  blocks.forEach((block, index) => {
    try {
      const item = parseSingleBlock(block, index + 1)
      if (item) {
        items.push(item)
      } else {
        warnings.push(`Khối văn bản ${index + 1} không nhận diện được câu hỏi hợp lệ: "${block.slice(0, 50)}..."`)
      }
    } catch (e: any) {
      warnings.push(`Lỗi khi đọc khối ${index + 1}: ${e.message}`)
    }
  })

  if (items.length === 0) {
    throw new Error('Không nhận diện được câu hỏi nào từ văn bản. Hãy kiểm tra lại định dạng câu hỏi (Ví dụ: Câu 1: ... A. ... B. ... Đáp án: A).')
  }

  const mcCount = items.filter((i) => i.type === 'multiple-choice').length
  const tfCount = items.filter((i) => i.type === 'true-false').length
  const vocabCount = items.filter((i) => i.type === 'vocabulary').length

  const contentType =
    mcCount === items.length
      ? 'multiple-choice'
      : tfCount === items.length
      ? 'true-false'
      : vocabCount === items.length
      ? 'vocabulary'
      : 'mixed'

  const collection: Collection = {
    id: collectionId,
    title,
    subject,
    contentType,
    description,
    source: { note: 'Tự động tạo từ văn bản thô / AI' },
    items,
  }

  return {
    collection,
    warnings,
    itemCount: items.length,
  }
}

/**
 * Split raw text into chunks, each representing a single question or term definition.
 */
function splitIntoBlocks(text: string): string[] {
  // Normalize line breaks
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Check if text uses explicit "Câu \d+" or "\d+[\.)]" pattern
  const questionRegex = /(?:^|\n+)(?=(?:(?:Câu|Question|Bài)\s*\d+[\s:.]|\d+[\.)]\s+))/i
  const parts = normalized.split(questionRegex).map((p) => p.trim()).filter(Boolean)

  if (parts.length > 1) {
    return parts
  }

  // Fallback: split by double newlines
  const doubleNewlineParts = normalized.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean)
  if (doubleNewlineParts.length > 1) {
    return doubleNewlineParts
  }

  // Fallback 3: If lines look like vocabulary or flashcards ("Term: Meaning" or "Term - Meaning")
  const singleLines = normalized.split(/\n+/).map((p) => p.trim()).filter(Boolean)
  if (singleLines.length > 1 && singleLines.every((l) => /^[^:\-–—\t]+[:\-–—\t].+$/.test(l))) {
    return singleLines
  }

  // Fallback 4: single block
  return [normalized]
}

/**
 * Parses one block of text into an Item.
 */
function parseSingleBlock(block: string, fallbackIdx: number): Item | null {
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return null

  // 1. Try Multiple-Choice: Has option markers like A., B., C., D.
  const mcItem = tryParseMultipleChoice(lines, fallbackIdx)
  if (mcItem) return mcItem

  // 2. Try True/False: Has keyword "Đúng/Sai" or answer is "Đúng" / "Sai"
  const tfItem = tryParseTrueFalse(lines, fallbackIdx)
  if (tfItem) return tfItem

  // 3. Try Vocabulary / Concept: "Term: Definition" or "Term - Definition"
  const vocabItem = tryParseVocabulary(lines, fallbackIdx)
  if (vocabItem) return vocabItem

  return null
}

function tryParseMultipleChoice(lines: string[], idx: number): Item | null {
  // Match options: A. or A) or a. or [A]
  const optionRegex = /^(?:\[?([A-Ha-h])\]?[\.\)\:\s]\s*|\(([A-Ha-h])\)\s*)(.*)$/
  const answerRegex = /(?:Đáp\s*án(?:\s*(?:đúng|chính\s*xác|là))?|Đ\/A|Key|Answer|Ans|Chọn)[\s:.]*\(?\[?([A-Ha-h]+)\]?\)?/i
  const explanationRegex = /(?:Giải\s*thích|Lời\s*giải|Lý\s*do|Explanation|Note)[\s:.]*(.*)$/i

  let questionLines: string[] = []
  const options: McOption[] = []
  let answerKey = ''
  let explanation = ''

  let inOptions = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check explanation line
    const expMatch = line.match(explanationRegex)
    if (expMatch) {
      explanation = expMatch[1]?.trim() || lines.slice(i + 1).join(' ').trim()
      break
    }

    // Check answer line (e.g. "Đáp án: A" or "Đáp án: A. Giải thích: ...")
    const ansMatch = line.match(answerRegex)
    if (ansMatch) {
      answerKey = ansMatch[1].toUpperCase()
      // Check if explanation is on the same line: "Đáp án: A. Giải thích: ..."
      const subExp = line.match(explanationRegex)
      if (subExp && subExp[1]) {
        explanation = subExp[1].trim()
      }
      continue
    }

    // Check option line
    const optMatch = line.match(optionRegex)
    if (optMatch) {
      inOptions = true
      const key = (optMatch[1] || optMatch[2]).toUpperCase()
      const text = (optMatch[3] || '').trim()
      options.push({ key, text })
      continue
    }

    if (!inOptions) {
      // Question prompt line
      questionLines.push(line)
    } else {
      // Continuation of previous option or trailing line
      if (options.length > 0) {
        options[options.length - 1].text += ' ' + line
      }
    }
  }

  // Need at least 2 options and a question
  if (options.length >= 2 && questionLines.length > 0) {
    let questionText = questionLines.join(' ').replace(/^(?:Câu|Question|Bài)\s*\d+[\s:.]\s*/i, '').replace(/^\d+[\.)]\s*/, '').trim()

    // If answerKey was not explicitly given, default to first option 'A' with a warning or fallback
    if (!answerKey && options.length > 0) {
      answerKey = options[0].key
    }

    const content: MultipleChoiceContent = {
      question: questionText || `Câu hỏi ${idx}`,
      options,
      answer: answerKey,
      explanation: explanation || undefined,
    }

    return {
      id: `q-${idx}`,
      type: 'multiple-choice',
      content,
    }
  }

  return null
}

function tryParseTrueFalse(lines: string[], idx: number): Item | null {
  const fullText = lines.join(' ')
  const answerRegex = /(?:Đáp\s*án(?:\s*(?:đúng|chính\s*xác|là))?|Đ\/A|Key|Answer)[\s:.]*\(?\[?(Đúng|Sai|True|False|T|F)\]?\)?/i
  const match = fullText.match(answerRegex)

  if (match) {
    const valStr = match[1].toLowerCase()
    const answer = valStr === 'đúng' || valStr === 'true' || valStr === 't'
    const statement = lines[0].replace(/^(?:Câu|Question|Bài)\s*\d+[\s:.]\s*/i, '').replace(/^\d+[\.)]\s*/, '').trim()

    const content: TrueFalseContent = {
      statement: statement || `Mệnh đề ${idx}`,
      answer,
    }

    return {
      id: `tf-${idx}`,
      type: 'true-false',
      content,
    }
  }

  return null
}

function tryParseVocabulary(lines: string[], idx: number): Item | null {
  const firstLine = lines[0]
  // Pattern: "Term: Meaning" or "Term - Meaning"
  const splitMatch = firstLine.match(/^([^:\-–—]{2,50})\s*[:\-–—]\s*(.+)$/)
  if (splitMatch) {
    const term = splitMatch[1].trim()
    const meaning = splitMatch[2].trim()

    const content: VocabularyContent = {
      term,
      meaning,
      example: lines.slice(1).join(' ').trim() || undefined,
    }

    return {
      id: `v-${idx}`,
      type: 'vocabulary',
      content,
    }
  }

  return null
}
