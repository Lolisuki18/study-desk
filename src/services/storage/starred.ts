import { useEffect, useState } from 'react'

const STORAGE_KEY = 'psh.starred_items'

let cachedSet: Set<string> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

export function getStarredSet(): Set<string> {
  if (cachedSet) return cachedSet
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    cachedSet = new Set(raw ? JSON.parse(raw) : [])
  } catch {
    cachedSet = new Set()
  }
  return cachedSet
}

export function isStarred(collectionId: string, itemId: string): boolean {
  const set = getStarredSet()
  return set.has(`${collectionId}::${itemId}`)
}

export function setStarred(collectionId: string, itemId: string, starred: boolean): void {
  const set = getStarredSet()
  const key = `${collectionId}::${itemId}`
  if (starred) {
    set.add(key)
  } else {
    set.delete(key)
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
  } catch {}
  notify()
}

export function toggleStarred(collectionId: string, itemId: string): boolean {
  const starred = !isStarred(collectionId, itemId)
  setStarred(collectionId, itemId, starred)
  return starred
}

/** React hook for live starred items */
export function useStarred() {
  const [starredSet, setSet] = useState<Set<string>>(() => new Set(getStarredSet()))

  useEffect(() => {
    const update = () => setSet(new Set(getStarredSet()))
    listeners.add(update)
    window.addEventListener('storage', update)
    return () => {
      listeners.delete(update)
      window.removeEventListener('storage', update)
    }
  }, [])

  return {
    starred: starredSet,
    count: starredSet.size,
    isStarred: (collectionId: string, itemId: string) => starredSet.has(`${collectionId}::${itemId}`),
    toggle: (collectionId: string, itemId: string) => toggleStarred(collectionId, itemId),
    setStarred: (collectionId: string, itemId: string, star: boolean) => setStarred(collectionId, itemId, star),
  }
}
