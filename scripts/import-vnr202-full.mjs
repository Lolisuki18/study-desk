// Imports docs/source-bank-vnr202.json (the full VNR202 bank, 404 questions; identical to the file served by
// dinh-vien.github.io/fpt-political-quiz) into ONE collection.
//
// Every question is copied verbatim (question, options, answer) in file order: the learner asked for the complete
// 404-question set as its own deck. The file has no explanations. Most questions ALSO exist in the VNR202
// collections already in the app (the "Ngân hàng bổ sung" chapters drop 4 repeats; chapter-1/2 overlap a few
// more); they are kept here on purpose. docs/vnr202-full-doi-chieu.md lists the overlap and where this file's
// answer differs from the app's. Nothing in the existing collections is changed.
//
//   node scripts/import-vnr202-full.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadCleanCorpus, buildCleaner } from './lib/clean-text.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(root, 'docs/source-bank-vnr202.json')
const OUT = resolve(root, 'src/data/collections/history-party/vnr202-full.json')
const REPORT = resolve(root, 'docs/vnr202-full-doi-chieu.md')
const COL_DIR = resolve(root, 'src/data/collections/history-party')
const ID = 'lich-su-dang-vnr202-full'

const SAME_QUESTION = 0.93
const SAME_OPTIONS = 0.8
const REWORDED_QUESTION = 0.8
const REWORDED_OPTIONS = 0.82
const SAME_ANSWER = 0.85

const norm = (s) => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
const fold = (s) => norm(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
const grams = (s) => {
  const t = fold(s).replace(/ /g, '')
  const m = new Map()
  for (let i = 0; i < t.length - 1; i++) m.set(t.slice(i, i + 2), (m.get(t.slice(i, i + 2)) ?? 0) + 1)
  return m
}
const dice = (a, b) => {
  let inter = 0
  let na = 0
  let nb = 0
  for (const [g, c] of a) {
    na += c
    inter += Math.min(c, b.get(g) ?? 0)
  }
  for (const c of b.values()) nb += c
  return na + nb ? (2 * inter) / (na + nb) : 0
}
const sameText = (a, b) => fold(a) === fold(b) || (Math.min(fold(a).length, fold(b).length) >= 4 && dice(grams(a), grams(b)) >= SAME_ANSWER)
const sameAnswers = (a, b) => a.length === b.length && a.every((x) => b.some((y) => sameText(x, y))) && b.every((y) => a.some((x) => sameText(x, y)))

const src = JSON.parse(readFileSync(SRC, 'utf8'))
// questions whose stem was lost/garbled in the source, keyed by position (docs/question-fixes-vnr202.json)
const fixesFile = resolve(root, 'docs/question-fixes-vnr202.json')
const fixes = existsSync(fixesFile) ? JSON.parse(readFileSync(fixesFile, 'utf8')) : {}
// copy / OCR damage (split words, lost tone marks, cut-off endings) is repaired on the way in; the raw file is untouched
const { clean } = buildCleaner(loadCleanCorpus(root), src.questions.flatMap((q) => [q.question, ...Object.values(q.options)]))
const textChanges = []

// every multiple-choice question already in the subject's other collections
const existing = []
for (const f of readdirSync(COL_DIR)) {
  if (!f.endsWith('.json')) continue
  const c = JSON.parse(readFileSync(resolve(COL_DIR, f), 'utf8'))
  if (c.id === ID) continue
  for (const it of c.items) {
    if (it.type !== 'multiple-choice') continue
    existing.push({
      col: c,
      it,
      key: norm(it.content.question),
      qGrams: grams(it.content.question),
      oGrams: grams(it.content.options.map((o) => o.text).sort().join(' ')),
      answers: [...it.content.answer].map((k) => it.content.options.find((o) => o.key === k).text),
    })
  }
}
const byKey = new Map(existing.map((e) => [e.key, e]))

function findExisting(q, texts, answers) {
  const exact = byKey.get(norm(q.question))
  if (exact) return exact
  const g = grams(q.question)
  const og = grams([...texts].sort().join(' '))
  let best = null
  let bestSim = 0
  for (const e of existing) {
    const sim = dice(g, e.qGrams)
    const opts = dice(og, e.oGrams)
    const same = (sim >= SAME_QUESTION && opts >= SAME_OPTIONS) || (sim >= REWORDED_QUESTION && opts >= REWORDED_OPTIONS && sameAnswers(answers, e.answers))
    if (same && sim > bestSim) {
      best = e
      bestSim = sim
    }
  }
  return best
}

const items = []
const conflicts = []
const repeats = []
const fresh = []
let dup = 0
const seen = new Map()

src.questions.forEach((q, i) => {
  const pos = i + 1
  // empty option slots (the source pads with "") are dropped; the letters of the others are kept
  const options = Object.entries(q.options)
    .filter(([, text]) => text && text.trim())
    .map(([key, text]) => ({ key, text }))
  const answerKeys = [...q.answer]
  if (!q.question?.trim() || options.length < 2 || !answerKeys.length || answerKeys.some((k) => !options.some((o) => o.key === k)))
    throw new Error(`Câu ${pos}: dữ liệu không hợp lệ`)
  // the overlap check compares the repaired text (so repairs do not show up as answer conflicts)
  const texts = options.map((o) => clean(o.text.trim()))
  const answers = answerKeys.map((k) => clean(options.find((o) => o.key === k).text.trim()))

  const key = norm(clean(q.question.trim()))
  if (seen.has(key)) {
    const first = seen.get(key)
    repeats.push({ pos, first: first.pos, same: sameAnswers(answers, first.answers) })
  } else {
    seen.set(key, { pos, answers })
    const hit = findExisting({ question: clean(q.question.trim()) }, texts, answers)
    if (hit) {
      dup++
      if (!sameAnswers(answers, hit.answers)) conflicts.push({ pos, q, answers, hit })
    } else fresh.push(pos)
  }

  const cleanQuestion = clean(q.question.trim())
  const cleanOptions = options.map((o) => ({ key: o.key, text: fixes[pos]?.options?.[o.key] ?? clean(o.text.trim()) }))
  const changedText = cleanQuestion !== q.question.trim() || cleanOptions.some((o, n) => o.text !== options[n].text)
  if (changedText) textChanges.push({ pos, before: [q.question.trim(), ...options.map((o) => `${o.key}. ${o.text}`)], after: [cleanQuestion, ...cleanOptions.map((o) => `${o.key}. ${o.text}`)] })

  items.push({
    // position in the source file (the file has no ids of its own)
    id: `q-${String(pos).padStart(3, '0')}`,
    type: 'multiple-choice',
    content: { question: (fixes[pos]?.question ?? cleanQuestion).trim(), options: cleanOptions, answer: answerKeys.sort().join('') },
    source: {
      ref: `VNR202 Full câu ${pos}`,
      ...(fixes[pos]?.question ? { originalQuestion: q.question.trim() } : {}),
      ...(changedText ? { textCleaned: true } : {}),
    },
    ...(fixes[pos]
      ? { enrichment: { text: fixes[pos].note, confidence: fixes[pos].confidence, ...(fixes[pos].reference ? { reference: fixes[pos].reference } : {}) } }
      : {}),
  })
})

const collection = {
  id: ID,
  title: `Lịch sử Đảng – VNR202 Full (${src.questions.length} câu)`,
  subject: 'Lịch sử Đảng',
  contentType: 'multiple-choice',
  // most questions repeat the other VNR202 collections: keep this deck out of subject-wide mock exams and readiness
  standalone: true,
  description: `Toàn bộ ${src.questions.length} câu của ngân hàng VNR202, giữ nguyên thứ tự. Lưu ý: ${dup} câu cũng có trong các bộ Lịch sử Đảng khác của app và ${repeats.length} câu lặp lại ngay trong file. File gốc không có giải thích.`,
  source: {
    document: 'VNR202 - Lịch sử Đảng Cộng sản Việt Nam (dinh-vien.github.io/fpt-political-quiz; docs/source-bank-vnr202.json)',
    note: 'Câu hỏi, phương án và đáp án chép nguyên văn. Số câu là vị trí trong file gốc. Đối chiếu đáp án với các bộ đã có: docs/vnr202-full-doi-chieu.md',
  },
  items,
}
writeFileSync(OUT, JSON.stringify(collection, null, 2) + '\n')

// ---- report -------------------------------------------------------------------------------------
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
const where = (h) => `${h.col.title.replace('Lịch sử Đảng – ', '')}, ${h.it.source?.ref ?? h.it.id}`
const report = [
  '# Đối chiếu VNR202 Full với các bộ Lịch sử Đảng đã có',
  '',
  'Tự sinh bởi `node scripts/import-vnr202-full.mjs`. Không sửa tay: chạy lại script để cập nhật.',
  '',
  `- File gốc: ${src.questions.length} câu (\`docs/source-bank-vnr202.json\`).`,
  `- Bộ "${collection.title}" chứa đủ ${items.length} câu, kể cả câu trùng.`,
  `- Cũng có trong bộ khác của app (giống hệt, hoặc chỉ khác lỗi chính tả / cách diễn đạt): ${dup} câu.`,
  `- Lặp lại trong chính file: ${repeats.length} câu.`,
  `- Không có ở bộ nào khác: ${fresh.length} câu${fresh.length ? ` (câu ${fresh.join(', ')})` : ''}.`,
  '',
  `## ${conflicts.length} câu trùng nhưng đáp án khác với app`,
  '',
  'Các bộ khác trong app được giữ nguyên; bộ VNR202 Full dùng đáp án của file. Chưa kiểm chứng bên nào đúng: hãy đối chiếu giáo trình.',
  '',
  '| Câu trong file | Câu hỏi | Theo file | App hiện có | Vị trí trong app |',
  '|---|---|---|---|---|',
  ...conflicts.map((c) => `| ${c.pos} | ${cell(c.q.question)} | ${cell(c.answers.join(' + '))} | ${cell(c.hit.answers.join(' + '))} | ${cell(where(c.hit))} |`),
  '',
  '## Câu lặp lại trong file',
  '',
  '| Câu | Lặp lại của câu | Đáp án |',
  '|---|---|---|',
  ...repeats.map((r) => `| ${r.pos} | ${r.first} | ${r.same ? 'giống nhau' : '**khác nhau**'} |`),
  '',
]
writeFileSync(REPORT, report.join('\n'))

// every text the cleaner changed, so the repair can be reviewed (the raw source file is not modified)
writeFileSync(
  resolve(root, 'docs/vnr202-text-cleanup.md'),
  [
    '# VNR202: sửa lỗi chép (chữ tách, mất dấu, cụt chữ)',
    '',
    'Tự sinh bởi `node scripts/import-vnr202-full.mjs`. File nguồn `docs/source-bank-vnr202.json` giữ nguyên; bản sửa chỉ nằm trong bộ học.',
    `Số câu được sửa chữ: ${textChanges.length}/${src.questions.length}. Câu có mất đề xem \`docs/question-fixes-vnr202.json\`.`,
    '',
    ...textChanges.flatMap((c) => [`## Câu ${c.pos}`, ...c.before.flatMap((b, n) => (b === c.after[n] ? [] : [`- trước: ${b}`, `- sau:   ${c.after[n]}`])), '']),
  ].join('\n'),
)

console.log(`${src.questions.length} câu trong file → ${items.length} câu trong bộ học`)
console.log(`  trong đó ${dup} câu cũng có ở bộ khác, ${repeats.length} câu lặp trong file, ${fresh.length} câu chỉ có ở đây`)
console.log(`  ${conflicts.length} câu trùng có đáp án khác app → ${REPORT.replace(root, '.')}`)
