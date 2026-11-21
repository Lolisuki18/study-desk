import { describe, expect, it } from 'vitest'
import { parseRawText } from './rawParser'
import type { MultipleChoiceContent } from '../../types'

describe('parseRawText', () => {
  it('parses typical ChatGPT / Word multiple choice format', () => {
    const raw = `
Câu 1: Đảng Cộng sản Việt Nam thành lập vào ngày tháng năm nào?
A. 03/02/1930
B. 19/08/1945
C. 02/09/1945
D. 30/04/1975
Đáp án: A
Giải thích: Hội nghị thành lập Đảng họp tại Cửu Long (Hương Cảng, Trung Quốc) từ 6/1 đến 7/2/1930.

Câu 2: Tổng bí thư đầu tiên của Đảng ta là ai?
A. Hồ Chí Minh
B. Trần Phú
C. Lê Hồng Phong
D. Hà Huy Tập
Đáp án đúng: B
    `

    const res = parseRawText(raw, { title: 'Lịch sử Đảng Test', subject: 'VNR202' })
    expect(res.itemCount).toBe(2)
    expect(res.collection.title).toBe('Lịch sử Đảng Test')
    expect(res.collection.subject).toBe('VNR202')
    expect(res.collection.contentType).toBe('multiple-choice')

    const q1 = res.collection.items[0]
    expect(q1.type).toBe('multiple-choice')
    const c1 = q1.content as MultipleChoiceContent
    expect(c1.question).toContain('Đảng Cộng sản Việt Nam thành lập')
    expect(c1.options.length).toBe(4)
    expect(c1.answer).toBe('A')
    expect(c1.explanation).toContain('Cửu Long')

    const q2 = res.collection.items[1]
    const c2 = q2.content as MultipleChoiceContent
    expect(c2.answer).toBe('B')
  })

  it('parses simple vocabulary definitions', () => {
    const raw = `
Proletariat: Giai cấp vô sản, những người lao động làm thuê không có tư liệu sản xuất.
Bourgeoisie: Giai cấp tư sản, người sở hữu tư liệu sản xuất.
Surplus value: Giá trị thặng dư do công nhân tạo ra ngoài thời gian lao động tất yếu.
    `

    const res = parseRawText(raw, { title: 'Triết học thuật ngữ' })
    expect(res.itemCount).toBe(3)
    expect(res.collection.items[0].type).toBe('vocabulary')
  })

  it('throws an error for empty text', () => {
    expect(() => parseRawText('')).toThrow()
    expect(() => parseRawText('   ')).toThrow()
  })
})
