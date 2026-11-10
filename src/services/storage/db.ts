import type { ActivityRecord, ExamRecord, ProgressRecord } from '../../types'

const DB_NAME = 'personal-study-hub'
const DB_VERSION = 2
const PROGRESS = 'progress'
const ACTIVITY = 'activity'
const EXAMS = 'exams'

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
      }
      req.onsuccess = () => resolve(req.result)
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

export async function loadAll(): Promise<{ progress: ProgressRecord[]; activity: ActivityRecord[]; exams: ExamRecord[] }> {
  const db = await open()
  const tx = db.transaction([PROGRESS, ACTIVITY, EXAMS], 'readonly')
  const [progress, activity, exams] = await Promise.all([
    reqP(tx.objectStore(PROGRESS).getAll() as IDBRequest<ProgressRecord[]>),
    reqP(tx.objectStore(ACTIVITY).getAll() as IDBRequest<ActivityRecord[]>),
    reqP(tx.objectStore(EXAMS).getAll() as IDBRequest<ExamRecord[]>),
  ])
  return { progress, activity, exams }
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

export async function replaceAll(progress: ProgressRecord[], activity: ActivityRecord[], exams: ExamRecord[] = []) {
  const db = await open()
  const tx = db.transaction([PROGRESS, ACTIVITY, EXAMS], 'readwrite')
  tx.objectStore(PROGRESS).clear()
  tx.objectStore(ACTIVITY).clear()
  tx.objectStore(EXAMS).clear()
  progress.forEach((r) => tx.objectStore(PROGRESS).put(r))
  activity.forEach(({ id: _id, ...r }) => tx.objectStore(ACTIVITY).add(r))
  exams.forEach(({ id: _id, ...r }) => tx.objectStore(EXAMS).add(r))
  await done(tx)
}

export const clearAll = () => replaceAll([], [], [])
