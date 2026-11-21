/**
 * Durable storage. By default a browser may delete a site's data (IndexedDB included) when the device runs low on
 * space. "Persistent" storage opts out of that. Chromium decides silently (installed apps and frequently used sites
 * are usually granted), Firefox asks the user, so the request is made once the learner has really started studying.
 */

const ASKED_KEY = 'psh.persist.asked'

export interface StorageStatus {
  supported: boolean
  persisted: boolean
  /** bytes used by this site / the share the browser allows it */
  usage?: number
  quota?: number
}

export async function storageStatus(): Promise<StorageStatus> {
  if (typeof navigator === 'undefined' || !navigator.storage) return { supported: false, persisted: false }
  try {
    const [persisted, est] = await Promise.all([navigator.storage.persisted?.() ?? Promise.resolve(false), navigator.storage.estimate?.() ?? Promise.resolve({} as StorageEstimate)])
    return { supported: true, persisted, usage: est.usage, quota: est.quota }
  } catch {
    return { supported: true, persisted: false }
  }
}

/** Ask for persistent storage. Resolves to whether it is (now) persistent. */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted?.()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

/** Once per browser, the first time the learner answers something. */
export function requestPersistenceOnce(): void {
  try {
    if (localStorage.getItem(ASKED_KEY)) return
    localStorage.setItem(ASKED_KEY, '1')
  } catch {
    /* no localStorage: ask anyway, once per page */
  }
  void requestPersistence()
}

export function formatBytes(n?: number): string {
  if (n === undefined) return '—'
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`
}
