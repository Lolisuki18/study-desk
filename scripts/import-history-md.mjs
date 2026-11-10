// One-off importer: converts docs/source-lich-su-dang-chuong-1-2.md into two collection JSON files.
// Original question / option text is copied verbatim (trimmed only). No explanations are invented.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const srcPath = resolve(root, 'docs/source-lich-su-dang-chuong-1-2.md')
const outDir = resolve(root, 'src/data/collections/history-party')
const docName = 'Bộ câu hỏi trắc nghiệm ôn tập Lịch sử Đảng (Chương 1 & 2)'

const lines = readFileSync(srcPath, 'utf8').split(/\r?\n/)

// --- questions
const questions = new Map()
let cur = null
for (const raw of lines) {
  const line = raw.trim()
  const q = line.match(/^\*\*Câu (\d+):\*\*\s*(.+)$/)
  if (q) {
    cur = { n: Number(q[1]), question: q[2].trim(), options: [] }
    questions.set(cur.n, cur)
    continue
  }
  const o = line.match(/^([A-D])\.\s*(.+)$/)
  if (o && cur) cur.options.push({ key: o[1], text: o[2].trim() })
}

// --- answer table
const answers = new Map()
for (const line of lines) {
  if (!line.startsWith('|')) continue
  const cells = line.split('|').map((c) => c.trim()).filter(Boolean)
  for (let i = 0; i + 1 < cells.length; i += 2) {
    if (/^\d+$/.test(cells[i]) && /^[A-D]$/.test(cells[i + 1])) answers.set(Number(cells[i]), cells[i + 1])
  }
}

if (questions.size !== 100) throw new Error(`Expected 100 questions, got ${questions.size}`)
for (const [n, q] of questions) {
  if (q.options.length !== 4) throw new Error(`Câu ${n}: ${q.options.length} options`)
  if (!answers.has(n)) throw new Error(`Câu ${n}: missing answer`)
}

const build = (id, title, description, from, to) => ({
  id,
  title,
  subject: 'Lịch sử Đảng',
  contentType: 'multiple-choice',
  description,
  language: 'vi',
  source: { document: docName, note: 'Tài liệu tham khảo: Giáo trình & Tóm tắt VNR202' },
  items: [...questions.values()]
    .filter((q) => q.n >= from && q.n <= to)
    .map((q) => ({
      id: `q-${String(q.n).padStart(3, '0')}`,
      type: 'multiple-choice',
      content: { question: q.question, options: q.options, answer: answers.get(q.n) },
      source: { ref: `Câu ${q.n}` },
    })),
})

// Researched explanations live apart from the source (docs/enrichment-lich-su-dang.json)
// and are attached as `enrichment`, never mixed into `content`.
let enrichment = {}
try {
  enrichment = JSON.parse(readFileSync(resolve(root, 'docs/enrichment-lich-su-dang.json'), 'utf8'))
} catch {
  /* optional */
}

mkdirSync(outDir, { recursive: true })
const c1 = build(
  'lich-su-dang-chuong-1',
  'Lịch sử Đảng – Chương 1',
  'Đảng Cộng sản Việt Nam ra đời và lãnh đạo đấu tranh giành chính quyền (1930 – 1945). Câu 1–50.',
  1,
  50,
)
const c2 = build(
  'lich-su-dang-chuong-2',
  'Lịch sử Đảng – Chương 2',
  'Đảng lãnh đạo hai cuộc kháng chiến (1945 – 1975). Câu 51–100.',
  51,
  100,
)
for (const c of [c1, c2]) for (const it of c.items) if (enrichment[it.id]) it.enrichment = enrichment[it.id]
writeFileSync(resolve(outDir, 'chapter-1.json'), JSON.stringify(c1, null, 2) + '\n')
writeFileSync(resolve(outDir, 'chapter-2.json'), JSON.stringify(c2, null, 2) + '\n')
console.log(`chapter-1: ${c1.items.length} items, chapter-2: ${c2.items.length} items`)
