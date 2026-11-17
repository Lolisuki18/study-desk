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
