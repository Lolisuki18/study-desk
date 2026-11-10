// Cross-check multiple-choice answers against textbook text (triage tool, not proof).
//
//   node scripts/crosscheck.mjs --questions q.json --text book1.txt --text book2.txt --out report.json
//
// q.json: [{ id, question, options: {A:"..",B:".."}, answer: "A" | "AB" }]
// For every question it finds the textbook passages that best match the question, then measures how well each
// option's wording is supported by those passages. Output verdicts:
//   confirmed    the declared option's wording is found (>=80%) in a passage matching the question
//   conflict     another option's wording is found there but the declared one is not (REVIEW BY HAND)
//   ambiguous    both appear: needs a human read
//   manual       cannot be judged by wording: "all of the above", numbers, "which is NOT..." questions
//   unverified   the textbook text does not settle it automatically (paraphrase, calculation...)
// Texts are plain UTF-8 files; "=== PAGE n ===" markers (from pypdf extraction) are used to cite pages.
import { readFileSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'

const args = process.argv.slice(2)
const opt = (name) => args.flatMap((a, i) => (a === `--${name}` ? [args[i + 1]] : []))
const qFile = opt('questions')[0]
const texts = opt('text')
const outFile = opt('out')[0]
if (!qFile || !texts.length || !outFile) throw new Error('usage: --questions q.json --text book.txt [--text ...] --out report.json')

const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)

// ---- windows over textbooks
const WIN = 70
const STRIDE = 20
const windows = []
for (const file of texts) {
  const raw = readFileSync(file, 'utf8')
  const toks = []
  const pageAt = []
  let page = 0
  for (const part of raw.split(/\r?\n=== PAGE (\d+) ===\r?\n/)) {
    if (/^\d+$/.test(part)) {
      page = Number(part)
      continue
    }
    for (const t of norm(part)) {
      toks.push(t)
      pageAt.push(page)
    }
  }
  for (let i = 0; i < toks.length; i += STRIDE) {
    const slice = toks.slice(i, i + WIN)
    const set = new Set(slice)
    for (let j = 0; j + 1 < slice.length; j++) set.add(slice[j] + '_' + slice[j + 1])
    windows.push({ book: basename(file), page: pageAt[i], set, text: slice.join(' ') })
  }
}
const df = new Map()
for (const w of windows) for (const t of w.set) df.set(t, (df.get(t) || 0) + 1)
const idf = (t) => Math.log((windows.length + 1) / ((df.get(t) || 0) + 1)) + 0.1

function grams(tokens) {
  const g = new Set(tokens)
  for (let j = 0; j + 1 < tokens.length; j++) g.add(tokens[j] + '_' + tokens[j + 1])
  return [...g]
}
// weighted coverage of `terms` by window
function cover(terms, w) {
  let hit = 0
  let tot = 0
  for (const t of terms) {
    const x = idf(t)
    tot += x
    if (w.set.has(t)) hit += x
  }
  return tot ? hit / tot : 0
}

const questions = JSON.parse(readFileSync(qFile, 'utf8'))
const report = []
for (const q of questions) {
  const qTerms = grams(norm(q.question))
  // windows ranked by how well they match the question stem
  const ranked = windows
    .map((w) => ({ w, s: cover(qTerms, w) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 12)
  const keys = Object.keys(q.options)
  const support = {}
  const where = {}
  for (const k of keys) {
    const oTerms = grams(norm(q.options[k]))
    let best = 0
    let bw = null
    for (const { w, s } of ranked) {
      const sc = cover(oTerms, w) * (0.35 + s) // option wording inside a window that matches the question
      if (sc > best) {
        best = sc
        bw = w
      }
    }
    support[k] = Math.round(best * 1000) / 1000
    where[k] = bw && { book: bw.book, page: bw.page }
  }
  // "local" evidence: how completely each option's wording appears in the 3 passages that best match the stem
  const local = {}
  for (const k of keys) {
    const oTerms = grams(norm(q.options[k]))
    local[k] = Math.round(Math.max(...ranked.slice(0, 3).map(({ w }) => cover(oTerms, w))) * 1000) / 1000
  }
  const declared = [...q.answer]
  const isMeta = (k) => /tất cả|cả\s+[A-D]|đều\s+(đúng|sai)|không có đáp án/i.test(q.options[k])
  const negation = /(?<!\p{L})(không phải|ngoại trừ|sai|không đúng|không thuộc|không bao gồm)(?!\p{L})|(?<!\p{L})(đâu|nào)(?!\p{L})[^?]{0,45}(?<!\p{L})không(?!\p{L})/iu.test(q.question)
  const numeric = keys.every((k) => /^[\d\s.,%\-–\/()]+$/.test(q.options[k]))
  const comparable = keys.filter((k) => !isMeta(k))
  const wrongKeys = comparable.filter((k) => !declared.includes(k))
  const order = [...keys].sort((a, b) => support[b] - support[a])
  const top = order[0]
  const gap = support[top] - support[order[1]]
  const minDeclared = Math.min(...declared.map((k) => local[k]))
  const maxWrong = Math.max(...wrongKeys.map((k) => local[k]), 0)
  const bestWrong = [...wrongKeys].sort((a, b) => local[b] - local[a])[0]
  let verdict
  if (declared.some(isMeta)) verdict = 'manual' // "all of the above" etc.: cannot be judged by wording
  else if (numeric) verdict = 'manual' // numbers need a targeted lookup
  else if (negation) verdict = 'manual' // "which is NOT ..." questions invert the logic
  else if (minDeclared >= 0.8 && minDeclared >= maxWrong) verdict = 'confirmed' // declared wording found in the matching passage
  else if (maxWrong >= 0.85 && minDeclared < 0.6) verdict = 'conflict' // another option is found nearly verbatim, the declared one is not
  else if (maxWrong >= 0.8 && minDeclared >= 0.6) verdict = 'ambiguous' // both appear: needs a human read
  else verdict = 'unverified' // textbook text does not settle it automatically
  const bestW = ranked[0]
  report.push({
    id: q.id,
    verdict,
    declared: q.answer,
    bestWrong,
    local,
    topSupported: top,
    gap: Math.round(gap * 1000) / 1000,
    support,
    stem: bestW && { book: bestW.w.book, page: bestW.w.page, score: Math.round(bestW.s * 100) / 100, snippet: bestW.w.text.slice(0, 600) },
    where,
  })
}
writeFileSync(outFile, JSON.stringify(report, null, 1))
const count = (v) => report.filter((r) => r.verdict === v).length
console.log(`${questions.length} questions · confirmed ${count('confirmed')} · ambiguous ${count('ambiguous')} · conflict ${count('conflict')} · manual ${count('manual')} · unverified ${count('unverified')}`)
