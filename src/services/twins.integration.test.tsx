// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { act, render, waitFor } from '@testing-library/react'
import { collections } from '../data'
import { ProgressProvider, useProgress } from '../features/learning/ProgressContext'
import { getTwinIndex, refKey } from './twins'

type Api = ReturnType<typeof useProgress>

describe('progress is shared between twins', () => {
  it('answering one copy of a question updates its twin in another deck, with one activity entry', async () => {
    const [key, others] = [...getTwinIndex(collections)][0]
    const [collectionId, itemId] = key.split('::')
    let api!: Api
    const Probe = () => {
      api = useProgress()
      return null
    }
    render(
      <ProgressProvider>
        <Probe />
      </ProgressProvider>,
    )
    await waitFor(() => expect(api.loaded).toBe(true))

    act(() => api.record([{ collectionId, itemId, correct: true }], 'quiz'))

    const own = api.progress.get(key)
    const twin = api.progress.get(refKey(others[0]))
    expect(own?.status).toBe('known')
    expect(twin?.status).toBe('known')
    expect(twin?.level).toBe(own?.level)
    await waitFor(() => expect(api.activity.filter((a) => a.itemId === itemId && a.collectionId === collectionId)).toHaveLength(1))
    // the twin gets no activity line of its own: one answer is one answer in the daily goal and the statistics
    expect(api.activity.some((a) => a.collectionId === others[0].collectionId && a.itemId === others[0].itemId)).toBe(false)
  }, 30000)

  it('wrong answers are shared too, and a conflicting question is not touched', async () => {
    const index = getTwinIndex(collections)
    const [key, others] = [...index][1]
    const [collectionId, itemId] = key.split('::')
    let api!: Api
    const Probe = () => {
      api = useProgress()
      return null
    }
    render(
      <ProgressProvider>
        <Probe />
      </ProgressProvider>,
    )
    await waitFor(() => expect(api.loaded).toBe(true))
    act(() => api.record([{ collectionId, itemId, correct: false }], 'quiz'))
    expect(api.progress.get(refKey(others[0]))?.status).toBe('unknown')
    expect(api.progress.get(refKey(others[0]))?.incorrect).toBeGreaterThanOrEqual(1)
  }, 30000)
})
