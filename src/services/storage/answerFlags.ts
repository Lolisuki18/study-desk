import { useSyncExternalStore } from 'react'

/**
 * The learner's own verdict on a question's answer key.
 * 'suspect'  = "I think the key in the deck is wrong" (collected under the Search filter "Nghi vấn")
 * 'verified' = "I checked the textbook and the key is right"
 * Stored apart from the deck content (which is never edited), keyed `collectionId::itemId` like progress.
 */
export type FlagStatus = 'suspect' | 'verified'

export interface AnswerFlag {
  status: FlagStatus
  at: string
}

export type AnswerFlags = Record<string, AnswerFlag>

const STORAGE_KEY = 'psh.answer_flags'
const EVENT = 'answer-flags-changed'

let cache: AnswerFlags | null = null
let version = 0
const listeners = new Set<() => void>()

function load(): AnswerFlags {
  if (cache) return cache
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    cache = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  } catch {
    cache = {}
  }
  return cache ?? {}
}

function save(map: AnswerFlags): void {
  cache = map
  version++
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* storage full or blocked: the flags then last until the page closes */
  }
  listeners.forEach((l) => l())
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVENT))
}

export const getAnswerFlag = (key: string): AnswerFlag | undefined => load()[key]

/** Set the verdict for a question, or pass null to clear it. */
export function setAnswerFlag(key: string, status: FlagStatus | null): void {
  const map = { ...load() }
  if (status) map[key] = { status, at: new Date().toISOString() }
  else delete map[key]
  save(map)
}

export const getAllAnswerFlags = (): AnswerFlags => ({ ...load() })

/** Replace everything (restore from a backup); entries that are not valid flags are dropped. */
export function replaceAllAnswerFlags(map: AnswerFlags): void {
  const clean: AnswerFlags = {}
  for (const [k, v] of Object.entries(map ?? {})) if (v && (v.status === 'suspect' || v.status === 'verified')) clean[k] = { status: v.status, at: String(v.at ?? '') }
  save(clean)
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

/** The flag of one question; the component re-renders when it changes. */
export const useAnswerFlag = (key: string) => useSyncExternalStore(subscribe, () => getAnswerFlag(key))

/** A number that changes whenever any flag changes, for lists that depend on all of them. */
export const useAnswerFlagsVersion = () => useSyncExternalStore(subscribe, () => version)
