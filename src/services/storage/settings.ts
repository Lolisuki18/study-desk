import type { Settings } from '../../types'

const KEY = 'psh.settings'
export const defaultSettings: Settings = {
  shuffleFlashcards: false,
  quizCount: 20,
  quizPracticeDefault: true,
  examDates: {},
  dailyGoal: 30,
  examPresets: {},
  theme: 'light',
  learnUntilKnown: true,
  pomodoroWork: 25,
  pomodoroBreak: 5,
}

export function loadSettings(): Settings {
  try {
    // Migration: nếu chưa từng migrate sang light mode mặc định, hoặc theme đang là system, ép về light
    const migrationKey = 'psh.theme.force_light_default_v3'
    if (typeof window !== 'undefined' && !localStorage.getItem(migrationKey)) {
      localStorage.setItem(migrationKey, 'true')
      const raw = localStorage.getItem(KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        parsed.theme = 'light'
        localStorage.setItem(KEY, JSON.stringify(parsed))
        return { ...defaultSettings, ...parsed, theme: 'light' }
      }
    }

    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return { ...defaultSettings, ...saved }
  } catch {
    return defaultSettings
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}
