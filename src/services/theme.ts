import type { Accent, Theme } from '../types'

const media = () => window.matchMedia('(prefers-color-scheme: dark)')
let current: Theme = 'light'

const isDark = (t: Theme) => t === 'dark' || t === 'oled' || (t === 'system' && media().matches)

/**
 * Run a DOM change as one smooth cross-fade of the whole page.
 * Where the browser has View Transitions the page is snapshotted and faded to the new look as a single image, so
 * every surface changes together. Otherwise a short class fades colours on all elements at the same pace. Either way
 * the per-element `transition-all` classes are paused meanwhile, because a few of them run (150 ms on buttons) and
 * most do not, which is what made the switch look uneven.
 */
function crossFade(change: () => void) {
  const root = document.documentElement
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const startViewTransition = (document as unknown as { startViewTransition?: (cb: () => void) => { finished: Promise<void> } }).startViewTransition

  if (reduceMotion) {
    change()
  } else if (startViewTransition) {
    root.classList.add('theme-switching')
    const t = startViewTransition.call(document, change)
    const done = () => root.classList.remove('theme-switching')
    t.finished.then(done, done)
  } else {
    root.classList.add('theme-fade')
    change()
    setTimeout(() => root.classList.remove('theme-fade'), 350)
  }
}

/**
 * Apply a theme by toggling `html.dark` (the dark palette lives in src/index.css).
 * `animate` cross-fades the change; leave it off at startup so the page never fades in from the wrong palette.
 */
export function applyTheme(theme: Theme, opts: { animate?: boolean } = {}) {
  current = theme
  if (opts.animate) crossFade(() => paint(theme))
  else paint(theme)
}

function paint(theme: Theme) {
  const dark = isDark(theme)
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  if (theme === 'sepia') {
    document.documentElement.dataset.extraTheme = 'sepia'
  } else if (theme === 'oled') {
    document.documentElement.dataset.extraTheme = 'oled'
  } else {
    delete document.documentElement.dataset.extraTheme
  }

  // one meta per colour scheme in index.html; the one the browser uses must follow the in-app choice too
  const metaColor = theme === 'oled' ? '#000000' : theme === 'sepia' ? '#f7f2e7' : dark ? '#0b1120' : '#ffffff'
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', metaColor))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme, dark } }))
  }
}

/** Follow the operating-system setting while the theme is 'system'. Call once at startup. */
export function watchSystemTheme() {
  media().addEventListener('change', () => {
    if (current === 'system') applyTheme('system', { animate: true })
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
