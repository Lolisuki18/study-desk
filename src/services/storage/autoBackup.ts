import { useSyncExternalStore } from 'react'
import type { BackupFile } from '../../types'
import { kvDel, kvGet, kvSet } from './db'

/**
 * Automatic backup to a file the user picks once (File System Access API, Chromium browsers only).
 * The file handle lives in IndexedDB; every change to the study data rewrites the file a few seconds later.
 * Browsers may ask for the write permission again in a new session: `needsPermission` then stays true
 * until the user clicks a button (the permission prompt needs a user gesture).
 */
const HANDLE_KEY = 'backupHandle'
const LAST_KEY = 'psh.lastBackupAt'
const DELAY_MS = 4000

export interface AutoBackupState {
  supported: boolean
  enabled: boolean
  fileName?: string
  needsPermission: boolean
  /** last successful backup of any kind (automatic or manual export), ISO */
  lastAt?: string
  error?: string
}

type Handle = {
  name: string
  queryPermission(o: { mode: 'readwrite' }): Promise<PermissionState>
  requestPermission(o: { mode: 'readwrite' }): Promise<PermissionState>
  createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>
}

const readLast = () => {
  try {
    return localStorage.getItem(LAST_KEY) ?? undefined
  } catch {
    return undefined
  }
}

let handle: Handle | null = null
let timer: ReturnType<typeof setTimeout> | undefined
let state: AutoBackupState = {
  supported: typeof window !== 'undefined' && 'showSaveFilePicker' in window,
  enabled: false,
  needsPermission: false,
  lastAt: typeof localStorage !== 'undefined' ? readLast() : undefined,
}
const listeners = new Set<() => void>()
const set = (patch: Partial<AutoBackupState>) => {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

/** Record that a backup was just made (also called after a manual export). */
export function markBackedUp() {
  const lastAt = new Date().toISOString()
  try {
    localStorage.setItem(LAST_KEY, lastAt)
  } catch {
    /* ignore */
  }
  set({ lastAt, error: undefined })
}

async function write(data: BackupFile) {
  if (!handle) return
  try {
    if ((await handle.queryPermission({ mode: 'readwrite' })) !== 'granted') {
      set({ needsPermission: true })
      return
    }
    const w = await handle.createWritable()
    await w.write(JSON.stringify(data, null, 2))
    await w.close()
    markBackedUp()
  } catch (e) {
    set({ error: (e as Error).message })
  }
}

/** Restore the saved file handle (if any) when the app starts. */
export async function initAutoBackup() {
  if (!state.supported) return
  try {
    handle = (await kvGet<Handle>(HANDLE_KEY)) ?? null
    if (!handle) return
    const perm = await handle.queryPermission({ mode: 'readwrite' })
    set({ enabled: true, fileName: handle.name, needsPermission: perm !== 'granted' })
  } catch (e) {
    set({ error: (e as Error).message })
  }
}

/** Ask the user for a backup file and write the first backup. Must be called from a click. */
export async function enableAutoBackup(data: BackupFile) {
  handle = await (window as unknown as { showSaveFilePicker(o: unknown): Promise<Handle> }).showSaveFilePicker({
    suggestedName: 'study-hub-backup.json',
    types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
  })
  await kvSet(HANDLE_KEY, handle)
  set({ enabled: true, fileName: handle.name, needsPermission: false, error: undefined })
  await write(data)
}

export async function disableAutoBackup() {
  clearTimeout(timer)
  handle = null
  await kvDel(HANDLE_KEY)
  set({ enabled: false, fileName: undefined, needsPermission: false, error: undefined })
}

/** Re-request the write permission. Must be called from a click. */
export async function grantAutoBackup(data: BackupFile) {
  if (!handle) return
  const perm = await handle.requestPermission({ mode: 'readwrite' })
  set({ needsPermission: perm !== 'granted' })
  if (perm === 'granted') await write(data)
}

/** Debounced write; a no-op unless auto-backup is on and permitted. */
export function scheduleAutoBackup(getData: () => BackupFile) {
  if (!handle || state.needsPermission) return
  clearTimeout(timer)
  timer = setTimeout(() => void write(getData()), DELAY_MS)
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
export const useAutoBackup = () => useSyncExternalStore(subscribe, () => state)
