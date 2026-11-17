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

  const box = 'mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'

  if (b.enabled && b.needsPermission)
    return (
      <div className={box}>
        <ShieldAlert size={17} className="shrink-0 text-amber-600" />
        <span className="min-w-0 flex-1">Sao lưu tự động vào “{b.fileName}” đang tạm dừng vì trình duyệt cần bạn cho phép ghi file lại.</span>
        <button onClick={() => void grantAutoBackup(exportBackup())} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700">
          Cho phép
        </button>
      </div>
    )

  if (b.enabled) return null
  const age = b.lastAt ? Math.floor((Date.now() - new Date(b.lastAt).getTime()) / DAY) : null
  if (age !== null && age < STALE_DAYS) return null
  return (
    <div className={box}>
      <ShieldAlert size={17} className="shrink-0 text-amber-600" />
      <span className="min-w-0 flex-1">
        {age === null ? 'Tiến độ học chưa được sao lưu lần nào.' : `Đã ${age} ngày chưa sao lưu tiến độ.`} Dữ liệu chỉ nằm trong trình duyệt này.
      </span>
      <Link to="/settings" className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700">
        Sao lưu
      </Link>
    </div>
  )
}
