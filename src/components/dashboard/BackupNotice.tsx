import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useProgress } from '../../features/learning/ProgressContext'
import { grantAutoBackup, useAutoBackup } from '../../services/storage/autoBackup'

const DAY = 86_400_000
const STALE_DAYS = 7

/** Nudges the user when the study data is not being backed up: permission lost, or no backup for a week. */
export default function BackupNotice() {
  const { progress, exportBackup } = useProgress()
  const b = useAutoBackup()
  if (!progress.size) return null

  const box = 'flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 px-4 py-3 text-xs sm:text-sm text-amber-900 dark:text-amber-200 shadow-2xs'

  if (b.enabled && b.needsPermission)
    return (
      <div className={box}>
        <ShieldAlert size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
        <span className="min-w-0 flex-1 leading-relaxed">
          Sao lưu tự động vào “<b className="font-bold">{b.fileName}</b>” đang tạm dừng vì trình duyệt cần bạn cấp lại quyền ghi file.
        </span>
        <button
          onClick={() => void grantAutoBackup(exportBackup())}
          className="rounded-xl bg-amber-500 hover:bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
        >
          Cấp quyền
        </button>
      </div>
    )

  if (b.enabled) return null
  const age = b.lastAt ? Math.floor((Date.now() - new Date(b.lastAt).getTime()) / DAY) : null
  if (age !== null && age < STALE_DAYS) return null
  return (
    <div className={box}>
      <ShieldAlert size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
      <span className="min-w-0 flex-1 leading-relaxed">
        {age === null ? 'Tiến độ học chưa được sao lưu lần nào.' : `Đã ${age} ngày chưa sao lưu tiến độ.`} Dữ liệu hiện chỉ nằm an toàn trong trình duyệt này.
      </span>
      <Link
        to="/settings"
        className="rounded-xl bg-amber-500 hover:bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
      >
        Sao lưu ngay
      </Link>
    </div>
  )
}
