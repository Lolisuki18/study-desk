import { describe, expect, it } from 'vitest'
import { extractTimelineMilestones } from './timeline'
import type { Entry } from '../types'

describe('extractTimelineMilestones', () => {
  it('extracts years and groups entries chronologically', () => {
    const mockEntries: Entry[] = [
      {
        collection: {
          id: 'test-vnr',
          title: 'VNR Test',
          description: 'Bộ câu hỏi test',
          subject: 'VNR202',
          contentType: 'multiple-choice',
          items: [],
        },
        item: {
          id: 'q1',
          type: 'multiple-choice',
          content: {
            question: 'Chiến dịch Điện Biên Phủ toàn thắng vào năm nào?',
            options: [
              { key: 'A', text: 'Năm 1954' },
              { key: 'B', text: 'Năm 1975' },
            ],
            answer: 'A',
            explanation: 'Ngày 7/5/1954, tập đoàn cứ điểm Điện Biên Phủ bị tiêu diệt hoàn toàn.',
          },
        },
      },
      {
        collection: {
          id: 'test-vnr',
          title: 'VNR Test',
          description: 'Bộ câu hỏi test',
          subject: 'VNR202',
          contentType: 'multiple-choice',
          items: [],
        },
        item: {
          id: 'q2',
          type: 'multiple-choice',
          content: {
            question: 'Đại hội lần thứ VI của Đảng khởi xướng công cuộc Đổi mới vào năm 1986.',
            options: [
              { key: 'A', text: '1986' },
              { key: 'B', text: '1991' },
            ],
            answer: 'A',
          },
        },
      },
    ]

    const milestones = extractTimelineMilestones(mockEntries)
    expect(milestones.length).toBeGreaterThan(0)
    // Should be sorted ascending by year
    expect(milestones[0].year).toBeLessThanOrEqual(milestones[milestones.length - 1].year)
    const years = milestones.map((m) => m.year)
    expect(years).toContain(1954)
    expect(years).toContain(1986)
  })
})
