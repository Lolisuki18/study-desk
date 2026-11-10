import type { Settings } from '../../types'

const KEY = 'psh.settings'
export const defaultSettings: Settings = { shuffleFlashcards: false, quizCount: 20, quizPracticeDefault: true, examDates: {} }

export function loadSettings(): Settings {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
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
