/**
 * Web Audio API synthesized sound effects.
 * Lightweight, zero external audio asset dependencies.
 */

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

export function isSoundEnabled(): boolean {
  try {
    const val = localStorage.getItem('psh.sound.enabled')
    return val !== 'false' // default enabled
  } catch {
    return true
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem('psh.sound.enabled', enabled ? 'true' : 'false')
  } catch {}
}

export function getSoundVolume(): number {
  try {
    const val = localStorage.getItem('psh.sound.volume')
    return val !== null ? Math.max(0, Math.min(1, Number(val))) : 0.7
  } catch {
    return 0.7
  }
}

export function setSoundVolume(volume: number): void {
  try {
    const v = Math.max(0, Math.min(1, volume))
    localStorage.setItem('psh.sound.volume', String(v))
  } catch {}
}

export type SoundType = 'correct' | 'wrong' | 'flip' | 'fanfare' | 'click' | 'bell'

export function playSound(type: SoundType) {
  if (!isSoundEnabled()) return
  const ctx = getAudioContext()
  if (!ctx) return

  const vol = getSoundVolume()
  if (vol <= 0) return

  const now = ctx.currentTime

  if (type === 'click') {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, now)
    gain.gain.setValueAtTime(0.04 * vol, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.05)
  } else if (type === 'flip') {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(300, now)
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08)
    gain.gain.setValueAtTime(0.05 * vol, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.08)
  } else if (type === 'correct') {
    // 2-tone bright chime (C5 -> G5)
    const playTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0.08 * vol, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + dur)
    }
    playTone(523.25, now, 0.12) // C5
    playTone(783.99, now + 0.08, 0.22) // G5
  } else if (type === 'wrong') {
    // Low double blip
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(180, now)
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.18)
    gain.gain.setValueAtTime(0.06 * vol, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.18)
  } else if (type === 'bell') {
    // 3 pleasant bell pulses (E5 -> A5)
    ;[0, 0.25, 0.5].forEach((t) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, now + t)
      gain.gain.setValueAtTime(0.12 * vol, now + t)
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.2)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + t)
      osc.stop(now + t + 0.22)
    })
  } else if (type === 'fanfare') {
    // 4-note celebration chime (C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.1
      const dur = idx === notes.length - 1 ? 0.45 : 0.18
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0.1 * vol, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + dur)
    })
  }
}
