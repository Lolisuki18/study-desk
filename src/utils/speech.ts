/**
 * Web Speech API text-to-speech helper (100% offline, native browser).
 * Supports English (US / UK accents) and Vietnamese with speed controls.
 */

export interface SpeakOptions {
  lang?: string
  rate?: number
  pitch?: number
  voiceName?: string
  accent?: 'US' | 'UK'
  onEnd?: () => void
}

export function isSpeaking(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

/** Check if text contains typical Vietnamese diacritics */
export function isVietnameseText(text: string): boolean {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)
}

function findBestVoice(lang: string, accent?: 'US' | 'UK', voiceName?: string): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return undefined

  if (voiceName) {
    const match = voices.find((v) => v.name.toLowerCase().includes(voiceName.toLowerCase()))
    if (match) return match
  }

  if (lang.startsWith('en')) {
    if (accent === 'UK') {
      const ukVoice = voices.find(
        (v) =>
          v.lang.replace('_', '-').toLowerCase() === 'en-gb' ||
          v.name.includes('UK') ||
          v.name.includes('British') ||
          v.name.includes('United Kingdom') ||
          v.name.includes('George') ||
          v.name.includes('Daniel')
      )
      if (ukVoice) return ukVoice
    }
    // Default or US accent
    const usVoice = voices.find(
      (v) =>
        v.lang.replace('_', '-').toLowerCase() === 'en-us' ||
        v.name.includes('US') ||
        v.name.includes('United States') ||
        v.name.includes('Samantha') ||
        v.name.includes('Zira') ||
        v.name.includes('Google US English')
    )
    if (usVoice) return usVoice

    // Any English voice
    const anyEn = voices.find((v) => v.lang.toLowerCase().startsWith('en'))
    if (anyEn) return anyEn
  }

  if (lang.startsWith('vi')) {
    const viVoice = voices.find((v) => v.lang.startsWith('vi') || v.lang.includes('VIE'))
    if (viVoice) return viVoice
  }

  return undefined
}

export function speakText(
  text: string,
  optionsOrOnEnd?: SpeakOptions | (() => void),
  legacyOnEnd?: () => void
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (typeof optionsOrOnEnd === 'function') optionsOrOnEnd()
    else legacyOnEnd?.()
    return
  }

  const options: SpeakOptions =
    typeof optionsOrOnEnd === 'function'
      ? { onEnd: optionsOrOnEnd }
      : optionsOrOnEnd ?? (legacyOnEnd ? { onEnd: legacyOnEnd } : {})

  try {
    window.speechSynthesis.cancel()

    // Clean plain text: remove markdown symbols or excessive punctuation
    const clean = text
      .replace(/[*_#`~[\]]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!clean) {
      options.onEnd?.()
      return
    }

    const u = new SpeechSynthesisUtterance(clean)
    u.rate = options.rate ?? 0.95
    u.pitch = options.pitch ?? 1.0

    // Determine language if not explicitly specified
    let targetLang = options.lang
    if (!targetLang) {
      targetLang = isVietnameseText(clean) ? 'vi-VN' : 'en-US'
    }

    const voice = findBestVoice(targetLang, options.accent, options.voiceName)
    if (voice) {
      u.voice = voice
      u.lang = voice.lang
    } else {
      u.lang = targetLang
    }

    u.onend = () => {
      options.onEnd?.()
    }
    u.onerror = () => {
      options.onEnd?.()
    }

    window.speechSynthesis.speak(u)
  } catch {
    options.onEnd?.()
  }
}

/** Specialized helper to speak English words or sentences with selected accent */
export function speakEnglish(
  text: string,
  options?: {
    accent?: 'US' | 'UK'
    rate?: number
    onEnd?: () => void
  }
) {
  speakText(text, {
    lang: options?.accent === 'UK' ? 'en-GB' : 'en-US',
    accent: options?.accent ?? 'US',
    rate: options?.rate ?? 0.9,
    onEnd: options?.onEnd,
  })
}
