// Imports docs/source-mln131-full.json ("MLN131_Full", 360 questions) into one collection.
//
// Every question is copied verbatim (question, options, answer), in file order: the learner asked for the
// complete 360-question set as its own deck. The file has no explanations.
//
// That file is largely the same question bank as the MLN131 collections already in the app, retyped
// (different typos, sometimes different option order), so most of its questions ALSO exist in another
// "Chủ nghĩa xã hội khoa học" collection, and a few are repeated inside the file itself. They are kept here
// on purpose. docs/mln131-full-doi-chieu.md lists which questions overlap (typo-tolerant match, thresholds
// below) and where this file's answer differs from the app's. Nothing in the existing collections is changed.
//
//   node scripts/import-mln131-full.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadCleanCorpus, buildCleaner, MLN_TYPOS } from './lib/clean-text.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(root, 'docs/source-mln131-full.json')
const OUT = resolve(root, 'src/data/collections/cnxhkh/mln131-full.json')
const REPORT = resolve(root, 'docs/mln131-full-doi-chieu.md')
const COL_DIR = resolve(root, 'src/data/collections/cnxhkh')
const ID = 'cnxhkh-mln131-full'

/** A question counts as "the same" when its text is at least this similar and its options match too. */
const SAME_QUESTION = 0.93
const SAME_OPTIONS = 0.8
/** Looser match for a reworded question; only accepted when the answer is the same as well. */
const REWORDED_QUESTION = 0.8
const REWORDED_OPTIONS = 0.82
/** Two answer texts are the same answer when they are at least this similar (typos aside). */
const SAME_ANSWER = 0.85

const norm = (s) => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
// without diacritics: the two sources mostly differ by mistyped tone marks
const fold = (s) => norm(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
const grams = (s) => {
  const t = fold(s).replace(/ /g, '')
  const m = new Map()
  for (let i = 0; i < t.length - 1; i++) m.set(t.slice(i, i + 2), (m.get(t.slice(i, i + 2)) ?? 0) + 1)
  return m
}
/** Dice coefficient on character bigrams, 0..1 */
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
// answers are compared without a leading title, so "Hồ Chí Minh" = "Chủ tịch Hồ Chí Minh"
const bare = (s) => fold(s).replace(/^chu tich /, '')
const sameText = (a, b) => bare(a) === bare(b) || (Math.min(bare(a).length, bare(b).length) >= 4 && dice(grams(bare(a)), grams(bare(b))) >= SAME_ANSWER)
/** same set of answers, compared by text (option letters / order differ between the sources) */
const sameAnswers = (a, b) => a.length === b.length && a.every((x) => b.some((y) => sameText(x, y))) && b.every((y) => a.some((x) => sameText(x, y)))

const src = JSON.parse(readFileSync(SRC, 'utf8'))
const fixesFile = resolve(root, 'docs/question-fixes-mln131-full.json')
const fixes = existsSync(fixesFile) ? JSON.parse(readFileSync(fixesFile, 'utf8')) : {}
const textChanges = []
const { clean } = buildCleaner(loadCleanCorpus(root), src.questions.flatMap((q) => [q.question, ...q.options]), MLN_TYPOS)
const overridesFile = resolve(root, 'docs/answer-overrides-bank-mln131.json')
const overrides = existsSync(overridesFile) ? JSON.parse(readFileSync(overridesFile, 'utf8')) : {}

// every question already in the subject's other collections
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

function findExisting(q, answers) {
  const exact = byKey.get(norm(q.question))
  if (exact) return { hit: exact, sim: 1 }
  const g = grams(q.question)
  const og = grams([...q.options].sort().join(' '))
  let best = null
  for (const e of existing) {
    const sim = dice(g, e.qGrams)
    const opts = dice(og, e.oGrams)
    // 1) near-identical wording with matching options, or
    // 2) the same question reworded (e.g. "... là gì?" vs "... là:", or a "(Chọn 2 đáp án)" suffix): looser on the
    //    wording, but then the answer must be the same too, so a negated twin ("đã từng" / "chưa từng") stays separate
    const same =
      (sim >= SAME_QUESTION && opts >= SAME_OPTIONS) || (sim >= REWORDED_QUESTION && opts >= REWORDED_OPTIONS && sameAnswers(answers, e.answers))
    if (same && (!best || sim > best.sim)) best = { hit: e, sim }
  }
  return best
}

const items = []
const conflicts = []
const repeats = []
let dup = 0
const fresh = [] // positions of questions found in no other collection
const seen = new Map() // normalized question → position of its first occurrence in the file

src.questions.forEach((q, i) => {
  const pos = i + 1
  const answerIdx = [].concat(q.answer)
  if (!q.question?.trim() || !Array.isArray(q.options) || q.options.length < 2 || !answerIdx.length || answerIdx.some((a) => !Number.isInteger(a) || a < 0 || a >= q.options.length))
    throw new Error(`Câu ${pos}: dữ liệu không hợp lệ`)
  const answers = answerIdx.map((a) => q.options[a])

  // the whole file goes in; the checks below only feed the comparison report
  const key = norm(q.question)
  if (seen.has(key)) {
    const first = src.questions[seen.get(key) - 1]
    repeats.push({ pos, first: seen.get(key), same: sameAnswers(answers, [].concat(first.answer).map((a) => first.options[a])) })
  } else {
    seen.set(key, pos)
    const found = findExisting(q, answers)
    if (found) {
      dup++
      if (!sameAnswers(answers, found.hit.answers)) conflicts.push({ pos, q, answers, hit: found.hit })
    } else fresh.push(pos)
  }

  // copy damage is repaired on the way in (raw file untouched); docs/question-fixes-mln131-full.json holds the few
  // answer / option corrections, each with its reason
  const fix = fixes[pos]
  const cleanQuestion = clean(q.question.trim())
  let opts = q.options.map((text) => clean(text.trim()))
  let ansIdx = fix?.answerIndex ?? answerIdx
  const removed = fix?.removeOptionIndexes ?? []
  if (removed.length) {
    if (ansIdx.some((a) => removed.includes(a))) throw new Error(`Câu ${pos}: không thể bỏ phương án là đáp án`)
    opts = opts.filter((_, n) => !removed.includes(n))
    ansIdx = ansIdx.map((a) => a - removed.filter((r) => r < a).length)
  }
  const letters = (idx) => idx.map((a) => String.fromCharCode(65 + a)).sort().join('')
  const changedText = cleanQuestion !== q.question.trim() || q.options.some((t, n) => clean(t.trim()) !== t.trim())
  if (changedText) textChanges.push({ pos, before: [q.question.trim(), ...q.options.map((t, n) => `${String.fromCharCode(65 + n)}. ${t.trim()}`)], after: [cleanQuestion, ...q.options.map((t, n) => `${String.fromCharCode(65 + n)}. ${clean(t.trim())}`)] })

  items.push({
    // position in the source file: the file's own "id" field has repeats (3, 303) and gaps, so it cannot be used
    id: `q-${String(pos).padStart(3, '0')}`,
    type: 'multiple-choice',
    content: {
      question: cleanQuestion,
      options: opts.map((text, n) => ({ key: String.fromCharCode(65 + n), text })),
      answer: letters(ansIdx),
    },
    source: {
      ref: `MLN131 Full câu ${pos}`,
      ...(fix?.answerIndex ? { sourceAnswer: letters(answerIdx), answerChanged: true } : {}),
      ...(removed.length ? { removedOptions: removed.map((r) => `${String.fromCharCode(65 + r)}. ${q.options[r]}`) } : {}),
      ...(changedText ? { textCleaned: true } : {}),
    },
    ...(fix ? { enrichment: { text: fix.note, confidence: fix.confidence, ...(fix.reference ? { reference: fix.reference } : {}) } } : {}),
  })
})

const collection = {
  id: ID,
  title: 'CNXH Khoa học – MLN131 Full (360 câu)',
  subject: 'Chủ nghĩa xã hội khoa học',
  contentType: 'multiple-choice',
  // most questions repeat the chapter collections: keep this deck out of subject-wide mock exams and readiness
  standalone: true,
  description: `Toàn bộ ${src.questions.length} câu của file MLN131_Full, giữ nguyên thứ tự. Lưu ý: ${dup} câu cũng có trong các bộ MLN131 khác của app và ${repeats.length} câu lặp lại ngay trong file. Một số câu chọn nhiều đáp án. File gốc không có giải thích.`,
  source: {
    document: 'MLN131_Full.json (docs/source-mln131-full.json)',
    note: 'Câu hỏi, phương án và đáp án chép nguyên văn. Số câu là vị trí trong file gốc. Đối chiếu đáp án với các bộ đã có: docs/mln131-full-doi-chieu.md',
  },
  items,
}
writeFileSync(OUT, JSON.stringify(collection, null, 2) + '\n')

// ---- report -------------------------------------------------------------------------------------
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
const where = (h) => `${h.col.title.replace('CNXH Khoa học – ', '')}, ${h.it.source?.ref ?? h.it.id}`
const report = [
  '# Đối chiếu MLN131_Full với các bộ MLN131 đã có',
  '',
  'Tự sinh bởi `node scripts/import-mln131-full.mjs`. Không sửa tay: chạy lại script để cập nhật.',
  '',
  `- File gốc: ${src.questions.length} câu (\`docs/source-mln131-full.json\`).`,
  `- Bộ "${collection.title}" chứa đủ ${items.length} câu, kể cả câu trùng.`,
  `- Cũng có trong bộ khác của app (giống hệt, hoặc chỉ khác lỗi chính tả / cách diễn đạt): ${dup} câu.`,
  `- Lặp lại trong chính file: ${repeats.length} câu.`,
  `- Không có ở bộ nào khác: ${fresh.length} câu (câu ${fresh.join(', ')}).`,
  '',
  `## ${conflicts.length} câu trùng nhưng đáp án khác với app`,
  '',
  'Các bộ khác trong app được giữ nguyên; bộ MLN131 Full dùng đáp án của file. Cột "File mới" là đáp án theo MLN131_Full. Chưa kiểm chứng bên nào đúng: hãy đối chiếu giáo trình.',
  'Dấu (*) = đáp án trong app là đáp án đã được đổi theo giáo trình trước đây (`docs/answer-overrides-bank-mln131.json`).',
  '',
  '| Câu trong file | Câu hỏi | File mới | App hiện có | Vị trí trong app |',
  '|---|---|---|---|---|',
  ...conflicts.map((c) => `| ${c.pos} | ${cell(c.q.question)} | ${cell(c.answers.join(' + '))} | ${cell(c.hit.answers.join(' + '))}${overrides[c.hit.it.id] ? ' (*)' : ''} | ${cell(where(c.hit))} |`),
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
  resolve(root, 'docs/mln131-full-text-cleanup.md'),
  [
    '# MLN131 Full: sửa lỗi chép / gõ',
    '',
    'Tự sinh bởi `node scripts/import-mln131-full.mjs`. File nguồn `docs/source-mln131-full.json` giữ nguyên; bản sửa chỉ nằm trong bộ học.',
    `Số câu được sửa chữ: ${textChanges.length}/${src.questions.length}. Sửa đáp án / phương án: \`docs/question-fixes-mln131-full.json\`.`,
    '',
    ...textChanges.flatMap((c) => [`## Câu ${c.pos}`, ...c.before.flatMap((b, n) => (b === c.after[n] ? [] : [`- trước: ${b}`, `- sau:   ${c.after[n]}`])), '']),
  ].join('\n'),
)

console.log(`${src.questions.length} câu trong file → ${items.length} câu trong bộ học`)
console.log(`  trong đó ${dup} câu cũng có ở bộ khác, ${repeats.length} câu lặp trong file, ${fresh.length} câu chỉ có ở đây`)
console.log(`  ${conflicts.length} câu trùng có đáp án khác app → ${REPORT.replace(root, '.')}`)
