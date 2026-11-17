import type { Theme } from '../types'

const media = () => window.matchMedia('(prefers-color-scheme: dark)')
let current: Theme = 'light'

const isDark = (t: Theme) => t === 'dark' || (t === 'system' && media().matches)

/** Apply a theme by toggling `html.dark` (the dark palette lives in src/index.css). */
export function applyTheme(theme: Theme) {
  current = theme
  const dark = isDark(theme)
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b1120' : '#ffffff')
}

/** Follow the operating-system setting while the theme is 'system'. Call once at startup. */
export function watchSystemTheme() {
  media().addEventListener('change', () => {
    if (current === 'system') applyTheme('system')
  })
}

export const isDarkNow = () => document.documentElement.classList.contains('dark')
