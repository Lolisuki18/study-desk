import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { cx } from '../../utils'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <button
      onClick={scrollToTop}
      className={cx(
        'fixed bottom-20 md:bottom-6 right-5 z-30 flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-card/90 text-muted shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-indigo-400 hover:text-indigo-600 active:scale-95 cursor-pointer animate-in fade-in duration-200 print:hidden',
      )}
      title="Cuộn lên đầu trang"
      aria-label="Cuộn lên đầu trang"
    >
      <ArrowUp size={18} />
    </button>
  )
}
