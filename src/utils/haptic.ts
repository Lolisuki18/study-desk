/**
 * Lightweight haptic feedback utility using the Vibration API.
 * Falls back silently on desktop or unsupported devices.
 */

export type HapticPattern = 'light' | 'medium' | 'success' | 'error' | 'select'

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  select: 8,
  medium: 25,
  success: [15, 60, 15], // pleasant double pulse
  error: [30, 50, 30, 50, 40], // triple buzz for mistake
}

export function isHapticEnabled(): boolean {
  try {
    const val = localStorage.getItem('psh.haptic.enabled')
    return val !== 'false' // default enabled
  } catch {
    return true
  }
}

export function setHapticEnabled(enabled: boolean): void {
  try {
    localStorage.setItem('psh.haptic.enabled', enabled ? 'true' : 'false')
  } catch {}
}

export function haptic(pattern: HapticPattern = 'light'): void {
  if (typeof window === 'undefined') return
  if (!isHapticEnabled()) return
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(patterns[pattern])
    }
  } catch {
    // silently ignore errors on devices that block vibration without user gesture
  }
}
