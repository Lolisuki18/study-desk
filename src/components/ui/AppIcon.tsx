import {
  BookOpen,
  CalendarDays,
  Eraser,
  HelpCircle,
  Library,
  Moon,
  Shield,
  Sparkles,
  Star,
  Target,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/** Icons referenced by name from data (badges, mistake tags), so no emoji is needed. */
const ICONS: Record<string, LucideIcon> = {
  shield: Shield,
  sparkles: Sparkles,
  target: Target,
  zap: Zap,
  star: Star,
  eraser: Eraser,
  moon: Moon,
  library: Library,
  book: BookOpen,
  calendar: CalendarDays,
  help: HelpCircle,
}

export default function AppIcon({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  const Icon = ICONS[name] ?? HelpCircle
  return <Icon size={size} className={className} aria-hidden="true" />
}
