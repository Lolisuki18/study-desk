import type { ActivityRecord, ExamRecord, NoteRecord, ProgressRecord } from '../../types'

const DB_NAME = 'personal-study-hub'
const DB_VERSION = 3
const PROGRESS = 'progress'
const ACTIVITY = 'activity'
const EXAMS = 'exams'
const NOTES = 'notes'
/** small key → value store (e.g. the auto-backup file handle) */
const KV = 'kv'

let dbPromise: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(PROGRESS)) db.createObjectStore(PROGRESS, { keyPath: 'key' })
        if (!db.objectStoreNames.contains(ACTIVITY)) db.createObjectStore(ACTIVITY, { keyPath: 'id', autoIncrement: true })
        if (!db.objectStoreNames.contains(EXAMS)) db.createObjectStore(EXAMS, { keyPath: 'id', autoIncrement: true })
        if (!db.objectStoreNames.contains(NOTES)) db.createObjectStore(NOTES, { keyPath: 'key' })
        if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV)
      }
      req.onsuccess = () => {
        // let a newer version of the app (opened in another tab) upgrade the database instead of blocking it
        req.result.onversionchange = () => {
          req.result.close()
          dbPromise = null
        }
        resolve(req.result)
      }
      req.onerror = () => reject(req.error)
    })
  }
  return dbPromise
}

const done = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })

const reqP = <T>(r: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })

export async function loadAll(): Promise<{
  progress: ProgressRecord[]
  activity: ActivityRecord[]
  exams: ExamRecord[]
  notes: NoteRecord[]
}> {
  const db = await open()
  const tx = db.transaction([PROGRESS, ACTIVITY, EXAMS, NOTES], 'readonly')
  const [progress, activity, exams, notes] = await Promise.all([
    reqP(tx.objectStore(PROGRESS).getAll() as IDBRequest<ProgressRecord[]>),
    reqP(tx.objectStore(ACTIVITY).getAll() as IDBRequest<ActivityRecord[]>),
    reqP(tx.objectStore(EXAMS).getAll() as IDBRequest<ExamRecord[]>),
    reqP(tx.objectStore(NOTES).getAll() as IDBRequest<NoteRecord[]>),
  ])
  return { progress, activity, exams, notes }
}

export async function addExam(e: ExamRecord): Promise<ExamRecord> {
  const db = await open()
  const tx = db.transaction(EXAMS, 'readwrite')
  const req = tx.objectStore(EXAMS).add(e)
  await done(tx)
  return { ...e, id: req.result as number }
}

export async function putProgress(records: ProgressRecord[]) {
  if (!records.length) return
  const db = await open()
  const tx = db.transaction(PROGRESS, 'readwrite')
  records.forEach((r) => tx.objectStore(PROGRESS).put(r))
  await done(tx)
}

export async function addActivity(records: ActivityRecord[]): Promise<ActivityRecord[]> {
  if (!records.length) return []
  const db = await open()
  const tx = db.transaction(ACTIVITY, 'readwrite')
  const store = tx.objectStore(ACTIVITY)
  const out: ActivityRecord[] = []
  const reqs = records.map((r) => {
    const req = store.add(r)
    req.onsuccess = () => out.push({ ...r, id: req.result as number })
    return req
  })
  await done(tx)
  void reqs
  return out
}

/** Save a note, or delete it when `note` is only a key. */
export async function putNote(note: NoteRecord | { key: string; text?: undefined }) {
  const db = await open()
  const tx = db.transaction(NOTES, 'readwrite')
  if (note.text === undefined) tx.objectStore(NOTES).delete(note.key)
  else tx.objectStore(NOTES).put(note)
  await done(tx)
}

/** Replace progress, activity and exams. Notes are replaced only when `notes` is given, otherwise kept. */
export async function replaceAll(progress: ProgressRecord[], activity: ActivityRecord[], exams: ExamRecord[] = [], notes?: NoteRecord[]) {
  const db = await open()
  const tx = db.transaction([PROGRESS, ACTIVITY, EXAMS, NOTES], 'readwrite')
  tx.objectStore(PROGRESS).clear()
  tx.objectStore(ACTIVITY).clear()
  tx.objectStore(EXAMS).clear()
  progress.forEach((r) => tx.objectStore(PROGRESS).put(r))
  activity.forEach(({ id: _id, ...r }) => tx.objectStore(ACTIVITY).add(r))
  exams.forEach(({ id: _id, ...r }) => tx.objectStore(EXAMS).add(r))
  if (notes) {
    tx.objectStore(NOTES).clear()
    notes.forEach((n) => tx.objectStore(NOTES).put(n))
  }
  await done(tx)
}

/** Wipe progress, activity and exam history. Personal notes are kept. */
export const clearAll = () => replaceAll([], [], [])

export async function kvGet<T>(key: string): Promise<T | undefined> {
  const db = await open()
  return reqP(db.transaction(KV, 'readonly').objectStore(KV).get(key) as IDBRequest<T | undefined>)
}

export async function kvSet(key: string, value: unknown) {
  const db = await open()
  const tx = db.transaction(KV, 'readwrite')
  tx.objectStore(KV).put(value, key)
  await done(tx)
}

export async function kvDel(key: string) {
  const db = await open()
  const tx = db.transaction(KV, 'readwrite')
  tx.objectStore(KV).delete(key)
  await done(tx)
}
