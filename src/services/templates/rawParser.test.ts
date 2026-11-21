import { describe, expect, it } from 'vitest'
import { parseRawText, resolveAnswerKeys, slugify } from './rawParser'
import { validateCollection } from '../../utils/validate'
import type { Item, MultipleChoiceContent, TrueFalseContent } from '../../types'

const mc = (it: Item) => it.content as MultipleChoiceContent
const answers = (raw: string) => parseRawText(raw).collection.items.map((i) => (i.type === 'multiple-choice' ? mc(i).answer : (i.content as TrueFalseContent).answer))

describe('parseRawText: multiple choice', () => {
  it('parses the typical ChatGPT / Word format', () => {
    const res = parseRawText(
      `
Câu 1: Đảng Cộng sản Việt Nam thành lập vào ngày tháng năm nào?
A. 03/02/1930
B. 19/08/1945
C. 02/09/1945
D. 30/04/1975
Đáp án: A
Giải thích: Hội nghị thành lập Đảng họp tại Cửu Long.

Câu 2: Tổng bí thư đầu tiên của Đảng ta là ai?
A. Hồ Chí Minh
B. Trần Phú
C. Lê Hồng Phong
D. Hà Huy Tập
Đáp án đúng: B
`,
      { title: 'Lịch sử Đảng Test', subject: 'VNR202' },
    )
    expect(res.itemCount).toBe(2)
    expect(res.skipped).toBe(0)
    expect(res.warnings).toEqual([])
    expect(res.collection.contentType).toBe('multiple-choice')
    expect(res.collection.subject).toBe('VNR202')
    expect(mc(res.collection.items[0]).options).toHaveLength(4)
    expect(mc(res.collection.items[0]).explanation).toContain('Cửu Long')
    expect(mc(res.collection.items[1]).answer).toBe('B')
    expect(validateCollection(res.collection).ok).toBe(true)
  })

  it('reads the answer when it shares a line with the explanation (the page sample)', () => {
    const res = parseRawText(`Câu 1: Q một?
A. a1
B. b1
C. c1
D. d1
Đáp án: C. Giải thích: Vì C đúng.

Câu 2: Q hai?
A. a2
B. b2
C. c2
D. d2
Đáp án: B. Giải thích: Vì B đúng.`)
    expect(answers(`${'Câu 1: Q?\nA. x\nB. y\nĐáp án: B. Giải thích: z'}`)).toEqual(['B'])
    expect(res.collection.items.map((i) => mc(i).answer)).toEqual(['C', 'B'])
    expect(mc(res.collection.items[0]).explanation).toBe('Vì C đúng.')
  })

  it('accepts the explanation before the answer', () => {
    expect(answers('Câu 1: Q?\nA. x\nB. y\nGiải thích: vì sao đó.\nĐáp án: B')).toEqual(['B'])
  })

  it('splits options written on one line', () => {
    const res = parseRawText('Câu 1: Thủ đô là gì?\nA. Huế B. Hà Nội C. Đà Nẵng D. Cần Thơ\nĐáp án: B')
    expect(mc(res.collection.items[0]).options.map((o) => o.text)).toEqual(['Huế', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ'])
    expect(mc(res.collection.items[0]).answer).toBe('B')
  })

  it('does not mistake words inside a question for markers', () => {
    const raw = [
      'Câu 1: Chọn câu phát biểu đúng về Cương lĩnh 1930:\nA. một\nB. hai\nĐáp án: A',
      'Câu 2: Lý do nào khiến Đảng ra đời?\nA. một\nB. hai\nĐáp án: B',
      'Câu 3: Nhân dân có quyền gì?\nA. Tự do lựa chọn các đại biểu\nB. Không có quyền\nĐáp án: A',
      'Câu 4: Giải thích nào sau đây đúng?\nA. một\nB. hai\nĐáp án: B',
    ].join('\n\n')
    const res = parseRawText(raw)
    expect(res.itemCount).toBe(4)
    expect(res.collection.items.map((i) => mc(i).answer)).toEqual(['A', 'B', 'A', 'B'])
    expect(mc(res.collection.items[0]).question).toBe('Chọn câu phát biểu đúng về Cương lĩnh 1930:')
    expect(mc(res.collection.items[2]).options[0].text).toBe('Tự do lựa chọn các đại biểu')
    expect(res.collection.items.every((i) => i.type === 'multiple-choice')).toBe(true)
  })

  it('reads answers written as text, and never confuses a word with a letter', () => {
    const base = 'Câu 1: Q?\nA. Cách mạng tháng Tám\nB. Trần Phú\nC. Bác Hồ\nD. Hà Nội\n'
    expect(answers(base + 'Đáp án: Trần Phú')).toEqual(['B'])
    expect(answers(base + 'Đáp án: B. Trần Phú')).toEqual(['B'])
    expect(answers(base + 'Đáp án: Cách mạng tháng Tám')).toEqual(['A'])
    expect(answers(base + 'Đáp án: Bác Hồ')).toEqual(['C'])
    expect(answers(base + 'Đáp án: Hà Nội.')).toEqual(['D'])
  })

  it('reads select-all answers in every common spelling', () => {
    const base = 'Câu 1: Chọn các đáp án đúng\nA. một\nB. hai\nC. ba\nD. bốn\n'
    for (const a of ['AC', 'A, C', 'A và C', 'a;c', '(A)(C)', 'A, C.']) expect(answers(base + `Đáp án: ${a}`), a).toEqual(['AC'])
  })

  it('cleans Markdown that ChatGPT adds', () => {
    const res = parseRawText('**Câu 1.** Thủ đô của Việt Nam là gì?\n- A. Huế\n- B. Hà Nội\n**Đáp án: B**\n**Giải thích:** Hà Nội là thủ đô.')
    const q = mc(res.collection.items[0])
    expect(q.question).toBe('Thủ đô của Việt Nam là gì?')
    expect(q.answer).toBe('B')
    expect(q.explanation).toBe('Hà Nội là thủ đô.')
  })

  it('handles blank lines between options and A) / 1) numbering', () => {
    const res = parseRawText('1) Thủ đô là gì?\n\nA) Huế\n\nB) Hà Nội\n\nĐáp án: B')
    expect(res.itemCount).toBe(1)
    expect(mc(res.collection.items[0]).options.map((o) => o.key)).toEqual(['A', 'B'])
  })

  it('splits unnumbered questions on blank lines', () => {
    const res = parseRawText('Thủ đô là gì?\nA. Huế\nB. Hà Nội\nĐáp án: B\n\nMột cộng một bằng?\nA. 2\nB. 3\nĐáp án: A')
    expect(res.itemCount).toBe(2)
  })

  it('takes a ✅ mark on an option as the answer when there is no answer line', () => {
    const res = parseRawText('Câu 1: Q?\nA. sai\nB. đúng ✅\nC. sai')
    expect(mc(res.collection.items[0]).answer).toBe('B')
    expect(mc(res.collection.items[0]).options[1].text).toBe('đúng')
  })
})

describe('parseRawText: never invents an answer', () => {
  it('skips a question without an answer line and says why', () => {
    const res = parseRawText('Câu 1: Q một?\nA. x\nB. y\nĐáp án: A\n\nCâu 2: Q hai?\nA. x\nB. y')
    expect(res.itemCount).toBe(1)
    expect(res.skipped).toBe(1)
    expect(res.warnings[0]).toContain('Câu 2')
    expect(res.warnings[0]).toContain('không tự đoán đáp án')
  })

  it('skips an answer that matches no option', () => {
    const res = parseRawText('Câu 1: Q?\nA. x\nB. y\nĐáp án: A\n\nCâu 2: Q2?\nA. x\nB. y\nĐáp án: E')
    expect(res.itemCount).toBe(1)
    expect(res.warnings.join(' ')).toContain('"E"')
  })

  it('throws, with the reasons, when nothing can be imported', () => {
    expect(() => parseRawText('Câu 1: Q?\nA. x\nB. y')).toThrow(/Câu 1/)
    expect(() => parseRawText('')).toThrow()
    expect(() => parseRawText('   ')).toThrow()
  })

  it('warns about a question whose options are glued together instead of saving junk', () => {
    const res = parseRawText('Câu 1: Q một?\nA. x\nB. y\nĐáp án: A\n\nCâu 2: Q hai?\nA. chỉ một phương án\nĐáp án: A')
    expect(res.itemCount).toBe(1)
    expect(res.warnings[0]).toContain('1 phương án')
  })
})

describe('parseRawText: true/false and glossary', () => {
  it('reads true/false with the answer on the same line, without leaving it in the statement', () => {
    const res = parseRawText('Câu 1: Đảng ra đời năm 1930. Đáp án: Đúng\nCâu 2: Đại hội I họp năm 1945. Đáp án: Sai')
    const items = res.collection.items
    expect(items.map((i) => i.type)).toEqual(['true-false', 'true-false'])
    expect((items[0].content as TrueFalseContent).statement).toBe('Đảng ra đời năm 1930.')
    expect(items.map((i) => (i.content as TrueFalseContent).answer)).toEqual([true, false])
    expect(res.collection.contentType).toBe('true-false')
  })

  it('does not turn a stray question into a glossary entry', () => {
    const res = parseRawText('Câu 1: Q?\nA. x\nB. y\nĐáp án: A\n\nCâu 2: Hà Nội là thủ đô của Việt Nam?\nĐáp án: Tư bản')
    expect(res.itemCount).toBe(1)
    expect(res.collection.items[0].type).toBe('multiple-choice')
  })

  it('parses plain "term: meaning" lists', () => {
    const res = parseRawText('Proletariat: Giai cấp vô sản.\nBourgeoisie - Giai cấp tư sản.\nSurplus value: Giá trị thặng dư.')
    expect(res.itemCount).toBe(3)
    expect(res.collection.contentType).toBe('vocabulary')
    expect(res.collection.items[1].content).toMatchObject({ term: 'Bourgeoisie', meaning: 'Giai cấp tư sản.' })
  })
})

describe('collection produced', () => {
  it('has a valid slug id, a neutral default subject and passes the importer validation', () => {
    const res = parseRawText('Câu 1: Q?\nA. x\nB. y\nĐáp án: A', { title: 'Lịch sử Đảng chương 2' })
    expect(res.collection.id).toMatch(/^custom-lich-su-dang-chuong-2-[a-z0-9]{1,4}$/)
    expect(res.collection.subject).toBe('Bộ tự nhập')
    expect(validateCollection(res.collection).errors).toEqual([])
  })

  it('slugify keeps đ as d and never returns an empty id', () => {
    expect(slugify('Đảng Cộng sản')).toBe('dang-cong-san')
    expect(slugify('!!!')).toBe('bo-hoc')
  })

  it('resolveAnswerKeys needs standalone letters', () => {
    const opts = ['Cách', 'Bác', 'Hà'].map((text, i) => ({ key: 'ABC'[i], text }))
    expect(resolveAnswerKeys('Cách', opts)).toBe('A')
    expect(resolveAnswerKeys('C', opts)).toBe('C')
    expect(resolveAnswerKeys('Z', opts)).toBeNull()
    expect(resolveAnswerKeys('', opts)).toBeNull()
  })
})
