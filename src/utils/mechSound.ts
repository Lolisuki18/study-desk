/**
 * Mechanical keyboard clicks & achievement fanfare synthesized via Web Audio API.
 * 100% offline, zero audio asset files.
 */

import { getSoundVolume, isSoundEnabled } from './sound'

export type MechSoundType = 'keydown' | 'keyup' | 'enter' | 'space'

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioCtx) {
      audioCtx = new AudioCtx()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

export function isMechSoundEnabled(): boolean {
  try {
    const val = localStorage.getItem('psh.mechsound.enabled')
    return val === 'true' // default off unless enabled in settings
  } catch {
    return false
  }
}

export function setMechSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem('psh.mechsound.enabled', enabled ? 'true' : 'false')
  } catch {}
}

/** Play a tactile mechanical key switch click */
export function playMechSound(type: MechSoundType = 'keydown'): void {
  if (!isSoundEnabled() || !isMechSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return

  const vol = getSoundVolume() * 0.4
  if (vol <= 0) return

  const now = ctx.currentTime

  if (type === 'keydown') {
    // Sharp tactile switch click (Cherry MX Blue style)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(3200, now)
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.015)

    gain.gain.setValueAtTime(vol * 0.6, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.02)
  } else if (type === 'keyup') {
    // Softer release click
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1800, now)
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.012)

    gain.gain.setValueAtTime(vol * 0.35, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.012)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.015)
  } else if (type === 'enter') {
    // Deeper bottom-out thud with slight resonance
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(450, now)
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.04)

    gain.gain.setValueAtTime(vol * 0.8, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.05)
  } else if (type === 'space') {
    // Wide stabilizer bar clack
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(650, now)
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.035)

    gain.gain.setValueAtTime(vol * 0.7, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.045)
  }
}

/** Triumphant level-up arpeggio with sparkle */
export function playLevelUp(): void {
  if (!isSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return

  const vol = getSoundVolume()
  if (vol <= 0) return

  const now = ctx.currentTime
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51] // C5, E5, G5, C6, E6

  notes.forEach((freq, idx) => {
    const start = now + idx * 0.08
    const dur = 0.28
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, start)

    gain.gain.setValueAtTime(0.09 * vol, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + dur)
  })
}

/** Grand perfect score fanfare */
export function playPerfectScore(): void {
  if (!isSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return

  const vol = getSoundVolume()
  if (vol <= 0) return

  const now = ctx.currentTime
  // 3-chord triumphant brass progression
  const chords = [
    { notes: [523.25, 659.25, 783.99], time: 0, dur: 0.25 }, // C
    { notes: [587.33, 739.99, 880.00], time: 0.28, dur: 0.25 }, // D
    { notes: [659.25, 830.61, 987.77], time: 0.58, dur: 0.7 }, // E (E, G#, B)
  ]

  chords.forEach(({ notes, time, dur }) => {
    notes.forEach((freq) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const start = now + time

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(0.045 * vol, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + dur)
    })
  })
}
