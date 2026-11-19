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
// Typos / cut endings checked by hand against their context (raw file untouched). [bank, pattern, replacement]
const TEXT_FIXES = [
  ['hcm202', /kế th$/u, 'kế thừa'],
  ['hcm202', /quan hệ kinh tề$/u, 'quan hệ kinh tế'],
  ['hcm202', /của đai đoàn kết toàn dân tôc$/u, 'của đại đoàn kết toàn dân tộc'],
  ['hcm202', /quốc tế trong sắng$/u, 'quốc tế trong sáng'],
  ['hcm202', /Mục tiêu bên vũng$/u, 'Mục tiêu bền vững'],
  ['mln122', /tư bản lớn hơ$/u, 'tư bản lớn hơn'],
  ['mln122', /giá trị sử dung$/u, 'giá trị sử dụng'],
  ['mln122', /các nguồn luc\?$/u, 'các nguồn lực?'],
  ['mln111', /các nguồn luc\?$/u, 'các nguồn lực?'],
  ['mln111', /được goi là$/u, 'được gọi là'],
  ['mln111', /nguyên nhan khách quan/u, 'nguyên nhân khách quan'],
]

// Lost stems rebuilt by hand (the bank kept only an answer text in the stem field). [bank, position, question, why]
const STEM_FIXES = [
  ['mln111', 329, 'Theo Ph. Ăngghen, vận động của vật chất có mấy hình thức cơ bản?', 'Triết học Mác – Lênin chia vận động của vật chất thành 5 hình thức cơ bản: cơ học, vật lý, hóa học, sinh học, xã hội.'],
]

const LOST_STEM =
  'Đề gốc của ngân hàng này có vẻ bị mất phần câu hỏi: đề chỉ lặp lại nội dung của một phương án (hoặc quá ngắn). Không thể biết chắc câu hỏi nguyên bản, nên đáp án chỉ nên coi là tham khảo.'

for (const b of BANKS) {
  const src = JSON.parse(readFileSync(resolve(root, `docs/source-bank-${b.id}.json`), 'utf8'))
  const clean = (t) => TEXT_FIXES.filter(([bank]) => bank === b.id).reduce((s, [, re, to]) => s.replace(re, to), t)
  const seen = new Map()
  const items = []
  const repeated = []
  const flagged = []
  let textChanged = 0
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
    const stemFix = STEM_FIXES.find(([bank, pos]) => bank === b.id && pos === n)
    const cleanQuestion = clean(q.question.trim())
    const cleanOptions = options.map((o) => ({ key: o.key, text: clean(o.text) }))
    const changedText = cleanQuestion !== q.question.trim() || cleanOptions.some((o, k) => o.text !== options[k].text)
    if (changedText) textChanged++
    items.push({
      id,
      type: 'multiple-choice',
      content: { question: stemFix ? stemFix[2] : cleanQuestion, options: cleanOptions, answer, ...(explanation ? { explanation } : {}) },
      source: { ref: `Ngân hàng câu ${n}`, ...(changedText ? { textCleaned: true } : {}), ...(stemFix ? { originalQuestion: q.question.trim() } : {}) },
      ...(stemFix
        ? { enrichment: { text: `Đề gốc của ngân hàng bị mất (chỉ còn đoạn trùng với một phương án), nên đề này do Claude dựng lại, không phải đề gốc. ${stemFix[3]}`, confidence: 'uncertain' } }
        : lost
          ? { enrichment: { text: LOST_STEM, confidence: 'uncertain' } }
          : {}),
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
      note: 'Nguồn cộng đồng, chưa đối chiếu giáo trình. Câu hỏi, phương án và đáp án chép từ nguồn; chỉ sửa vài lỗi chép đã kiểm tra tay (cụt chữ cuối câu, mất dấu), file nguồn giữ nguyên.',
    },
    items,
  }
  const dir = resolve(root, 'src/data/collections', b.folder)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, `${b.id}-ngan-hang.json`), JSON.stringify(col, null, 2) + '\n')
  console.log(`${b.id}: ${src.questions.length} trong file → ${items.length} câu; lặp ${repeated.length}; đề nghi mất ${flagged.length}; sửa chữ ${textChanged}`)
}
