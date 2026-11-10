import { useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, Trash2, Upload } from 'lucide-react'
import { loadReports } from '../data'
import { useProgress } from '../features/learning/ProgressContext'
import { loadSettings, saveSettings } from '../services/storage/settings'
import type { BackupFile } from '../types'
import { Button, Card, PageHeader } from '../components/ui'

export default function SettingsPage() {
  const { exportBackup, importBackup, resetAll } = useProgress()
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
    setMsg({ ok: true, text: 'Đã xuất file tiến độ.' })
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
      </Card>

      <h2 className="mb-2 text-sm font-semibold">Tiến độ học</h2>
      <Card className="mb-8 p-4">
        <p className="mb-3 text-sm text-muted">Tiến độ lưu trong trình duyệt (IndexedDB), tách biệt khỏi file nội dung. Hãy xuất file sao lưu định kỳ.</p>
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
              if (confirm('Xoá toàn bộ tiến độ học? Không thể hoàn tác.')) {
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
