/**
 * Typography management: switch between Modern Sans and Classic Book Serif.
 */

export type ReadingFont = 'sans' | 'serif'

const FONTS: Record<ReadingFont, string> = {
  sans: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
  serif: '"Merriweather", "Lora", "Georgia", "Cambria", "Times New Roman", serif',
}

const STORAGE_KEY = 'psh.reading.font'

export function getReadingFont(): ReadingFont {
  try {
    const val = localStorage.getItem(STORAGE_KEY)
    return (val as ReadingFont) === 'serif' ? 'serif' : 'sans'
  } catch {
    return 'sans'
  }
}

export function setReadingFont(font: ReadingFont): void {
  try {
    localStorage.setItem(STORAGE_KEY, font)
  } catch {}
  applyReadingFont(font)
}

export function applyReadingFont(font?: ReadingFont): void {
  if (typeof document === 'undefined') return
  const f = font || getReadingFont()
  document.documentElement.style.setProperty('--font-sans', FONTS[f])
  document.documentElement.setAttribute('data-reading-font', f)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('reading-font-changed', { detail: { font: f } }))
  }
}

export function initReadingFont(): void {
  applyReadingFont(getReadingFont())
}
