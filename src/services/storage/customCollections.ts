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

export function saveCustomCollections(list: Collection[]): void {
  customCache = list
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {}
  notify()
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('custom-collections-changed'))
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

  saveCustomCollections(nextList)
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
