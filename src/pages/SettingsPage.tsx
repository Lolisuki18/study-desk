import { useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, Trash2, Upload } from 'lucide-react'
import { loadReports } from '../data'
import { useProgress } from '../features/learning/ProgressContext'
import { loadSettings, saveSettings } from '../services/storage/settings'
import { disableAutoBackup, enableAutoBackup, grantAutoBackup, markBackedUp, useAutoBackup } from '../services/storage/autoBackup'
import { pomodoro } from '../services/pomodoro'
import { applyTheme } from '../services/theme'
import type { BackupFile, Theme } from '../types'
import { Button, Card, PageHeader } from '../components/ui'

export default function SettingsPage() {
  const { exportBackup, importBackup, resetAll } = useProgress()
  const backup = useAutoBackup()
  const [settings, setSettings] = useState(loadSettings)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const file = useRef<HTMLInputElement>(null)

  const update = (patch: Partial<typeof settings>) => {
    const s = { ...settings, ...patch }
    setSettings(s)
    saveSettings(s)
  }

  const doExport = () => {
    const blob = new Blob([JSON.stringify(exportBackup(), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `study-hub-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    markBackedUp()
    setMsg({ ok: true, text: 'Đã xuất file tiến độ.' })
  }

  const auto = async (fn: () => Promise<void>, okText: string) => {
    try {
      await fn()
      setMsg({ ok: true, text: okText })
    } catch (e) {
      // closing the file picker is not an error worth reporting
      if ((e as Error).name !== 'AbortError') setMsg({ ok: false, text: (e as Error).message })
    }
  }

  const doImport = async (f?: File) => {
    if (!f) return
    try {
      const b = JSON.parse(await f.text()) as BackupFile
      if (!confirm('Khôi phục sẽ thay thế toàn bộ tiến độ hiện tại. Tiếp tục?')) return
      await importBackup(b)
      setMsg({ ok: true, text: `Đã khôi phục ${b.progress.length} bản ghi tiến độ.` })
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message })
    }
    if (file.current) file.current.value = ''
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Cài đặt" />

      <h2 className="mb-2 text-sm font-semibold">Tuỳ chọn học</h2>
      <Card className="mb-8 divide-y divide-line">
        <label className="flex items-center justify-between p-4 text-sm">
          Trộn thẻ Flashcard mặc định
          <input type="checkbox" checked={settings.shuffleFlashcards} onChange={(e) => update({ shuffleFlashcards: e.target.checked })} className="accent-ink" />
        </label>
        <label className="flex items-center justify-between p-4 text-sm">
          Quiz mặc định ở chế độ Practice
          <input type="checkbox" checked={settings.quizPracticeDefault} onChange={(e) => update({ quizPracticeDefault: e.target.checked })} className="accent-ink" />
        </label>
        <label className="flex items-center justify-between p-4 text-sm">
          Số câu Quiz mặc định
          <input
            type="number"
            min={1}
            max={200}
            value={settings.quizCount}
            onChange={(e) => update({ quizCount: Math.max(1, Number(e.target.value) || 1) })}
            className="w-20 rounded-lg border border-line px-2 py-1 text-right"
          />
        </label>
        <label className="flex items-center justify-between p-4 text-sm">
          Học đến khi thuộc (thẻ trả lời sai quay lại trong cùng phiên)
          <input type="checkbox" checked={settings.learnUntilKnown} onChange={(e) => update({ learnUntilKnown: e.target.checked })} className="accent-ink" />
        </label>
        <label className="flex items-center justify-between p-4 text-sm">
          Giao diện
          <select
            value={settings.theme}
            onChange={(e) => {
              const theme = e.target.value as Theme
              update({ theme })
              applyTheme(theme)
            }}
            className="rounded-lg border border-line bg-card px-2 py-1"
          >
            <option value="system">Theo hệ thống</option>
            <option value="light">Sáng</option>
            <option value="dark">Tối</option>
          </select>
        </label>
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
          Pomodoro (phút)
          <span className="flex items-center gap-2">
            tập trung
            <input
              type="number"
              min={1}
              max={180}
              value={settings.pomodoroWork}
              onChange={(e) => {
                update({ pomodoroWork: Math.max(1, Math.min(180, Number(e.target.value) || 1)) })
                pomodoro.refresh()
              }}
              className="w-16 rounded-lg border border-line px-2 py-1 text-right"
            />
            nghỉ
            <input
              type="number"
              min={1}
              max={60}
              value={settings.pomodoroBreak}
              onChange={(e) => {
                update({ pomodoroBreak: Math.max(1, Math.min(60, Number(e.target.value) || 1)) })
                pomodoro.refresh()
              }}
              className="w-16 rounded-lg border border-line px-2 py-1 text-right"
            />
          </span>
        </div>
        <label className="flex items-center justify-between p-4 text-sm">
          Mục tiêu mỗi ngày (số câu khác nhau đã học)
          <input
            type="number"
            min={1}
            max={999}
            value={settings.dailyGoal}
            onChange={(e) => update({ dailyGoal: Math.max(1, Math.min(999, Number(e.target.value) || 1)) })}
            className="w-20 rounded-lg border border-line px-2 py-1 text-right"
          />
        </label>
      </Card>

      <h2 className="mb-2 text-sm font-semibold">Tiến độ học</h2>
      <Card className="mb-8 p-4">
        <p className="mb-3 text-sm text-muted">
          Tiến độ và ghi chú lưu trong trình duyệt (IndexedDB), tách biệt khỏi file nội dung. File sao lưu gồm cả hai; “Xoá hết” chỉ xoá tiến độ, giữ lại ghi chú.
          {backup.lastAt && ` Lần sao lưu gần nhất: ${new Date(backup.lastAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}.`}
        </p>

        <div className="mb-4 rounded-xl border border-line bg-bg p-3 text-sm">
          <div className="font-medium">Sao lưu tự động ra file</div>
          {!backup.supported ? (
            <p className="mt-1 text-xs text-muted">Trình duyệt này không hỗ trợ ghi file tự động (cần Chrome hoặc Edge trên máy tính). Hãy dùng nút “Xuất tiến độ” định kỳ.</p>
          ) : backup.enabled ? (
            <>
              <p className="mt-1 text-xs text-muted">
                Đang ghi vào <b className="text-ink">{backup.fileName}</b> sau mỗi thay đổi.
                {backup.needsPermission && ' Trình duyệt cần bạn cho phép ghi file lại trong phiên này.'}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {backup.needsPermission && (
                  <Button variant="primary" onClick={() => auto(() => grantAutoBackup(exportBackup()), 'Đã bật lại sao lưu tự động.')}>
                    Cho phép ghi file
                  </Button>
                )}
                <Button onClick={() => auto(disableAutoBackup, 'Đã tắt sao lưu tự động. File đã ghi vẫn còn nguyên.')}>Tắt sao lưu tự động</Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-xs text-muted">Chọn một file một lần (nên đặt trong thư mục đồng bộ như OneDrive hay Google Drive), app sẽ tự ghi đè bản mới nhất sau mỗi thay đổi.</p>
              <Button className="mt-2" onClick={() => auto(() => enableAutoBackup(exportBackup()), 'Đã bật sao lưu tự động.')}>
                Chọn file sao lưu…
              </Button>
            </>
          )}
          {backup.error && <p className="mt-2 text-xs text-err">Lỗi sao lưu tự động: {backup.error}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={doExport}>
            <Download size={15} /> Xuất tiến độ
          </Button>
          <Button onClick={() => file.current?.click()}>
            <Upload size={15} /> Khôi phục tiến độ
          </Button>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => doImport(e.target.files?.[0])} />
          <Button
            variant="err"
            className="ml-auto"
            onClick={async () => {
              if (confirm('Xoá toàn bộ tiến độ học, hoạt động và lịch sử thi thử? Ghi chú được giữ lại. Không thể hoàn tác.')) {
                await resetAll()
                setMsg({ ok: true, text: 'Đã xoá tiến độ.' })
              }
            }}
          >
            <Trash2 size={15} /> Xoá hết
          </Button>
        </div>
        {msg && <p className={`mt-3 text-sm ${msg.ok ? 'text-ok' : 'text-err'}`}>{msg.text}</p>}
      </Card>

      <h2 className="mb-2 text-sm font-semibold">Trạng thái nạp dữ liệu</h2>
      <Card className="divide-y divide-line">
        {loadReports.map((r) => (
          <div key={r.file} className="p-4 text-sm">
            <div className="flex items-center gap-2">
              {r.ok ? <CheckCircle2 size={15} className="text-ok" /> : <AlertTriangle size={15} className="text-err" />}
              <span className="font-medium">{r.file}</span>
              <span className="text-muted">{r.id}</span>
            </div>
            {[...r.errors.map((e) => ['text-err', e]), ...r.warnings.map((w) => ['text-muted', w])].map(([cls, t], i) => (
              <div key={i} className={`mt-1 pl-6 text-xs ${cls}`}>
                {t}
              </div>
            ))}
          </div>
        ))}
      </Card>
    </div>
  )
}
