import type { Collection, Entry, Item } from '../types'
import { validateCollection } from '../utils/validate'
import { getCustomCollections } from '../services/storage/customCollections'

/**
 * Every *.json file under src/data/collections/** is one collection.
 * Drop a new file in, and it shows up automatically. No code changes required.
 */
const modules = import.meta.glob('./collections/**/*.json', { eager: true, import: 'default' }) as Record<string, unknown>

export interface LoadReport {
  file: string
  id?: string
  ok: boolean
  errors: string[]
  warnings: string[]
}

export function loadCollections(mods: Record<string, unknown> = modules) {
  const collections: Collection[] = []
  const reports: LoadReport[] = []
  const ids = new Set<string>()
  for (const [file, raw] of Object.entries(mods).sort(([a], [b]) => a.localeCompare(b))) {
    const res = validateCollection(raw)
    const id = (raw as { id?: string } | null)?.id
    const errors = [...res.errors]
    if (id && ids.has(id)) errors.push(`duplicate collection id "${id}"`)
    reports.push({ file: file.replace('./collections/', ''), id, ok: errors.length === 0, errors, warnings: res.warnings })
    if (errors.length === 0) {
      ids.add(id!)
      collections.push(raw as Collection)
    }
  }
  return { collections, reports }
}

const loaded = loadCollections()
export const bundledCollections: Collection[] = loaded.collections
export const loadReports: LoadReport[] = loaded.reports

/** True when a collection with this id ships with the app (an uploaded deck must not reuse it). */
export const isBundledId = (id: string) => bundledCollections.some((c) => c.id === id)

export function getLoadedCollections(): Collection[] {
  // a custom deck with a bundled id would share progress with it, so the bundled one always wins
  const custom = getCustomCollections().filter((c) => !isBundledId(c.id))
  if (!custom.length) return bundledCollections
  return [...bundledCollections, ...custom]
}

export let collections: Collection[] = getLoadedCollections()

export function refreshDataCollections() {
  collections = getLoadedCollections()
}

export const getCollection = (id: string) => collections.find((c) => c.id === id)

export const allEntries = (list: Collection[] = collections): Entry[] =>
  list.flatMap((collection) => collection.items.map((item) => ({ collection, item })))

/** 'all' → every collection, otherwise one collection (empty if unknown). */
export const entriesFor = (id: string): Entry[] =>
  id === 'all' ? allEntries() : allEntries(collections.filter((c) => c.id === id))

/** Collections of a subject used for subject-wide mock exams and the readiness estimate (standalone decks excluded). */
export const examCollections = (subject: string) => collections.filter((c) => c.subject === subject && !c.standalone)
/** Standalone decks of a subject: studied on their own, not part of the subject's exam pool. */
export const standaloneCollections = (subject: string) => collections.filter((c) => c.subject === subject && c.standalone)

export const progressKey = (collectionId: string, itemId: string) => `${collectionId}::${itemId}`

/** Short human title for any item type. */
export function itemTitle(item: Item): string {
  switch (item.type) {
    case 'vocabulary':
      return item.content.term
    case 'multiple-choice':
      return item.content.question
    case 'true-false':
      return item.content.statement
    default:
      return item.content.concept
  }
}
