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

  if (b.enabled && b.needsPermission)
    return (
      <div className="flex flex-wrap items-center gap-3.5 rounded-2xl border border-amber-200/90 dark:border-amber-900/50 bg-gradient-to-r from-amber-50/90 via-amber-50/40 to-card dark:from-amber-950/40 dark:via-card dark:to-card px-4 py-3 text-xs sm:text-sm text-amber-950 dark:text-amber-200 shadow-2xs">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
          <ShieldAlert size={19} />
        </div>
        <span className="min-w-0 flex-1 leading-relaxed">
          Sao lưu tự động vào “<b className="font-bold">{b.fileName}</b>” đang tạm dừng vì trình duyệt cần bạn cấp lại quyền ghi file.
        </span>
        <button
          onClick={() => void grantAutoBackup(exportBackup())}
          className="rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          Cấp quyền
        </button>
      </div>
    )

  if (b.enabled) return null
  const age = b.lastAt ? Math.floor((Date.now() - new Date(b.lastAt).getTime()) / DAY) : null
  if (age !== null && age < STALE_DAYS) return null
  return (
    <div className="flex flex-wrap items-center gap-3.5 rounded-2xl border border-amber-200/90 dark:border-amber-900/50 bg-gradient-to-r from-amber-50/90 via-amber-50/40 to-card dark:from-amber-950/40 dark:via-card dark:to-card px-4 py-3 text-xs sm:text-sm text-amber-950 dark:text-amber-200 shadow-2xs">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
        <ShieldAlert size={19} />
      </div>
      <span className="min-w-0 flex-1 leading-relaxed">
        {age === null ? 'Tiến độ học chưa được sao lưu lần nào.' : `Đã ${age} ngày chưa sao lưu tiến độ.`} Dữ liệu hiện chỉ nằm an toàn trong trình duyệt này.
      </span>
      <Link
        to="/settings"
        className="rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-95 cursor-pointer"
      >
        Sao lưu ngay
      </Link>
    </div>
  )
}
