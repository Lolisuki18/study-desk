import { describe, expect, it } from 'vitest'
import type { Collection, Entry, Item } from '../types'
import { extractTimelineMilestones, timelineText } from './timeline'

const col = (id: string): Collection => ({ id, title: id, subject: 'Lịch sử Đảng', contentType: 'mixed', description: '', items: [] })
const entry = (item: Item, collection = col('c')): Entry => ({ collection, item })
const mc = (id: string, question: string, options: string[], answer: string, explanation?: string): Item => ({
  id,
  type: 'multiple-choice',
  content: { question, options: options.map((text, i) => ({ key: 'ABCD'[i], text })), answer, explanation },
})
const years = (items: Item[]) => extractTimelineMilestones(items.map((i) => entry(i))).map((m) => m.year)

describe('extractTimelineMilestones', () => {
  it('groups entries by year, oldest first', () => {
    const ms = extractTimelineMilestones([
      entry(mc('q1', 'Chiến dịch Điện Biên Phủ toàn thắng vào năm nào?', ['Năm 1954', 'Năm 1975'], 'A', 'Ngày 7/5/1954, tập đoàn cứ điểm bị tiêu diệt.')),
      entry(mc('q2', 'Đại hội VI khởi xướng Đổi mới vào năm 1986.', ['1986', '1991'], 'A')),
    ])
    expect(ms.map((m) => m.year)).toEqual([1954, 1986])
    expect(ms[0].dateStr).toBe('7/5/1954')
  })

  it('ignores years that only appear in wrong options', () => {
    // asked "which year", options 1930 / 1945 / 1954 / 1975: only the correct one is a milestone of this question
    const q = mc('q', 'Đảng Cộng sản Việt Nam ra đời vào năm nào?', ['1930', '1945', '1954', '1975'], 'A')
    expect(years([q])).toEqual([1930])
  })

  it('keeps a year that is in the stem, the correct answer or the explanation', () => {
    expect(years([mc('a', 'Sau Cách mạng 1945, sự kiện nào diễn ra?', ['Khởi nghĩa', 'Chiến tranh'], 'A')])).toEqual([1945])
    expect(years([mc('b', 'Hiệp định Giơnevơ được ký khi nào?', ['Năm 1954', 'Năm 1973'], 'A')])).toEqual([1954])
    expect(years([mc('c', 'Sự kiện nào?', ['Một', 'Hai'], 'A', 'Xảy ra năm 1968.')])).toEqual([1968])
  })

  it('reads every correct option of a select-all question', () => {
    expect(years([mc('m', 'Chọn các mốc đúng', ['1930', '1945', '1954', '1975'], 'AC')])).toEqual([1930, 1954])
  })

  it('does not trust the dates of a false true/false statement', () => {
    const wrong: Item = { id: 't', type: 'true-false', content: { statement: 'Đại hội I của Đảng họp năm 1945.', answer: false, explanation: 'Đại hội I họp năm 1935.' } }
    const right: Item = { id: 'u', type: 'true-false', content: { statement: 'Đảng ra đời năm 1930.', answer: true } }
    expect(years([wrong])).toEqual([1935])
    expect(years([right])).toEqual([1930])
    expect(timelineText(wrong).main).toBe('')
  })

  it('titles a year with the question that names it in its stem', () => {
    const ms = extractTimelineMilestones([
      entry(mc('first', 'Một câu hỏi khác có đáp án là một mốc', ['1930', 'Khác'], 'A')),
      entry(mc('stem', 'Hội nghị thành lập Đảng họp năm 1930 ở đâu?', ['Hương Cảng', 'Hà Nội'], 'A')),
    ])
    expect(ms[0].title).toBe('Hội nghị thành lập Đảng họp năm 1930 ở đâu?')
    expect(ms[0].entries).toHaveLength(2)
  })

  it('lists a question once per year, and treats equal ids in different collections as different questions', () => {
    const a = entry(mc('q-001', 'Sự kiện năm 1930 và 1930?', ['1930', 'x'], 'A'), col('one'))
    const b = entry(mc('q-001', 'Sự kiện năm 1930?', ['1930', 'x'], 'A'), col('two'))
    const ms = extractTimelineMilestones([a, b])
    expect(ms).toHaveLength(1)
    expect(ms[0].entries).toHaveLength(2)
  })

  it('skips numbers that are not years', () => {
    expect(years([mc('n', 'Có 1.945 người và 2000 người tham gia, cách đó 1900 km, tăng 1950%?', ['x', 'y'], 'A')])).toEqual([])
    expect(years([mc('o', 'Năm 1800 và năm 2100 ngoài phạm vi', ['x', 'y'], 'A')])).toEqual([])
  })

  it('reads "tháng M năm Y" as a date label', () => {
    const ms = extractTimelineMilestones([entry(mc('d', 'Hội nghị họp vào tháng 2 năm 1930 tại đâu?', ['Hương Cảng', 'Hà Nội'], 'A'))])
    expect(ms[0].dateStr).toBe('Tháng 2/1930')
  })
})
