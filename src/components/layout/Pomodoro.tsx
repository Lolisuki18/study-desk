import { useEffect, useRef, useState } from 'react'
import {
  CloudRain,
  Coffee,
  Headphones,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Timer,
  Volume2,
  
  Waves,
  Wind,
} from 'lucide-react'
import { fmtClock, pomodoro, usePomodoro } from '../../services/pomodoro'
import {
  getAmbientType,
  getAmbientVolume,
  isAmbientPlaying,
  setAmbientVolume,
  startAmbient,
  stopAmbient,
  type Soundscape,
} from '../../utils/ambient'
import { cx } from '../../utils'

/** Pomodoro timer with Ambient Soundscapes. `compact` is the one-button version for the phone header. */
export default function Pomodoro({ compact = false }: { compact?: boolean }) {
  const s = usePomodoro()
  const work = s.phase === 'work'
  const label = work ? 'Tập trung' : 'Nghỉ ngơi'

  const [ambientOpen, setAmbientOpen] = useState(false)
  const [ambientPlaying, setAmbientPlaying] = useState(isAmbientPlaying)
  const [ambientType, setAmbientType] = useState<Soundscape | null>(getAmbientType)
  const [vol, setVol] = useState(() => Math.round(getAmbientVolume() * 100))

  useEffect(() => {
    const onAmbient = (e: Event) => {
      const d = (e as CustomEvent).detail
      setAmbientPlaying(d.isPlaying)
      setAmbientType(d.type)
    }
    window.addEventListener('ambient-changed', onAmbient)
    return () => window.removeEventListener('ambient-changed', onAmbient)
  }, [])

  // every widget shows the same volume, and the phone menu closes on an outside tap or Esc
  useEffect(() => {
    const onVolume = (e: Event) => setVol(Math.round((e as CustomEvent).detail.volume * 100))
    window.addEventListener('ambient-volume', onVolume)
    return () => window.removeEventListener('ambient-volume', onVolume)
  }, [])

  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ambientOpen) return
    const onDown = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setAmbientOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAmbientOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [ambientOpen])

  const changeVolume = (v: number) => {
    setVol(v)
    setAmbientVolume(v / 100)
  }

  const handleToggleAmbient = (type: Soundscape) => {
    if (ambientPlaying && ambientType === type) {
      stopAmbient()
    } else {
      startAmbient(type)
    }
  }

  if (compact)
    return (
      <div ref={menuRef} className="relative inline-flex items-center gap-1">
        <button
          onClick={pomodoro.toggle}
          title={`${label}: bấm để ${s.running ? 'tạm dừng' : 'bắt đầu'}`}
          className={cx(
            'inline-flex h-10 items-center gap-1.5 rounded-full border px-3 font-mono text-xs font-bold transition-all cursor-pointer',
            s.running
              ? work
                ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'border-slate-200 dark:border-line text-slate-600 dark:text-muted hover:text-ink',
          )}
        >
          {work ? <Timer size={13} className="text-indigo-600 dark:text-indigo-400" /> : <Coffee size={13} className="text-emerald-600 dark:text-emerald-400" />}
          <span>{fmtClock(s.remainingMs)}</span>
        </button>

        <button
          onClick={() => setAmbientOpen(!ambientOpen)}
          className={cx(
            'inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all cursor-pointer',
            ambientPlaying
              ? 'border-indigo-300 bg-indigo-50 text-indigo-600 dark:border-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 animate-pulse'
              : 'border-slate-200 dark:border-line text-slate-500 dark:text-muted hover:text-ink',
          )}
          title="Âm thanh tập trung (Mưa, Sóng biển, Cafe, White noise)"
          aria-label="Âm thanh tập trung"
          aria-expanded={ambientOpen}
        >
          <Headphones size={15} />
        </button>

        {ambientOpen && (
          <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-line bg-card p-3 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-line mb-2 text-xs font-bold text-ink">
              <span>Âm thanh tập trung</span>
              {ambientPlaying && (
                <button
                  onClick={stopAmbient}
                  className="text-[10px] text-rose-500 hover:underline font-semibold"
                >
                  Tắt âm
                </button>
              )}
            </div>
            <div className="space-y-1 text-xs">
              {(
                [
                  { id: 'rain', label: 'Tiếng mưa rơi', icon: CloudRain },
                  { id: 'ocean', label: 'Sóng biển rì rào', icon: Waves },
                  { id: 'cafe', label: 'Quán cà phê nhẹ', icon: Coffee },
                  { id: 'whitenoise', label: 'Tiếng ồn trắng', icon: Wind },
                ] as const
              ).map(({ id, label, icon: Icon }) => {
                const active = ambientPlaying && ambientType === id
                return (
                  <button
                    key={id}
                    onClick={() => handleToggleAmbient(id)}
                    className={cx(
                      'flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left transition-colors cursor-pointer',
                      active
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                    )}
                  >
                    <Icon size={14} className={active ? 'text-white' : 'text-indigo-500'} />
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
            {ambientPlaying && <VolumeSlider vol={vol} onChange={changeVolume} />}
          </div>
        )}
      </div>
    )

  const iconBtn =
    'inline-flex h-9 w-9 md:h-7 md:w-7 items-center justify-center rounded-lg text-slate-500 dark:text-muted transition-colors hover:bg-slate-200/60 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-ink cursor-pointer'

  return (
    <div className="mb-3 rounded-2xl border border-slate-200 dark:border-line bg-slate-50 dark:bg-slate-800/40 p-3 text-xs">
      <div className="flex items-center justify-between font-semibold text-slate-500 dark:text-muted">
        <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
          {work ? <Timer size={14} className="text-indigo-600 dark:text-indigo-400" /> : <Coffee size={14} className="text-emerald-600 dark:text-emerald-400" />}
          <span>{label}</span>
        </span>
        <span className="text-[11px]" title="Số phiên tập trung đã xong hôm nay">
          {s.doneToday} phiên
        </span>
      </div>

      <div className="mt-1.5 flex items-center justify-between">
        <span
          className={cx(
            'font-mono text-2xl font-black tracking-tight',
            s.running
              ? work
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-800 dark:text-ink',
          )}
        >
          {fmtClock(s.remainingMs)}
        </span>

        <span className="flex items-center gap-0.5">
          <button
            onClick={pomodoro.toggle}
            className={iconBtn}
            title={s.running ? 'Tạm dừng' : 'Bắt đầu'}
            aria-label={s.running ? 'Tạm dừng' : 'Bắt đầu'}
          >
            {s.running ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button
            onClick={pomodoro.skip}
            className={iconBtn}
            title={work ? 'Chuyển sang nghỉ' : 'Bỏ qua giờ nghỉ'}
            aria-label="Chuyển pha"
          >
            <SkipForward size={15} />
          </button>
          <button
            onClick={pomodoro.reset}
            className={iconBtn}
            title="Đặt lại"
            aria-label="Đặt lại"
          >
            <RotateCcw size={14} />
          </button>
        </span>
      </div>

      {/* Ambient Soundscapes quick toolbar */}
      <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-line/60">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-muted mb-1.5">
          <span className="inline-flex items-center gap-1">
            <Headphones size={12} className={ambientPlaying ? 'text-indigo-500 animate-pulse' : ''} />
            <span>Âm thanh tập trung</span>
          </span>
          {ambientPlaying && (
            <button
              onClick={stopAmbient}
              className="text-[10px] text-rose-500 hover:underline cursor-pointer"
            >
              Tắt
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-1">
          {[
            { id: 'rain', label: 'Mưa', icon: CloudRain, title: 'Tiếng mưa rơi' },
            { id: 'ocean', label: 'Sóng', icon: Waves, title: 'Sóng biển' },
            { id: 'cafe', label: 'Cafe', icon: Coffee, title: 'Quán cà phê' },
            { id: 'whitenoise', label: 'Trắng', icon: Wind, title: 'Tiếng ồn trắng' },
          ].map(({ id, label, icon: Icon, title }) => {
            const active = ambientPlaying && ambientType === id
            return (
              <button
                key={id}
                onClick={() => handleToggleAmbient(id as Soundscape)}
                title={title}
                className={cx(
                  'flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[10px] font-bold transition-all cursor-pointer',
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-card border border-line text-slate-600 dark:text-muted hover:border-indigo-400 hover:text-ink',
                )}
              >
                <Icon size={13} />
                <span>{label}</span>
              </button>
            )
          })}
        </div>

        {ambientPlaying && <VolumeSlider vol={vol} onChange={changeVolume} />}
      </div>
    </div>
  )
}

function VolumeSlider({ vol, onChange }: { vol: number; onChange: (v: number) => void }) {
  return (
    <div className="mt-2 flex items-center gap-2 pt-1">
      <Volume2 size={12} className="text-muted shrink-0" />
      <input
        type="range"
        min={0}
        max={100}
        value={vol}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full accent-indigo-600 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
        title={`Âm lượng: ${vol}%`}
        aria-label="Âm lượng âm thanh tập trung"
      />
      <span className="font-mono text-[9px] text-muted w-6 text-right">{vol}%</span>
    </div>
  )
}
