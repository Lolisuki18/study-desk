import type { Accent, Theme } from '../types'

const media = () => window.matchMedia('(prefers-color-scheme: dark)')
let current: Theme = 'light'

const isDark = (t: Theme) => t === 'dark' || (t === 'system' && media().matches)

/** Apply a theme by toggling `html.dark` (the dark palette lives in src/index.css). */
export function applyTheme(theme: Theme) {
  current = theme
  const dark = isDark(theme)
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  // one meta per colour scheme in index.html; the one the browser uses must follow the in-app choice too
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', dark ? '#0b1120' : '#ffffff'))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme, dark } }))
  }
}

/** Follow the operating-system setting while the theme is 'system'. Call once at startup. */
export function watchSystemTheme() {
  media().addEventListener('change', () => {
    if (current === 'system') applyTheme('system')
  })
}

export const isDarkNow = () => document.documentElement.classList.contains('dark')

export const ACCENTS: { id: Accent; label: string; swatch: string }[] = [
  { id: 'indigo', label: 'Chàm (mặc định)', swatch: '#4f46e5' },
  { id: 'violet', label: 'Tím', swatch: '#7c3aed' },
  { id: 'sky', label: 'Xanh da trời', swatch: '#0284c7' },
  { id: 'teal', label: 'Xanh ngọc', swatch: '#0d9488' },
  { id: 'pink', label: 'Hồng', swatch: '#db2777' },
]

/** Apply the accent colour: `html[data-accent]` remaps the indigo palette in src/index.css. */
export function applyAccent(accent: Accent | undefined) {
  const a = ACCENTS.some((x) => x.id === accent) ? accent! : 'indigo'
  if (a === 'indigo') delete document.documentElement.dataset.accent
  else document.documentElement.dataset.accent = a
}
