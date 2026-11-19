// Imports the extra question banks (MLN131, VNR202) from docs/source-bank-*.json into collections.
// Question / option / answer text is copied verbatim. Questions already present in other collections
// (or repeated inside the bank) are skipped. Textbook cross-check notes live in docs/enrichment-bank-*.json
// and are attached as `enrichment` (never mixed into `content`).
//
//   node scripts/import-quiz-bank.mjs
import { readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadCleanCorpus, buildCleaner, MLN_TYPOS } from './lib/clean-text.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const colDir = resolve(root, 'src/data/collections')
const norm = (s) => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

const BANKS = [
  {
    id: 'mln131',
    out: 'cnxhkh/bank-mln131.json',
    // split by textbook chapter (docs/chapter-map-bank-mln131.json)
    chapters: {
      1: 'Chương 1 – Nhập môn chủ nghĩa xã hội khoa học',
      2: 'Chương 2 – Sứ mệnh lịch sử của giai cấp công nhân',
      3: 'Chương 3 – Chủ nghĩa xã hội và thời kỳ quá độ lên CNXH',
      4: 'Chương 4 – Dân chủ XHCN và Nhà nước XHCN',
      5: 'Chương 5 – Cơ cấu xã hội – giai cấp và liên minh giai cấp, tầng lớp',
      6: 'Chương 6 – Vấn đề dân tộc và tôn giáo',
      7: 'Chương 7 – Vấn đề gia đình',
    },
    collection: {
      id: 'cnxhkh-ngan-hang-bo-sung',
      title: 'CNXH Khoa học – Ngân hàng bổ sung (MLN131)',
      subject: 'Chủ nghĩa xã hội khoa học',
      description: 'Ngân hàng câu hỏi MLN131 bổ sung (toàn bộ các chương), đã loại câu trùng với các bộ Chương 2–5. Một số câu chọn nhiều đáp án.',
    },
  },
  {
    id: 'vnr202',
    out: 'history-party/bank-vnr202.json',
    // split by textbook chapter (docs/chapter-map-bank-vnr202.json)
    chapters: {
      1: 'Chương 1 – Đảng ra đời và lãnh đạo giành chính quyền (1930–1945)',
      2: 'Chương 2 – Hai cuộc kháng chiến (1945–1975)',
      3: 'Chương 3 – Quá độ lên CNXH và đổi mới (1975–nay)',
    },
    collection: {
      id: 'lich-su-dang-ngan-hang-bo-sung',
      title: 'Lịch sử Đảng – Ngân hàng bổ sung (VNR202)',
      subject: 'Lịch sử Đảng',
      description: 'Ngân hàng câu hỏi VNR202 bổ sung, đã loại câu trùng với các bộ Chương 1–2.',
    },
  },
]

/**
 * Identity of a multiple-choice question: stem + options + answer text. The bank often reuses one stem for several
 * different questions (only the options differ), so the stem alone must not be used to detect duplicates.
 */
const fullKey = (question, options, answer) =>
  [norm(question), ...options.map((o) => norm(o.text)).sort(), '=>', ...[...answer].map((c) => norm(options.find((o) => o.key === c)?.text ?? '')).sort()].join('|')

// questions already in other (non-bank) collections
const existing = new Map()
for (const dir of readdirSync(colDir)) {
  for (const f of readdirSync(resolve(colDir, dir))) {
    if (!f.endsWith('.json') || f.startsWith('bank-')) continue
    const c = JSON.parse(readFileSync(resolve(colDir, dir, f), 'utf8'))
    // "Full" decks deliberately repeat the banks (standalone): they must not make the banks look like duplicates
    if (c.standalone) continue
    for (const it of c.items) {
      if (!it.content?.question) continue
      // multiple-choice: same stem AND same options AND same answer; other types: same stem
      const k = it.type === 'multiple-choice' ? fullKey(it.content.question, it.content.options, it.content.answer) : norm(it.content.question)
      // scoped by subject: the same question in another subject's deck is not a duplicate of this one
      existing.set(`${c.subject}::${k}`, `${c.id}/${it.id}`)
    }
  }
}

for (const b of BANKS) {
  const src = JSON.parse(readFileSync(resolve(root, `docs/source-bank-${b.id}.json`), 'utf8'))
  const enrichFile = resolve(root, `docs/enrichment-bank-${b.id}.json`)
  const enrichment = existsSync(enrichFile) ? JSON.parse(readFileSync(enrichFile, 'utf8')) : {}
  const overrideFile = resolve(root, `docs/answer-overrides-bank-${b.id}.json`)
  const overrides = existsSync(overrideFile) ? JSON.parse(readFileSync(overrideFile, 'utf8')) : {}
  // docs/question-fixes-*.json: questions whose stem was lost/garbled in the bank, keyed by position in the bank
  const fixesFile = resolve(root, `docs/question-fixes-${b.id}.json`)
  const fixes = existsSync(fixesFile) ? JSON.parse(readFileSync(fixesFile, 'utf8')) : {}
  // repair copy/OCR damage (split words, lost tone marks, cut-off endings); see scripts/lib/clean-text.mjs.
  // Duplicate detection below keeps using the raw text so the set of imported questions does not change.
  const { clean } = buildCleaner(loadCleanCorpus(root), src.questions.flatMap((q) => [q.question, ...Object.values(q.options)]), b.id === 'mln131' ? MLN_TYPOS : {})
  const seen = new Map()
  const items = []
  const skipped = { existing: [], repeated: [], emptyOptions: [] }
  src.questions.forEach((q, i) => {
    const n = i + 1
    const id = `b-${String(n).padStart(3, '0')}`
    // empty option text = option not present in the bank (e.g. a blank "D"): drop it
    const options = Object.entries(q.options)
      .map(([k, text]) => ({ key: k, text: String(text).trim() }))
      .filter((o) => o.text)
    const key = fullKey(q.question, options, String(q.answer))
    if (existing.has(key)) return skipped.existing.push(`${id} = ${existing.get(key)}`)
    if (seen.has(key)) return skipped.repeated.push(`${id} = ${seen.get(key)}`)
    seen.set(key, id)
    if (options.length < Object.keys(q.options).length) skipped.emptyOptions.push(id)
    const fix0 = fixes[n]
    const bankAnswer = [...String(q.answer)].sort().join('')
    // answers deliberately changed to follow the textbook (docs/answer-overrides-bank-*.json); the bank's own answer is kept in source
    const answer = fix0?.answer ?? (overrides[id] ? overrides[id].answer : bankAnswer)
    const fix = fixes[n]
    const cleanQuestion = clean(q.question.trim())
    const cleanOptions = options.map((o) => ({ key: o.key, text: fix?.options?.[o.key] ?? clean(o.text) }))
    const changedText = cleanQuestion !== q.question.trim() || cleanOptions.some((o, k) => o.text !== options[k].text)
    const item = {
      id,
      type: 'multiple-choice',
      content: { question: (fix?.question ?? cleanQuestion).trim(), options: cleanOptions, answer, ...(q.explanation ? { explanation: q.explanation } : {}) },
      source: {
        ref: `Ngân hàng câu ${n}`,
        ...(overrides[id] ? { bankAnswer, answerChangedToTextbook: true } : {}),
        ...(fix?.answer ? { bankAnswer, answerReplaced: true } : {}),
        ...(fix?.question ? { originalQuestion: q.question.trim() } : {}),
        ...(changedText ? { textCleaned: true } : {}),
      },
    }
    if (enrichment[id]) item.enrichment = enrichment[id]
    if (fix) {
      // keep any textbook note; the warning about the damaged stem is added to it
      const e = item.enrichment
      const reference = [e?.reference, fix.reference].filter(Boolean).join('; ')
      item.enrichment = {
        text: e ? `${e.text}\n\n⚠ ${fix.note}` : fix.note,
        confidence: e && !fix.question ? e.confidence : fix.confidence,
        ...(reference ? { reference } : {}),
      }
    }
    items.push(item)
  })
  const base = {
    contentType: 'multiple-choice',
    language: 'vi',
    source: {
      document: `${src.name} – ngân hàng câu hỏi (dinh-vien.github.io/fpt-political-quiz)`,
      note: 'Nguồn cộng đồng, đã đối chiếu tự động với giáo trình; xem docs/doi-chieu-giao-trinh.md',
    },
  }
  if (b.chapters) {
    const map = JSON.parse(readFileSync(resolve(root, `docs/chapter-map-bank-${b.id}.json`), 'utf8')).map
    rmSync(resolve(colDir, b.out), { force: true }) // old single-file version
    for (const [n, name] of Object.entries(b.chapters)) {
      const list = items.filter((it) => String(map[it.id]) === n)
      const col = {
        ...b.collection,
        ...base,
        id: `${b.collection.id.replace('bo-sung', '')}chuong-${n}`,
        title: `${b.collection.title.split(' – ')[0]} – Ngân hàng bổ sung – Chương ${n}`,
        description: `Ngân hàng ${b.id.toUpperCase()} bổ sung, ${name}. ${list.length} câu.`,
        items: list,
      }
      writeFileSync(resolve(colDir, b.out.replace('.json', `-chuong-${n}.json`)), JSON.stringify(col, null, 2) + '\n')
      console.log(`  ${col.id}: ${list.length} items`)
    }
  } else {
    writeFileSync(resolve(colDir, b.out), JSON.stringify({ ...b.collection, ...base, items }, null, 2) + '\n')
  }
  console.log(`${b.id}: ${src.questions.length} in bank → ${items.length} imported; skipped duplicates of existing: ${skipped.existing.length}, repeated in bank: ${skipped.repeated.length}`)
  if (skipped.existing.length) console.log('  existing:', skipped.existing.join(', '))
  if (skipped.repeated.length) console.log('  repeated:', skipped.repeated.join(', '))
  if (skipped.emptyOptions.length) console.log('  blank options dropped in:', skipped.emptyOptions.join(', '))
}
