import { useSyncExternalStore } from 'react'
import { dayKey } from '../utils'
import { loadSettings } from './storage/settings'

/**
 * Pomodoro timer shared by every widget on the page. State is kept in localStorage, so the countdown
 * survives a reload; it is stored as an end time, not a tick count, so it stays right in a background tab.
 */
export type Phase = 'work' | 'break'
export interface PomodoroState {
  phase: Phase
  running: boolean
  /** ms left in the current phase (live while running) */
  remainingMs: number
  /** focus sessions finished today */
  doneToday: number
}

const STATE_KEY = 'psh.pomodoro'
const LOG_KEY = 'psh.pomodoro.log'
const MIN = 60_000

interface Saved {
  phase: Phase
  /** set while running */
  endsAt?: number
  /** set while paused */
  remainingMs?: number
}

const read = <T,>(key: string, fallback: T): T => {
  try {
    return (JSON.parse(localStorage.getItem(key) ?? 'null') as T) ?? fallback
  } catch {
    return fallback
  }
}
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

const length = (phase: Phase) => {
  const s = loadSettings()
  return Math.max(1, phase === 'work' ? s.pomodoroWork : s.pomodoroBreak) * MIN
}

/** focus sessions per day: { 'YYYY-MM-DD': { count, minutes } } */
export type PomodoroLog = Record<string, { count: number; minutes: number }>
export const pomodoroLog = (): PomodoroLog => read<PomodoroLog>(LOG_KEY, {})

function logFocus(minutes: number) {
  const log = pomodoroLog()
  const k = dayKey(new Date())
  const d = log[k] ?? { count: 0, minutes: 0 }
  log[k] = { count: d.count + 1, minutes: d.minutes + minutes }
  write(LOG_KEY, log)
}

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    ;[0, 0.25, 0.5].forEach((t) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.15, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.18)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.2)
    })
    setTimeout(() => void ctx.close(), 1500)
  } catch {
    /* sound is optional */
  }
}

let saved: Saved = { phase: 'work' }
let state: PomodoroState = { phase: 'work', running: false, remainingMs: 0, doneToday: 0 }
let timer: ReturnType<typeof setInterval> | undefined
let started = false
const listeners = new Set<() => void>()

function publish() {
  const remainingMs = saved.endsAt !== undefined ? Math.max(0, saved.endsAt - Date.now()) : saved.remainingMs ?? length(saved.phase)
  state = { phase: saved.phase, running: saved.endsAt !== undefined, remainingMs, doneToday: pomodoroLog()[dayKey(new Date())]?.count ?? 0 }
  listeners.forEach((l) => l())
}

function persist(next: Saved) {
  saved = next
  write(STATE_KEY, saved)
  if (saved.endsAt !== undefined && !timer) timer = setInterval(tick, 500)
  if (saved.endsAt === undefined && timer) {
    clearInterval(timer)
    timer = undefined
  }
  publish()
}

/** A phase ran out: log a finished focus session, then start the break (or stop after a break). */
function complete(silent = false) {
  const finished = saved.phase
  if (finished === 'work') logFocus(Math.round(length('work') / MIN))
  if (!silent) beep()
  // after focus the break starts by itself; after the break the timer waits for you
  persist(finished === 'work' && !silent ? { phase: 'break', endsAt: Date.now() + length('break') } : { phase: 'work' })
}

function tick() {
  if (saved.endsAt !== undefined && Date.now() >= saved.endsAt) complete()
  else publish()
}

function ensureStarted() {
  if (started) return
  started = true
  saved = read<Saved>(STATE_KEY, { phase: 'work' })
  // a phase that ended while the app was closed counts as finished, without the sound
  if (saved.endsAt !== undefined && Date.now() >= saved.endsAt) complete(true)
  else persist(saved)
}

export const pomodoro = {
  toggle() {
    if (saved.endsAt !== undefined) persist({ phase: saved.phase, remainingMs: Math.max(0, saved.endsAt - Date.now()) })
    else persist({ phase: saved.phase, endsAt: Date.now() + (saved.remainingMs ?? length(saved.phase)) })
  },
  /** back to a fresh focus session, stopped */
  reset() {
    persist({ phase: 'work' })
  },
  /** jump to the other phase without logging the current one */
  skip() {
    persist({ phase: saved.phase === 'work' ? 'break' : 'work' })
  },
  /** re-read the lengths after the settings changed (only affects a phase that has not started) */
  refresh: publish,
}

const subscribe = (l: () => void) => {
  ensureStarted()
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
export const usePomodoro = () =>
  useSyncExternalStore(subscribe, () => {
    ensureStarted()
    return state
  })

export const fmtClock = (ms: number) => {
  const s = Math.ceil(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
