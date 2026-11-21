// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Collection } from '../../types'
import { addCustomCollection, getCustomCollections, saveCustomCollections } from './customCollections'

const deck = (id: string): Collection => ({
  id,
  title: id,
  subject: 'Môn',
  contentType: 'true-false',
  description: 'd',
  items: [{ id: 'a', type: 'true-false', content: { statement: 'S', answer: true } }],
})

describe('uploaded decks storage', () => {
  beforeEach(() => saveCustomCollections([]))
  afterEach(() => vi.restoreAllMocks())

  it('saves and lists a deck', () => {
    expect(addCustomCollection(deck('bo-a')).ok).toBe(true)
    expect(getCustomCollections().map((c) => c.id)).toEqual(['bo-a'])
    expect(JSON.parse(localStorage.getItem('psh.custom_collections')!)).toHaveLength(1)
  })

  it('says so, and keeps the list as it was, when the browser refuses to store (quota full)', () => {
    expect(addCustomCollection(deck('giu-lai')).ok).toBe(true)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    const res = addCustomCollection(deck('khong-luu-duoc'))
    expect(res.ok).toBe(false)
    expect(res.errors[0]).toContain('đã đầy')
    // the deck that could not be saved must not linger in memory, where it would vanish at the next reload
    expect(getCustomCollections().map((c) => c.id)).toEqual(['giu-lai'])
  })
})
