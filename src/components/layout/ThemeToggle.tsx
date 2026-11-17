import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { loadSettings, saveSettings } from '../../services/storage/settings'
import { applyTheme, isDarkNow } from '../../services/theme'

/** One-click light / dark switch. Settings also offers "follow the system". */
export default function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(isDarkNow)
  const flip = () => {
    const theme = dark ? 'light' : 'dark'
    saveSettings({ ...loadSettings(), theme })
    applyTheme(theme)
    setDark(!dark)
  }
  return (
    <button onClick={flip} className={className} title={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'} aria-label="Đổi giao diện sáng / tối">
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
