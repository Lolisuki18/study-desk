import { useState } from 'react'
import type { CardTheme, CardFont } from './ContinuousFeedView'

/** Read a string preference; localStorage can be blocked, so fall back quietly. */
function readPref<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T) || fallback
  } catch {
    return fallback
  }
}
function writePref(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore: the preference just won't survive a reload
  }
}

export type FontZoom = 'normal' | 'large' | 'xl'

/** The flashcard view preferences (layout, theme, font, English helpers), each saved in localStorage. */
export function useFlashcardPrefs() {
  const [fontZoom, setFontZoom] = useState<FontZoom>(() => readPref<FontZoom>('psh.fontzoom', 'normal'))
  const [viewMode, setViewMode] = useState<'flip' | 'feed'>(() => readPref<'flip' | 'feed'>('psh.flashcards.view_mode', 'flip'))
  const [cardTheme, setCardTheme] = useState<CardTheme>(() => readPref<CardTheme>('psh.card_theme', 'default'))
  const [cardFont, setCardFont] = useState<CardFont>(() => readPref<CardFont>('psh.card_font', 'sans'))
  const [autoPronounce, setAutoPronounce] = useState<boolean>(() => readPref<string>('psh.flashcards.auto_pronounce', 'false') === 'true')
  const [spellingMode, setSpellingMode] = useState<boolean>(() => readPref<string>('psh.flashcards.spelling_mode', 'false') === 'true')

  const toggleBool = (key: string, set: (f: (v: boolean) => boolean) => void) =>
    set((prev) => {
      const next = !prev
      writePref(key, String(next))
      return next
    })

  return {
    fontZoom,
    viewMode,
    setViewMode,
    cardTheme,
    cardFont,
    autoPronounce,
    spellingMode,
    toggleAutoPronounce: () => toggleBool('psh.flashcards.auto_pronounce', setAutoPronounce),
    toggleSpellingMode: () => toggleBool('psh.flashcards.spelling_mode', setSpellingMode),
    toggleViewMode: () => {
      const next = viewMode === 'flip' ? 'feed' : 'flip'
      setViewMode(next)
      writePref('psh.flashcards.view_mode', next)
    },
    changeTheme: (t: CardTheme) => {
      setCardTheme(t)
      writePref('psh.card_theme', t)
    },
    changeFont: (f: CardFont) => {
      setCardFont(f)
      writePref('psh.card_font', f)
    },
    cycleFontZoom: () => {
      const next: FontZoom = fontZoom === 'normal' ? 'large' : fontZoom === 'large' ? 'xl' : 'normal'
      setFontZoom(next)
      writePref('psh.fontzoom', next)
    },
  }
}
