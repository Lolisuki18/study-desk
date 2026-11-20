import { useSyncExternalStore } from 'react'

/**
 * Zen / distraction-free focus mode.
 * `html.zen-mode` hides the sidebar, header and bottom navigation (see src/index.css) and, where the browser allows
 * it, the page also goes fullscreen. This module is the single source of truth: components read it with `useZen()`
 * instead of keeping their own copy, so leaving fullscreen with Esc cannot leave a button showing the wrong state.
 */

let zenActive = false
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((fn) => fn())

export function isZenMode(): boolean {
  return zenActive
}

export function enterZen(): void {
  if (zenActive) return
  zenActive = true
  document.documentElement.classList.add('zen-mode')

  // Fullscreen is a bonus: it can be refused (no user gesture, iOS Safari...), the hidden chrome works without it.
  if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {})
  }
  emit()
}

export function exitZen(): void {
  if (!zenActive) return
  zenActive = false
  document.documentElement.classList.remove('zen-mode')

  if (document.exitFullscreen && document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
  emit()
}

export function toggleZen(): boolean {
  if (zenActive) exitZen()
  else enterZen()
  return zenActive
}

const subscribe = (callback: () => void) => {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

/** Re-renders the component whenever zen mode is entered or left, from anywhere. */
export const useZen = () => useSyncExternalStore(subscribe, isZenMode, () => false)

// Esc (or any other way of leaving fullscreen) also leaves zen mode.
if (typeof document !== 'undefined') {
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && zenActive) exitZen()
  })
}
