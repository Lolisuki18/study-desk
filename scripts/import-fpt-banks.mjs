// Imports the question banks of dinh-vien.github.io/fpt-political-quiz that are NOT yet in the app
// (HCM202, ITE302c, MLN111, MLN122) from docs/source-bank-<id>.json, one collection per subject.
//
// Question / option / answer text is copied verbatim. A true repeat inside a bank is kept once (first one).
// Only a question with the same stem, options AND answer counts as a repeat (the same stem often has different options).
// The id is the position in the bank (b-001 ...), so it stays stable when the file is regenerated.
// Banks whose stem was lost (the question text is just one of its own options, or a couple of characters) get an
// `enrichment` warning flagged "uncertain"; nothing is guessed. The source's own `explanation`, when present, is kept.
//
//   node scripts/import-fpt-banks.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const norm = (s) => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

const BANKS = [
  { id: 'hcm202', folder: 'hcm', subject: 'Tư tưởng Hồ Chí Minh', title: 'Tư tưởng Hồ Chí Minh – HCM202' },
  { id: 'ite302c', folder: 'ite', subject: 'Đạo đức trong CNTT', title: 'Đạo đức trong CNTT – ITE302c' },
  { id: 'mln111', folder: 'mln111', subject: 'Triết học Mác – Lênin', title: 'Triết học Mác – Lênin – MLN111' },
  { id: 'mln122', folder: 'mln122', subject: 'Kinh tế chính trị Mác – Lênin', title: 'Kinh tế chính trị Mác – Lênin – MLN122' },
]
const LOST_STEM =
  'Đề gốc của ngân hàng này có vẻ bị mất phần câu hỏi: đề chỉ lặp lại nội dung của một phương án (hoặc quá ngắn). Không thể biết chắc câu hỏi nguyên bản, nên đáp án chỉ nên coi là tham khảo.'

for (const b of BANKS) {
  const src = JSON.parse(readFileSync(resolve(root, `docs/source-bank-${b.id}.json`), 'utf8'))
  const seen = new Map()
  const items = []
  const repeated = []
  const flagged = []
  src.questions.forEach((q, i) => {
    const n = i + 1
    const id = `b-${String(n).padStart(3, '0')}`
    const key = norm(q.question)
    const options = Object.entries(q.options)
      .map(([k, text]) => ({ key: k, text: String(text).trim() }))
      .filter((o) => o.text)
    const answer = [...String(q.answer)].sort().join('')
    const full = [key, ...options.map((o) => norm(o.text)).sort(), '=>', ...[...answer].map((c) => norm(options.find((o) => o.key === c)?.text ?? '')).sort()].join('|')
    if (seen.has(full)) return repeated.push(`${id}=${seen.get(full)}`)
    seen.set(full, id)
    if (options.length < 2 || !answer || [...answer].some((c) => !options.some((o) => o.key === c))) throw new Error(`${b.id} câu ${n}: dữ liệu không hợp lệ`)
    const lost = key.length <= 3 || options.some((o) => norm(o.text) === key)
    if (lost) flagged.push(id)
    const explanation = q.explanation?.trim()
    items.push({
      id,
      type: 'multiple-choice',
      content: { question: q.question.trim(), options, answer, ...(explanation ? { explanation } : {}) },
      source: { ref: `Ngân hàng câu ${n}` },
      ...(lost ? { enrichment: { text: LOST_STEM, confidence: 'uncertain' } } : {}),
    })
  })
  const col = {
    id: `${b.id}-ngan-hang`,
    title: b.title,
    subject: b.subject,
    description: `Ngân hàng câu hỏi ${b.id.toUpperCase()}: ${items.length} câu trắc nghiệm${src.questions.length > items.length ? ` (đã bỏ ${repeated.length} câu lặp trong file)` : ''}. Một số câu chọn nhiều đáp án.`,
    contentType: 'multiple-choice',
    language: 'vi',
    source: {
      document: `${src.name} – ngân hàng câu hỏi (dinh-vien.github.io/fpt-political-quiz; docs/source-bank-${b.id}.json)`,
      note: 'Nguồn cộng đồng, chưa đối chiếu giáo trình. Câu hỏi, phương án và đáp án chép nguyên văn.',
    },
    items,
  }
  const dir = resolve(root, 'src/data/collections', b.folder)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, `${b.id}-ngan-hang.json`), JSON.stringify(col, null, 2) + '\n')
  console.log(`${b.id}: ${src.questions.length} trong file → ${items.length} câu; lặp ${repeated.length}; đề nghi mất ${flagged.length}`)
}
