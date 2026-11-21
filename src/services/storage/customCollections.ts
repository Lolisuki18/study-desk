import { useEffect, useState } from 'react'
import type { Collection } from '../../types'
import { validateCollection } from '../../utils/validate'

const STORAGE_KEY = 'psh.custom_collections'

let customCache: Collection[] | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

export function getCustomCollections(): Collection[] {
  if (customCache) return customCache
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    customCache = raw ? JSON.parse(raw) : []
  } catch {
    customCache = []
  }
  return customCache ?? []
}

export function isCustomCollection(id: string): boolean {
  return getCustomCollections().some((c) => c.id === id)
}

/** Returns false when the browser refused to store the list (quota full, storage blocked). */
export function saveCustomCollections(list: Collection[]): boolean {
  customCache = list
  let stored = true
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    stored = false
  }
  notify()
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('custom-collections-changed'))
  return stored
}

export function addCustomCollection(collection: Collection): { ok: boolean; errors: string[] } {
  const res = validateCollection(collection)
  if (!res.ok) {
    return { ok: false, errors: res.errors }
  }

  const list = getCustomCollections()
  const idx = list.findIndex((c) => c.id === collection.id)
  let nextList: Collection[]
  if (idx >= 0) {
    nextList = [...list.slice(0, idx), collection, ...list.slice(idx + 1)]
  } else {
    nextList = [collection, ...list]
  }

  if (!saveCustomCollections(nextList)) {
    // keep memory and storage in step: without this the deck would show now and be gone after a reload
    saveCustomCollections(list)
    return {
      ok: false,
      errors: ['Bộ nhớ của trình duyệt đã đầy hoặc đang bị chặn nên không lưu được bộ này. Hãy xóa bớt bộ tự tải lên, xuất file sao lưu rồi thử lại.'],
    }
  }
  return { ok: true, errors: [] }
}

export function deleteCustomCollection(id: string): void {
  const list = getCustomCollections()
  const nextList = list.filter((c) => c.id !== id)
  saveCustomCollections(nextList)
}

export function useCustomCollections() {
  const [list, setList] = useState<Collection[]>(() => getCustomCollections())

  useEffect(() => {
    const update = () => setList([...getCustomCollections()])
    listeners.add(update)
    window.addEventListener('storage', update)
    return () => {
      listeners.delete(update)
      window.removeEventListener('storage', update)
    }
  }, [])

  return {
    customCollections: list,
    count: list.length,
    add: addCustomCollection,
    deleteCollection: deleteCustomCollection,
    isCustom: isCustomCollection,
  }
}
