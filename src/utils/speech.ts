/**
 * Web Speech API text-to-speech helper (100% offline, native browser).
 */

let speaking = false

export function isSpeaking(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    speaking = false
  }
}

export function speakText(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.()
    return
  }

  try {
    window.speechSynthesis.cancel()

    // Clean plain text: remove markdown symbols or excessive punctuation
    const clean = text
      .replace(/[*_#`~[\]]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!clean) {
      onEnd?.()
      return
    }

    const u = new SpeechSynthesisUtterance(clean)
    u.rate = 0.95 // slightly measured pace for learning
    u.pitch = 1.0

    // Pick Vietnamese voice if available
    const voices = window.speechSynthesis.getVoices()
    const viVoice = voices.find((v) => v.lang.startsWith('vi') || v.lang.includes('VIE'))
    if (viVoice) {
      u.voice = viVoice
      u.lang = viVoice.lang
    } else {
      u.lang = 'vi-VN'
    }

    speaking = true
    u.onend = () => {
      speaking = false
      onEnd?.()
    }
    u.onerror = () => {
      speaking = false
      onEnd?.()
    }

    window.speechSynthesis.speak(u)
  } catch {
    speaking = false
    onEnd?.()
  }
}
