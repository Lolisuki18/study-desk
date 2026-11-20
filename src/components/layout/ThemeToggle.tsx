import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { loadSettings, saveSettings } from '../../services/storage/settings'
import { applyTheme, isDarkNow } from '../../services/theme'

/** One-click light / dark switch. Settings also offers "follow the system". */
export default function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(isDarkNow)

  useEffect(() => {
    const handler = () => setDark(isDarkNow())
    window.addEventListener('theme-changed', handler)
    return () => window.removeEventListener('theme-changed', handler)
  }, [])

  const flip = () => {
    const nextDark = !dark
    const theme = nextDark ? 'dark' : 'light'
    saveSettings({ ...loadSettings(), theme })
    applyTheme(theme, { animate: true })
    setDark(nextDark)
  }

  return (
    <button
      onClick={flip}
      className={className}
      title={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      aria-label="Đổi giao diện sáng / tối"
    >
      {dark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600 dark:text-slate-300" />}
    </button>
  )
}
