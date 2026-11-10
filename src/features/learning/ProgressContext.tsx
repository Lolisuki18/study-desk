import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ActivityKind, ActivityRecord, BackupFile, ExamRecord, ProgressRecord } from '../../types'
import * as db from '../../services/storage/db'
import { applyResult, emptyProgress, isMastered, isStudied, reviewReasons } from '../../services/review/srs'
import { collections, progressKey } from '../../data'

interface Ctx {
  loaded: boolean
  progress: Map<string, ProgressRecord>
  activity: ActivityRecord[]
  exams: ExamRecord[]
  addExam: (e: Omit<ExamRecord, 'id'>) => void
  /** wipe progress, activity and exam history of one collection */
  resetCollection: (collectionId: string) => Promise<void>
  get: (collectionId: string, itemId: string) => ProgressRecord | undefined
  /** record a right/wrong outcome (SRS update + activity log) */
  record: (
    results: { collectionId: string; itemId: string; correct: boolean }[],
    kind: ActivityKind,
    opts?: { clearReview?: boolean },
  ) => void
  toggleReview: (collectionId: string, itemId: string) => void
  exportBackup: () => BackupFile
  importBackup: (b: BackupFile) => Promise<void>
  resetAll: () => Promise<void>
  summary: Summary
}

export interface Summary {
  collections: number
  items: number
  studied: number
  mastered: number
  needReview: number
  dueCount: number
}

const ProgressCtx = createContext<Ctx | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false)
  const [progress, setProgress] = useState<Map<string, ProgressRecord>>(new Map())
  const [activity, setActivity] = useState<ActivityRecord[]>([])
  const [exams, setExams] = useState<ExamRecord[]>([])
  const ref = useRef(progress)
  ref.current = progress

  useEffect(() => {
    db.loadAll()
      .then((d) => {
        setProgress(new Map(d.progress.map((p) => [p.key, p])))
        setActivity(d.activity)
        setExams(d.exams)
      })
      .catch(console.error)
      .finally(() => setLoaded(true))
  }, [])

  const get = useCallback((c: string, i: string) => ref.current.get(progressKey(c, i)), [])

  const record: Ctx['record'] = useCallback((results, kind, opts) => {
    const next = new Map(ref.current)
    const changed: ProgressRecord[] = []
    const acts: ActivityRecord[] = []
    const ts = new Date().toISOString()
    for (const r of results) {
      const k = progressKey(r.collectionId, r.itemId)
      const upd = applyResult(next.get(k) ?? emptyProgress(r.collectionId, r.itemId), r.correct, opts)
      next.set(k, upd)
      changed.push(upd)
      acts.push({ ts, collectionId: r.collectionId, itemId: r.itemId, kind, result: r.correct ? 'correct' : 'incorrect' })
    }
    ref.current = next
    setProgress(next)
    db.putProgress(changed).catch(console.error)
    db.addActivity(acts)
      .then((saved) => setActivity((a) => [...a, ...saved]))
      .catch(console.error)
  }, [])

  const toggleReview: Ctx['toggleReview'] = useCallback((c, i) => {
    const k = progressKey(c, i)
    const cur = ref.current.get(k) ?? emptyProgress(c, i)
    const upd = { ...cur, review: !cur.review }
    const next = new Map(ref.current).set(k, upd)
    ref.current = next
    setProgress(next)
    db.putProgress([upd]).catch(console.error)
  }, [])

  const exportBackup = useCallback(
    (): BackupFile => ({
      app: 'personal-study-hub',
      version: 1,
      exportedAt: new Date().toISOString(),
      progress: [...ref.current.values()],
      activity,
      exams,
    }),
    [activity, exams],
  )

  const importBackup = useCallback(async (b: BackupFile) => {
    if (b?.app !== 'personal-study-hub' || !Array.isArray(b.progress)) throw new Error('File sao lưu không hợp lệ')
    await db.replaceAll(b.progress, b.activity ?? [], b.exams ?? [])
    const d = await db.loadAll()
    const m = new Map(d.progress.map((p) => [p.key, p]))
    ref.current = m
    setProgress(m)
    setActivity(d.activity)
    setExams(d.exams)
  }, [])

  const resetAll = useCallback(async () => {
    await db.clearAll()
    ref.current = new Map()
    setProgress(new Map())
    setActivity([])
    setExams([])
  }, [])

  const addExam: Ctx['addExam'] = useCallback((e) => {
    db.addExam(e)
      .then((saved) => setExams((x) => [...x, saved]))
      .catch(console.error)
  }, [])

  const resetCollection = useCallback(async (collectionId: string) => {
    const d = await db.loadAll()
    const keep = d.progress.filter((p) => p.collectionId !== collectionId)
    await db.replaceAll(
      keep,
      d.activity.filter((a) => a.collectionId !== collectionId),
      d.exams.filter((x) => x.collectionId !== collectionId),
    )
    const nd = await db.loadAll()
    const m = new Map(nd.progress.map((p) => [p.key, p]))
    ref.current = m
    setProgress(m)
    setActivity(nd.activity)
    setExams(nd.exams)
  }, [])

  const summary = useMemo<Summary>(() => {
    const now = new Date()
    let items = 0
    let studied = 0
    let mastered = 0
    let needReview = 0
    let dueCount = 0
    for (const c of collections)
      for (const it of c.items) {
        items++
        const p = progress.get(progressKey(c.id, it.id))
        if (isStudied(p)) studied++
        if (isMastered(p)) mastered++
        const reasons = reviewReasons(p, now)
        if (reasons.length) needReview++
        if (reasons.includes('due')) dueCount++
      }
    return { collections: collections.length, items, studied, mastered, needReview, dueCount }
  }, [progress])

  const value = useMemo(
    () => ({ loaded, progress, activity, exams, addExam, resetCollection, get, record, toggleReview, exportBackup, importBackup, resetAll, summary }),
    [loaded, progress, activity, exams, addExam, resetCollection, get, record, toggleReview, exportBackup, importBackup, resetAll, summary],
  )
  return <ProgressCtx.Provider value={value}>{children}</ProgressCtx.Provider>
}

export function useProgress() {
  const c = useContext(ProgressCtx)
  if (!c) throw new Error('useProgress outside provider')
  return c
}

export function collectionStats(collectionId: string, itemIds: string[], progress: Map<string, ProgressRecord>) {
  let mastered = 0
  let studied = 0
  let need = 0
  const now = new Date()
  for (const id of itemIds) {
    const p = progress.get(progressKey(collectionId, id))
    if (isMastered(p)) mastered++
    if (isStudied(p)) studied++
    if (reviewReasons(p, now).length) need++
  }
  return { total: itemIds.length, mastered, studied, need }
}
