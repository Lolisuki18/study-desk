/**
 * Web Audio API synthesized ambient soundscapes.
 * 100% offline, zero external audio asset dependencies, continuous generation.
 */

export type Soundscape = 'rain' | 'ocean' | 'cafe' | 'whitenoise'

export interface SoundscapeOption {
  id: Soundscape
  label: string
  icon: string
  description: string
}

export const SOUNDSCAPES: SoundscapeOption[] = [
  { id: 'rain', label: 'Tiếng mưa rơi', icon: 'CloudRain', description: 'Mưa rào êm dịu, rửa trôi xao nhãng' },
  { id: 'ocean', label: 'Sóng biển rì rào', icon: 'Waves', description: 'Nhịp sóng nhấp nhô giúp nhịp tim ổn định' },
  { id: 'cafe', label: 'Quán cà phê nhẹ', icon: 'Coffee', description: 'Tiếng xì xào ấm áp như đang ngồi cafe' },
  { id: 'whitenoise', label: 'Tiếng ồn trắng (White noise)', icon: 'Wind', description: 'Triệt tiêu tạp âm xung quanh, tối ưu tập trung' },
]

let audioCtx: AudioContext | null = null
let masterGain: GainNode | null = null
let currentSourceNodes: { stop: () => void } | null = null
let currentType: Soundscape | null = null
let isPlaying = false

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

export function getAmbientVolume(): number {
  try {
    const val = localStorage.getItem('psh.ambient.volume')
    return val !== null ? Math.max(0, Math.min(1, Number(val))) : 0.4
  } catch {
    return 0.4
  }
}

export function setAmbientVolume(vol: number): void {
  const v = Math.max(0, Math.min(1, vol))
  try {
    localStorage.setItem('psh.ambient.volume', String(v))
  } catch {}
  if (masterGain && audioCtx) {
    masterGain.gain.setTargetAtTime(v, audioCtx.currentTime, 0.1)
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('ambient-volume', { detail: { volume: v } }))
}

export function getAmbientType(): Soundscape | null {
  return currentType
}

export function isAmbientPlaying(): boolean {
  return isPlaying
}

export function stopAmbient(): void {
  const nodes = currentSourceNodes
  const gain = masterGain
  currentSourceNodes = null
  masterGain = null
  if (nodes) {
    // fade out first: cutting a running noise source dead makes an audible click
    if (gain && audioCtx) {
      try {
        gain.gain.cancelScheduledValues(audioCtx.currentTime)
        gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.04)
      } catch {}
    }
    setTimeout(() => {
      try {
        nodes.stop()
      } catch {}
      try {
        gain?.disconnect()
      } catch {}
    }, 250)
  }
  isPlaying = false
  currentType = null
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ambient-changed', { detail: { isPlaying: false, type: null } }))
  }
}

/** Length of the cross-fade that hides the point where the noise loop restarts. */
const SEAM_SECONDS = 0.25

/**
 * 5-second noise buffer for looping. Random noise (brown noise above all, which wanders) does not end where it began,
 * so a plain loop clicks every 5 s. The first SEAM samples are therefore cross-faded with the samples that would have
 * followed the end: the loop then restarts on the natural continuation of the last sample.
 */
function createNoiseBuffer(ctx: AudioContext, type: 'white' | 'pink' | 'brown'): AudioBuffer {
  const size = Math.floor(ctx.sampleRate * 5)
  const seam = Math.floor(ctx.sampleRate * SEAM_SECONDS)
  const raw = new Float32Array(size + seam)

  if (type === 'white') {
    for (let i = 0; i < raw.length; i++) raw[i] = Math.random() * 2 - 1
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < raw.length; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }
  } else {
    let last = 0
    for (let i = 0; i < raw.length; i++) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      raw[i] = last * 3.5 // gain compensation
    }
  }

  const buffer = ctx.createBuffer(1, size, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < size; i++) {
    if (i < seam) {
      const t = i / seam
      // equal-power cross-fade: the two noise stretches are uncorrelated, so a linear fade would dip in loudness
      data[i] = raw[i] * Math.sqrt(t) + raw[size + i] * Math.sqrt(1 - t)
    } else data[i] = raw[i]
  }
  return buffer
}

export function startAmbient(type: Soundscape, vol?: number): void {
  stopAmbient()

  const ctx = getAudioContext()
  if (!ctx) return

  const targetVol = vol ?? getAmbientVolume()
  const out = ctx.createGain()
  masterGain = out
  out.gain.setValueAtTime(0.001, ctx.currentTime)
  out.gain.exponentialRampToValueAtTime(Math.max(0.001, targetVol), ctx.currentTime + 1.2)
  out.connect(ctx.destination)

  const activeNodes: { stop: () => void }[] = []

  if (type === 'whitenoise') {
    const noiseBuffer = createNoiseBuffer(ctx, 'white')
    const source = ctx.createBufferSource()
    source.buffer = noiseBuffer
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1200 // pleasant gentle roll-off

    source.connect(filter)
    filter.connect(out)
    source.start()

    activeNodes.push({
      stop: () => {
        try { source.stop() } catch {}
      },
    })
  } else if (type === 'rain') {
    // Continuous brown/pink noise rain bed
    const noiseBuffer = createNoiseBuffer(ctx, 'brown')
    const source = ctx.createBufferSource()
    source.buffer = noiseBuffer
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 900

    source.connect(filter)
    filter.connect(out)
    source.start()

    // Random raindrop sprinkles
    let dropTimer: ReturnType<typeof setInterval> | null = null
    dropTimer = setInterval(() => {
      if (!isPlaying || !audioCtx) return
      try {
        const osc = audioCtx.createOscillator()
        const dropGain = audioCtx.createGain()
        const freq = 1200 + Math.random() * 1400
        const now = audioCtx.currentTime
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now)
        osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.06)
        dropGain.gain.setValueAtTime(0.015, now)
        dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06)
        osc.connect(dropGain)
        dropGain.connect(out)
        osc.start(now)
        osc.stop(now + 0.07)
      } catch {}
    }, 280)

    activeNodes.push({
      stop: () => {
        if (dropTimer) clearInterval(dropTimer)
        try { source.stop() } catch {}
      },
    })
  } else if (type === 'ocean') {
    // Pink noise modulated by low frequency oscillator (LFO)
    const noiseBuffer = createNoiseBuffer(ctx, 'pink')
    const source = ctx.createBufferSource()
    source.buffer = noiseBuffer
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 450
    filter.Q.value = 0.9

    // Wave swell gain modulation
    const swellGain = ctx.createGain()
    swellGain.gain.value = 0.5

    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 0.12 // 8-second wave rhythm

    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 0.35

    lfo.connect(lfoGain)
    lfoGain.connect(swellGain.gain)

    source.connect(filter)
    filter.connect(swellGain)
    swellGain.connect(out)

    source.start()
    lfo.start()

    activeNodes.push({
      stop: () => {
        try { source.stop() } catch {}
        try { lfo.stop() } catch {}
      },
    })
  } else if (type === 'cafe') {
    // Warm low-frequency chatter rumble
    const noiseBuffer = createNoiseBuffer(ctx, 'pink')
    const source = ctx.createBufferSource()
    source.buffer = noiseBuffer
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 350
    filter.Q.value = 1.2

    source.connect(filter)
    filter.connect(out)
    source.start()

    // Occasional muffled cup clink
    let clinkTimer: ReturnType<typeof setInterval> | null = null
    clinkTimer = setInterval(() => {
      if (!isPlaying || !audioCtx) return
      if (Math.random() > 0.4) return
      try {
        const osc = audioCtx.createOscillator()
        const clinkGain = audioCtx.createGain()
        const now = audioCtx.currentTime
        osc.type = 'sine'
        osc.frequency.setValueAtTime(2200 + Math.random() * 400, now)
        clinkGain.gain.setValueAtTime(0.008, now)
        clinkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
        osc.connect(clinkGain)
        clinkGain.connect(out)
        osc.start(now)
        osc.stop(now + 0.13)
      } catch {}
    }, 1800)

    activeNodes.push({
      stop: () => {
        if (clinkTimer) clearInterval(clinkTimer)
        try { source.stop() } catch {}
      },
    })
  }

  currentSourceNodes = {
    stop: () => {
      activeNodes.forEach((n) => n.stop())
    },
  }

  isPlaying = true
  currentType = type

  try {
    localStorage.setItem('psh.ambient.type', type)
  } catch {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ambient-changed', { detail: { isPlaying: true, type } }))
  }
}
