// Converts docs/source-cnxhkh-chuong-N.md (N = 2..5) into collections.
// Question, options, answer AND the explanation come verbatim from the source files.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'src/data/collections/cnxhkh')
mkdirSync(outDir, { recursive: true })

// Researched extras live apart from the source (docs/enrichment-cnxhkh.json) and become `enrichment`, never `content`.
let enrichment = {}
try {
  enrichment = JSON.parse(readFileSync(resolve(root, 'docs/enrichment-cnxhkh.json'), 'utf8'))
} catch {
  /* optional */
}

for (const n of [2, 3, 4, 5]) {
  const lines = readFileSync(resolve(root, `docs/source-cnxhkh-chuong-${n}.md`), 'utf8').split(/\r?\n/)
  let title = ''
  const items = []
  let cur = null
  for (const raw of lines) {
    const line = raw.trim()
    const h = line.match(/^##\s+CHƯƠNG\s+(\d+):\s*(.+)$/i)
    if (h) {
      title = h[2].trim()
      continue
    }
    const q = line.match(/^\*\*Câu (\d+):\*\*\s*(.+)$/)
    if (q) {
      cur = { n: Number(q[1]), question: q[2].trim(), options: [] }
      items.push(cur)
      continue
    }
    const o = line.match(/^([A-D])\.\s*(.+)$/)
    if (o && cur) {
      cur.options.push({ key: o[1], text: o[2].trim() })
      continue
    }
    const a = line.match(/^\*\*Đáp án:\s*([A-D])\*\*$/)
    if (a && cur) {
      cur.answer = a[1]
      continue
    }
    const e = line.match(/^\*Giải thích:\*\s*(.+)$/)
    if (e && cur) cur.explanation = e[1].trim()
  }
  if (items.length !== 50) throw new Error(`Chương ${n}: ${items.length} câu`)
  for (const it of items) {
    if (it.options.length !== 4 || !it.answer || !it.explanation) throw new Error(`Chương ${n} câu ${it.n} thiếu dữ liệu`)
  }
  const titleCase = title.charAt(0) + title.slice(1).toLowerCase()
  const col = {
    id: `cnxhkh-chuong-${n}`,
    title: `CNXH Khoa học – Chương ${n}`,
    subject: 'Chủ nghĩa xã hội khoa học',
    contentType: 'multiple-choice',
    description: `${titleCase}. Câu 1–50.`,
    language: 'vi',
    source: { document: `Bộ câu hỏi trắc nghiệm ôn tập Chủ nghĩa xã hội khoa học – Chương ${n}` },
    items: items.map((it) => ({
      id: `q-${String(it.n).padStart(3, '0')}`,
      type: 'multiple-choice',
      content: { question: it.question, options: it.options, answer: it.answer, explanation: it.explanation },
      source: { ref: `Câu ${it.n}` },
      ...(enrichment[`chuong-${n}/q-${String(it.n).padStart(3, '0')}`] ? { enrichment: enrichment[`chuong-${n}/q-${String(it.n).padStart(3, '0')}`] } : {}),
    })),
  }
  writeFileSync(resolve(outDir, `chapter-${n}.json`), JSON.stringify(col, null, 2) + '\n')
  console.log(`chapter-${n}: ${col.items.length} items — ${title}`)
}
