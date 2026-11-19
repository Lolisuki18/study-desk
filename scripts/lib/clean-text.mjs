// Repairs copy/OCR damage in the community question banks (VNR202 in particular), WITHOUT changing the meaning.
//
// The raw banks (docs/source-*.json) are never edited; the importers run this cleaner on the text they copy, and
// docs/*-text-cleanup.md lists every change. The cleaner only fixes damage that a clean vocabulary can confirm:
//   1. a repeated tail glued to the end of a text ("... công bằng cho mọi thành phần kinh t tư, kinh doanh ...")
//   2. words split by a stray space ("cách mạn g", "Phá p", "l ượng")  -> joined when the joined word exists
//   3. words that lost a tone mark ("chính tri", "quyết đinh", "moi")   -> restored when the neighbouring words
//      make only the accented form plausible (bigram evidence from CLEAN text)
//   4. a last word cut off ("... đồng bộ về cơ cấ")                    -> completed when the vocabulary agrees
// Anything the vocabulary cannot confirm is left exactly as it was.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const NFC = (s) => s.normalize('NFC')
const strip = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
const WORD = /(\p{L}+)/gu
const words = (text) => NFC(text).toLowerCase().match(WORD) ?? []

function* stringsOf(v) {
  if (typeof v === 'string') yield v
  else if (Array.isArray(v)) for (const x of v) yield* stringsOf(x)
  else if (v && typeof v === 'object') for (const x of Object.values(v)) yield* stringsOf(x)
}

/** Clean corpus: hand-made collections, the markdown sources and the other (clean) banks. */
export function loadCleanCorpus(root, extraFiles = []) {
  const texts = []
  const docs = resolve(root, 'docs')
  for (const f of readdirSync(docs)) if (/^source-.*\.md$/.test(f)) texts.push(...readFileSync(resolve(docs, f), 'utf8').split('\n'))
  const col = resolve(root, 'src/data/collections')
  for (const dir of readdirSync(col)) {
    for (const f of readdirSync(resolve(col, dir))) {
      if (!f.endsWith('.json')) continue
      // the damaged decks themselves are not evidence
      if (/^bank-(vnr202|mln131)|vnr202-full|mln131-full/.test(f)) continue
      const c = JSON.parse(readFileSync(resolve(col, dir, f), 'utf8'))
      for (const it of c.items) texts.push(...stringsOf(it.content))
    }
  }
  for (const f of extraFiles) if (existsSync(f)) texts.push(...readFileSync(f, 'utf8').split('\n'))
  return texts
}


/** whole-word match that understands Vietnamese letters (\b does not) */
export const W = (text) => new RegExp(String.raw`(?<![\p{L}])` + text + String.raw`(?![\p{L}])`, 'gu')

/** Keyboard typos confirmed one by one in the MLN131 banks (the context shows the intended word). */
export const MLN_TYPOS = {
  wordFixes: {
    chủa: 'chủ', đáu: 'đấu', hính: 'hình', vởi: 'với', hể: 'hệ', họi: 'hội', phầm: 'phẩm', xuát: 'xuất', biêu: 'biểu', khong: 'không',
    đỏi: 'đổi', cua: 'của', thuãn: 'thuẫn', xõa: 'xóa', thùa: 'thừa', cở: 'cơ', thõa: 'thỏa', chiễm: 'chiếm', đòng: 'đồng', rọng: 'rộng',
    tọc: 'tộc', pải: 'phải', đén: 'đến', dượng: 'dựng', giap: 'giai', cuong: 'cương',
  },
  phrases: [
    [W('bản than'), 'bản thân'],
    [W('thành tự'), 'thành tựu'],
    [W('các án'), 'các đáp án'],
    [W('luân cảnh giác'), 'luôn cảnh giác'],
    [W('nối cảnh'), 'bối cảnh'],
    [W('lật đỏi'), 'lật đổ'],
    [W('giải phóng cong người'), 'giải phóng con người'],
    [W('xã hộ'), 'xã hội'],
  ],
}

export function buildCleaner(corpus, evidence = [], { wordFixes = {}, phrases = [] } = {}) {
  const uni = new Map()
  const big = new Map()
  const byStrip = new Map()
  const add = (w) => {
    uni.set(w, (uni.get(w) ?? 0) + 1)
    const k = strip(w)
    if (!byStrip.has(k)) byStrip.set(k, new Set())
    byStrip.get(k).add(w)
  }
  for (const line of corpus) {
    // words separated by a single space only (a comma, a dash ... breaks the context)
    for (const run of NFC(line).toLowerCase().split(/[^\p{L} ]+| {2,}/u)) {
      const ws = run.split(' ').filter(Boolean)
      ws.forEach((w, i) => {
        add(w)
        if (i > 0) big.set(`${ws[i - 1]} ${w}`, (big.get(`${ws[i - 1]} ${w}`) ?? 0) + 1)
      })
    }
  }
  // tokens carrying a dot-below tone mark survive intact even in the damaged banks, so they are valid words
  for (const line of evidence) for (const w of words(line)) if (/[ạặậẹệịọộợụựỵ]/.test(w) && !uni.has(w)) add(w)
  const vocabList = [...uni.keys()]
  const U = (w) => uni.get(w) ?? 0
  const B = (a, b) => (a && b ? big.get(`${a} ${b}`) ?? 0 : 0)
  const ctx = (prev, w, next) => B(prev, w) + B(w, next)

  const keepCase = (orig, repl) => {
    if (orig.length > 1 && orig === orig.toUpperCase()) return repl.toUpperCase()
    if (orig[0] !== orig[0].toLowerCase()) return repl[0].toUpperCase() + repl.slice(1)
    return repl
  }

  /** 1. glued repeated tail */
  function dropRepeatedTail(text) {
    if (text.length < 50) return text
    for (let j = 15; j <= text.length - 20; j++) {
      // the repeat may start mid-word (a cut word followed by its own continuation)
      const tail = text.slice(j)
      // the glued tail must be a copy of the end of the text before it ("... xã hội" + "vật chất ... xã hội")
      if (tail.length >= 20 && text.slice(0, j).endsWith(tail)) return text.slice(0, j).trimEnd()
    }
    return text
  }

  /** split the text in words and separators */
  const segments = (text) => NFC(text).split(/(\p{L}+)/u).map((t, i) => ({ t, w: i % 2 === 1 })).filter((s) => s.t !== '')

  function joinSplitWords(segs) {
    const out = []
    for (let i = 0; i < segs.length; i++) {
      const a = segs[i]
      const sep = segs[i + 1]
      const b = segs[i + 2]
      if (a.w && sep && sep.t === ' ' && b?.w) {
        const la = a.t.toLowerCase()
        const lb = b.t.toLowerCase()
        const joined = la + lb
        const stray = lb.length === 1 || (lb.length === 2 && U(lb) < 5)
        const strayLeft = la.length === 1 && /[bcdđghklmnpqrstvx]/.test(la)
        if (U(joined) >= 2 && ((stray && U(joined) > U(la)) || (strayLeft && U(joined) > U(lb)))) {
          out.push({ t: keepCase(a.t, la) + (a.t === a.t.toUpperCase() && a.t.length > 1 ? lb.toUpperCase() : lb), w: true })
          i += 2
          continue
        }
      }
      out.push(a)
    }
    return out
  }

  // The damaged banks lost exactly one thing: the dot-below tone mark (nặng): "chính tri", "quyết đinh", "moi".
  // So only a word whose dot-below form exists is a candidate (never a different tone or vowel shape).
  const DOT = { ạ: 'a', ặ: 'ă', ậ: 'â', ẹ: 'e', ệ: 'ê', ị: 'i', ọ: 'o', ộ: 'ô', ợ: 'ơ', ụ: 'u', ự: 'ư', ỵ: 'y' }
  const noDot = (w) => w.replace(/[ạặậẹệịọộợụựỵ]/g, (ch) => DOT[ch])
  const withDot = new Map()
  for (const w of vocabList) if (noDot(w) !== w) (withDot.get(noDot(w)) ?? withDot.set(noDot(w), new Set()).get(noDot(w))).add(w)
  // Only words seen losing their dot in these banks are ever restored (a curated list: valid but unseen words such as
  // "tử vong" or "trong số" must never be "corrected").
  // SAFE: the dotless form is not an ordinary word, so the dotted one is restored whatever the neighbours are.
  const SAFE = new Set(['đinh', 'đia', 'đich', 'dich', 'vu', 'hoc', 'muc', 'moi', 'bon', 'duc', 'cuc', 'tuc', 'goi', 'tich', 'hoach', 'hôi', 'phuc', 'lich', 'đoc', 'đep', 'nhe', 'kip', 'hâu', 'ven', 'chon', 'luc', 'thit'])
  // CONTEXT: the dotless form is also a real word ("tri thức", "nghi ngờ", "hop"...): restored only when the clean
  // text shows the dotted form next to the neighbours and the dotless form never.
  const CONTEXT = new Set(['tri', 'bi', 'nghi', 'thi', 'phu', 'dung', 'hop', 'ngon', 'tu', 'cu', 'ho', 'đai', 'điên', 'trong', 'đoan'])
  const TRONG_BEFORE = new Set(['quan', 'tôn', 'nghiêm', 'coi'])
  const TRONG_AFTER = new Set(['tâm', 'yếu', 'điểm'])

  function restoreTones(segs) {
    for (let pass = 0; pass < 2; pass++) {
      segs.forEach((seg, i) => {
        if (!seg.w || seg.t.length < 2) return
        // a capitalised word inside a sentence is a name (Lê, Pari, Gò Công): never touched
        // (the very first word of a text is allowed only when it is rare in clean text: "Đinh hướng", not "Lê Trọng")
        if (seg.t[0] !== seg.t[0].toLowerCase() && seg.t !== seg.t.toUpperCase() && (i > 0 || U(seg.t.toLowerCase()) >= 5)) return
        const orig = seg.t
        const lw = orig.toLowerCase()
        if (!SAFE.has(lw) && !CONTEXT.has(lw)) return
        const cands = [...(withDot.get(lw) ?? [])].filter((c) => U(c) >= 2)
        if (!cands.length) return
        const prevSeg = segs[i - 2]
        const nextSeg = segs[i + 2]
        const prev = segs[i - 1]?.t === ' ' && prevSeg?.w ? prevSeg.t.toLowerCase() : ''
        const next = segs[i + 1]?.t === ' ' && nextSeg?.w ? nextSeg.t.toLowerCase() : ''
        const own = ctx(prev, lw, next)
        let best = null
        for (const c of cands) {
          const sc = ctx(prev, c, next)
          if (sc > own && (!best || sc > best.sc || (sc === best.sc && U(c) > U(best.c)))) best = { c, sc }
        }
        if (SAFE.has(lw)) {
          const pick = best?.c ?? [...cands].sort((x, y) => U(y) - U(x))[0]
          segs[i] = { t: keepCase(orig, pick), w: true }
        } else if (best && best.sc >= 2 && (own === 0 || (lw === 'trong' && TRONG_BEFORE.has(prev))) && (lw !== 'trong' || TRONG_BEFORE.has(prev) || TRONG_AFTER.has(next))) {
          segs[i] = { t: keepCase(orig, best.c), w: true }
        }
      })
    }
    return segs
  }

  const NO_COMPLETE = new Set(['là', 'và', 'đó', 'này', 'ấy', 'nào', 'gì', 'mà', 'thì', 'của', 'các', 'có', 'cho', 'với', 'một', 'để', 'khi', 'nếu', 'vì', 'do', 'bị', 'được', 'trong', 'ngoài', 'như', 'nên', 'ra', 'ở', 'tại', 'theo', 'từ', 'đến', 'sau', 'trên', 'dưới'])

  function completeLastWord(segs) {
    const last = segs.length - 1
    if (last < 0 || !segs[last].w) return segs
    const orig = segs[last].t
    const lw = orig.toLowerCase()
    // a capitalised stub longer than 3 letters may be a whole name ("Pari"): left alone
    if (orig[0] !== orig[0].toLowerCase() && lw.length > 3) return segs
    const prevSeg = segs[last - 2]
    const prev = segs[last - 1]?.t === ' ' && prevSeg?.w ? prevSeg.t.toLowerCase() : ''
    if (!prev) return segs
    // a stub that is itself a real function word ("thứ tự là", "cá nhân đó") or a roman numeral ("Đại hội VII") is never 'completed'
    if (/^[ivxlcdm]+$/.test(lw) || NO_COMPLETE.has(lw)) return segs
    // one letter says too little: the few known cases ("kinh t", "quản l", a closing "l" = "là") are phrases above
    if (lw.length < 2) return segs
    // the word before may itself have lost its dot ("thi" for "thị"): its dotted forms count as the same context
    const prevForms = [prev, ...(withDot.get(prev) ?? [])]
    const BP = (w) => Math.max(...prevForms.map((p) => B(p, w)))
    const own = BP(lw)
    // "Đại hội l", "khóa X": a lone roman numeral after these words is a number, not a cut word
    if (/^[ivxlcdm]$/.test(lw) && ['hội', 'khóa', 'lần', 'thứ', 'chương'].includes(prev)) return segs
    // the cut word is completed only when ONE continuation clearly wins in this context
    const scored = []
    for (const c of vocabList) {
      // the cut can also have swallowed the tone mark ("giáo du" -> "giáo dục"), so compare without the dot-below
      if (c.length <= lw.length || c.length > lw.length + 3 || !(c.startsWith(lw) || noDot(c).startsWith(lw)) || U(c) < 3) continue
      const s = BP(c)
      if (s > 0) scored.push({ c, s })
    }
    scored.sort((x, y) => y.s - x.s)
    // ... and only when it beats the word as written (a bank typo may make "xã hộ" appear once in the clean text too)
    const best = scored[0] && scored[0].s >= (lw.length === 1 ? 3 : 2) && scored[0].s >= 2 * (scored[1]?.s ?? 0) && scored[0].s >= 4 * own ? scored[0] : null
    if (best) segs[last] = { t: keepCase(orig, best.c), w: true }
    return segs
  }

  // a few damaged phrases the vocabulary cannot decide by itself
  const PHRASES = [
    [/toàn ve n\b/gi, 'toàn vẹn'],
    [/\bta y\b/g, 'tay'],
    [/\bsử dung\b/gi, (m) => (m[0] === 'S' ? 'Sử dụng' : 'sử dụng')],
    // endings cut off in the VNR202 bank where the whole phrase is unambiguous
    [/Mỹ - Diệ$/u, 'Mỹ - Diệm'],
    [/nhỏ và vừ$/u, 'nhỏ và vừa'],
    [/Trung ương Đản$/u, 'Trung ương Đảng'],
    [/quân Tưởn$/u, 'quân Tưởng'],
    [/hoàn tấ$/u, 'hoàn tất'],
    [/Bửu Lộ$/u, 'Bửu Lộc'],
    [/yếu k$/u, 'yếu kém'],
    [/thiết nhấ$/u, 'thiết nhất'],
    [/công ngh$/u, 'công nghệ'],
    [/công- nôn$/u, 'công nông'],
    [/bao nhiêu đợ$/u, 'bao nhiêu đợt'],
    [/nghề biể$/u, 'nghề biển'],
    [/\bso ạn\b/gu, 'soạn'],
    [/\b(tỉ|tỷ) trong\b/gu, '$1 trọng'],
    [/Việt N$/u, 'Việt Nam'],
    [/xã h$/u, 'xã hội'],
    [/Hồ Chí Mi$/u, 'Hồ Chí Minh'],
    [/Đảng là g$/u, 'Đảng là gì'],
    [/quản l$/u, 'quản lý'],
    [/kinh t$/u, 'kinh tế'],
    // a lone "l" at the end is a cut "là" (not the roman numeral: "Đại hội l")
    [/(?<!(?:hội|khóa|khoá|lần|thứ|chương) )(?<=\p{L} )l$/u, 'là'],
  ]

  // phrase patterns are matched against NFC text, so the patterns themselves must be NFC too
  const ALL_PHRASES = [...PHRASES, ...phrases].map(([re, to]) => [new RegExp(re.source.normalize('NFC'), re.flags), to])

  function clean(text) {
    if (typeof text !== 'string' || !text) return text
    let t = dropRepeatedTail(NFC(text))
    for (const [re, to] of ALL_PHRASES) t = t.replace(re, to)
    // typos confirmed one by one in the bank (key = wrong word, lower case)
    if (Object.keys(wordFixes).length) t = t.replace(/\p{L}+/gu, (w) => (wordFixes[w.toLowerCase()] ? keepCase(w, wordFixes[w.toLowerCase()]) : w))
    let segs = segments(t)
    segs = joinSplitWords(segs)
    // tones first ("thi trườn" -> "thị trườn"), then the cut word, which may need the restored word before it
    segs = restoreTones(segs)
    if (!/[.?!"”)…:;]\s*$/.test(t)) segs = completeLastWord(segs)
    segs = restoreTones(segs)
    // phrases once more: some only match after split words were joined ("Trun g ương Đản")
    let out = segs.map((s) => s.t).join('')
    for (const [re, to] of ALL_PHRASES) out = out.replace(re, to)
    return out
  }
  return { clean, stats: { words: uni.size, bigrams: big.size } }
}
