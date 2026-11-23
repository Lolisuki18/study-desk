import { describe, it, expect } from 'vitest'
import { lookupWord, searchDictionary, OFFLINE_DICTIONARY } from './dictionary'

describe('Offline IELTS Dictionary', () => {
  it('should find exact word match', () => {
    const entry = lookupWord('substantial')
    expect(entry).not.toBeNull()
    expect(entry?.word).toBe('substantial')
    expect(entry?.band).toBe('7.5')
  })

  it('should search dictionary by Vietnamese meaning keyword', () => {
    const results = searchDictionary('Dang ke')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].word).toBe('substantial')
  })

  it('should return null for non-existent word', () => {
    const entry = lookupWord('nonexistentwordxyz')
    expect(entry).toBeNull()
  })

  it('should have valid fields in all entries', () => {
    for (const item of OFFLINE_DICTIONARY) {
      expect(item.word.length).toBeGreaterThan(0)
      expect(item.ipa.startsWith('/')).toBe(true)
      expect(item.examples.length).toBeGreaterThan(0)
      expect(item.collocations.length).toBeGreaterThan(0)
    }
  })
})
