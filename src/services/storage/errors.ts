/**
 * Writing to the browser's storage can fail (disk or quota full, private mode, storage blocked), and the data would
 * then be lost on the next reload without anyone noticing. Failures are announced here; the layout shows a warning.
 */
export const STORAGE_ERROR_EVENT = 'psh-storage-error'

/** Use as `.catch(reportStorageError)` on a storage write. */
export function reportStorageError(error: unknown): void {
  console.error(error)
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: { message: error instanceof Error ? error.message : String(error) } }))
}
