import type { Collection, Entry, Item } from '../types'
import { validateCollection } from '../utils/validate'

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
    const id = (raw as any)?.id as string | undefined
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
export const collections: Collection[] = loaded.collections
export const loadReports: LoadReport[] = loaded.reports

export const getCollection = (id: string) => collections.find((c) => c.id === id)

export const allEntries = (list: Collection[] = collections): Entry[] =>
  list.flatMap((collection) => collection.items.map((item) => ({ collection, item })))

/** 'all' → every collection, otherwise one collection (empty if unknown). */
export const entriesFor = (id: string): Entry[] =>
  id === 'all' ? allEntries() : allEntries(collections.filter((c) => c.id === id))

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
