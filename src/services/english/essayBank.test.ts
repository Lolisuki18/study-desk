import { describe, it, expect } from 'vitest'
import { filterEssays, ESSAY_BANK } from './essayBank'

describe('IELTS Essay Bank', () => {
  it('should return all essays when no filter is applied', () => {
    const list = filterEssays({})
    expect(list.length).toBe(ESSAY_BANK.length)
  })

  it('should filter essays by Task Type', () => {
    const task1List = filterEssays({ taskType: 'Task 1' })
    expect(task1List.length).toBeGreaterThan(0)
    expect(task1List.every((e) => e.taskType === 'Task 1')).toBe(true)

    const task2List = filterEssays({ taskType: 'Task 2' })
    expect(task2List.length).toBeGreaterThan(0)
    expect(task2List.every((e) => e.taskType === 'Task 2')).toBe(true)
  })

  it('should filter essays by topic', () => {
    const techList = filterEssays({ topic: 'Technology & AI' })
    expect(techList.length).toBeGreaterThan(0)
    expect(techList[0].topic).toBe('Technology & AI')
  })

  it('should filter essays by keyword query', () => {
    const results = filterEssays({ query: 'artificial intelligence' })
    expect(results.length).toBeGreaterThan(0)
  })

  it('each essay should have full 4 criteria breakdown', () => {
    for (const e of ESSAY_BANK) {
      expect(e.examinerCriteria.tr).toBeDefined()
      expect(e.examinerCriteria.cc).toBeDefined()
      expect(e.examinerCriteria.lr).toBeDefined()
      expect(e.examinerCriteria.gra).toBeDefined()
      expect(e.keyCollocations.length).toBeGreaterThan(0)
    }
  })
})
