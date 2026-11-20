import { useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, Trash2, Upload, Volume2, Check, X, RefreshCw, Bell, PartyPopper } from 'lucide-react'
import { loadReports } from '../data'
import { useProgress } from '../features/learning/ProgressContext'
import { loadSettings, saveSettings } from '../services/storage/settings'
import { disableAutoBackup, enableAutoBackup, grantAutoBackup, markBackedUp, useAutoBackup } from '../services/storage/autoBackup'
import { pomodoro } from '../services/pomodoro'
import { ACCENTS, applyAccent, applyTheme } from '../services/theme'
import type { Accent, BackupFile, Theme } from '../types'
import { Button, Card, ConfirmDialog, PageHeader, useToast } from '../components/ui'
import { isSoundEnabled, setSoundEnabled, getSoundVolume, setSoundVolume, playSound } from '../utils/sound'
import { isMechSoundEnabled, setMechSoundEnabled, playMechSound } from '../utils/mechSound'
import { isHapticEnabled, setHapticEnabled, haptic } from '../utils/haptic'
import { getReadingFont, setReadingFont, type ReadingFont } from '../utils/fonts'

export default function SettingsPage() {
  const { exportBackup, importBackup, resetAll } = useProgress()
  const { toast } = useToast()
  const backup = useAutoBackup()
  const [settings, setSettings] = useState(loadSettings)
  const [sound, setSound] = useState(isSoundEnabled)
  const [volume, setVolume] = useState(() => Math.round(getSoundVolume() * 100))
  const [mechSound, setMechSound] = useState(isMechSoundEnabled)
  const [hapticOn, setHapticOn] = useState(isHapticEnabled)
  const [fontFamily, setFontFamily] = useState<ReadingFont>(getReadingFont)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [pendingImport, setPendingImport] = useState<BackupFile | null>(null)
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
    toast.success('Đã xuất file tiến độ thành công.')
  }

  const auto = async (fn: () => Promise<void>, okText: string) => {
    try {
      await fn()
      toast.success(okText)
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast.error((e as Error).message)
    }
  }

  const handleFileSelect = async (f?: File) => {
    if (!f) return
    try {
      const b = JSON.parse(await f.text()) as BackupFile
      setPendingImport(b)
    } catch (e) {
      toast.error(`File không hợp lệ: ${(e as Error).message}`)
    }
    if (file.current) file.current.value = ''
  }

  const confirmImport = async () => {
    if (!pendingImport) return
    try {
      await importBackup(pendingImport)
      toast.success(`Đã khôi phục ${pendingImport.progress.length} bản ghi tiến độ.`)
      setPendingImport(null)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const toggleSoundOption = (enabled: boolean) => {
    setSound(enabled)
    setSoundEnabled(enabled)
    toast.info(enabled ? 'Đã bật âm thanh hiệu ứng' : 'Đã tắt âm thanh hiệu ứng')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Cài đặt hệ thống" subtitle="Tùy chỉnh thói quen học tập, âm thanh và sao lưu an toàn" />

      <div>
        <h2 className="mb-2 text-sm font-bold text-ink">Tùy chọn học tập</h2>
        <Card className="divide-y divide-line overflow-hidden">
          <label className="flex items-center justify-between p-4 text-sm font-medium hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
            Trộn thẻ Flashcard ngẫu nhiên mặc định
            <input
              type="checkbox"
              checked={settings.shuffleFlashcards}
              onChange={(e) => update({ shuffleFlashcards: e.target.checked })}
              className="accent-indigo-600 h-4 w-4 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-4 text-sm font-medium hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
            Quiz mặc định ở chế độ Luyện tập (Practice)
            <input
              type="checkbox"
              checked={settings.quizPracticeDefault}
              onChange={(e) => update({ quizPracticeDefault: e.target.checked })}
              className="accent-indigo-600 h-4 w-4 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-4 text-sm font-medium hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
            Học đến khi thuộc (lặp lại câu sai trong cùng phiên)
            <input
              type="checkbox"
              checked={settings.learnUntilKnown}
              onChange={(e) => update({ learnUntilKnown: e.target.checked })}
              className="accent-indigo-600 h-4 w-4 rounded cursor-pointer"
            />
          </label>

          <div className="p-4 space-y-3">
            <label className="flex items-center justify-between text-sm font-medium hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
              <span className="flex items-center gap-2">
                <Volume2 size={16} className="text-indigo-600 dark:text-indigo-400" />
                <span>Bật âm thanh hiệu ứng (Web Audio sound)</span>
              </span>
              <input
                type="checkbox"
                checked={sound}
                onChange={(e) => toggleSoundOption(e.target.checked)}
                className="accent-indigo-600 h-4 w-4 rounded cursor-pointer"
              />
            </label>

            {sound && (
              <div className="rounded-2xl border border-line bg-slate-50/60 dark:bg-slate-900/40 p-3.5 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-semibold text-muted">
                  <span>Âm lượng hiệu ứng</span>
                  <span className="font-mono text-ink font-bold">{volume}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setVolume(v)
                    setSoundVolume(v / 100)
                  }}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 rounded-lg bg-slate-200 dark:bg-slate-700"
                />
                <div className="pt-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">Nghe thử âm thanh</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => playSound('correct')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:border-emerald-300 cursor-pointer"
                    >
                      <Check size={13} /> Đúng
                    </button>
                    <button
                      type="button"
                      onClick={() => playSound('wrong')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:border-rose-300 cursor-pointer"
                    >
                      <X size={13} /> Sai
                    </button>
                    <button
                      type="button"
                      onClick={() => playSound('flip')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:border-indigo-300 cursor-pointer"
                    >
                      <RefreshCw size={13} /> Lật thẻ
                    </button>
                    <button
                      type="button"
                      onClick={() => playSound('bell')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:border-amber-300 cursor-pointer"
                    >
                      <Bell size={13} /> Chuông
                    </button>
                    <button
                      type="button"
                      onClick={() => playSound('fanfare')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:border-purple-300 cursor-pointer"
                    >
                      <PartyPopper size={13} /> Hoàn thành
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <label className="flex items-center justify-between p-4 text-sm font-medium hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
            <span>Hiệu ứng gõ phím cơ khi bấm đáp án / phím tắt</span>
            <input
              type="checkbox"
              checked={mechSound}
              onChange={(e) => {
                const next = e.target.checked
                setMechSound(next)
                setMechSoundEnabled(next)
                if (next) playMechSound('keydown')
              }}
              className="accent-indigo-600 h-4 w-4 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-4 text-sm font-medium hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
            <span>Rung phản hồi xúc giác (điện thoại Android; iPhone không hỗ trợ)</span>
            <input
              type="checkbox"
              checked={hapticOn}
              onChange={(e) => {
                const next = e.target.checked
                setHapticOn(next)
                setHapticEnabled(next)
                if (next) haptic('success')
              }}
              className="accent-indigo-600 h-4 w-4 rounded cursor-pointer"
            />
          </label>

          <div className="flex items-center justify-between p-4 text-sm font-medium">
            <span>Số câu Quiz mặc định</span>
            <input
              type="number"
              min={1}
              max={200}
              value={settings.quizCount}
              onChange={(e) => update({ quizCount: Math.max(1, Number(e.target.value) || 1) })}
              className="w-20 rounded-xl border border-line bg-card px-2.5 py-1 text-right font-semibold text-ink outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between p-4 text-sm font-medium">
            <span>Giao diện màu sắc</span>
            <select
              value={settings.theme}
              onChange={(e) => {
                const theme = e.target.value as Theme
                update({ theme })
                applyTheme(theme, { animate: true })
              }}
              className="rounded-xl border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="light">Chế độ sáng (Mặc định)</option>
              <option value="dark">Chế độ tối (Dark mode)</option>
              <option value="sepia">Giấy vàng ấm áp (Warm Sepia)</option>
              <option value="oled">Đen tuyền AMOLED (OLED Pitch Black)</option>
              <option value="system">Theo hệ thống</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 text-sm font-medium">
            <span>Phông chữ hiển thị nội dung</span>
            <select
              value={fontFamily}
              onChange={(e) => {
                const f = e.target.value as ReadingFont
                setFontFamily(f)
                setReadingFont(f)
                toast.info(`Đã đổi sang phông: ${f === 'serif' ? 'Có chân cổ điển (Serif)' : 'Hiện đại (Sans-serif)'}`)
              }}
              className="rounded-xl border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="sans">Hiện đại (Inter / Sans-serif)</option>
              <option value="serif">Sách cổ điển (Serif: Merriweather nếu máy có, không thì Georgia)</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm font-medium">
            <span>Màu chủ đạo</span>
            <div className="flex items-center gap-2.5" role="radiogroup" aria-label="Màu chủ đạo">
              {ACCENTS.map((a) => {
                const active = (settings.accent ?? 'indigo') === a.id
                return (
                  <button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={a.label}
                    title={a.label}
                    onClick={() => {
                      update({ accent: a.id as Accent })
                      applyAccent(a.id as Accent)
                    }}
                    style={{ backgroundColor: a.swatch }}
                    className={
                      'h-8 w-8 cursor-pointer rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110 dark:border-slate-900 ' +
                      (active ? 'ring-2 ring-offset-2 ring-offset-card ring-slate-900 dark:ring-white' : 'ring-1 ring-slate-200 dark:ring-slate-700')
                    }
                  />
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm font-medium">
            <span>Chu kỳ Pomodoro (phút)</span>
            <span className="flex items-center gap-2">
              <span className="text-xs text-muted">Tập trung</span>
              <input
                type="number"
                min={1}
                max={180}
                value={settings.pomodoroWork}
                onChange={(e) => {
                  update({ pomodoroWork: Math.max(1, Math.min(180, Number(e.target.value) || 1)) })
                  pomodoro.refresh()
                }}
                className="w-16 rounded-xl border border-line bg-card px-2 py-1 text-right font-semibold text-ink"
              />
              <span className="text-xs text-muted">Nghỉ</span>
              <input
                type="number"
                min={1}
                max={60}
                value={settings.pomodoroBreak}
                onChange={(e) => {
                  update({ pomodoroBreak: Math.max(1, Math.min(60, Number(e.target.value) || 1)) })
                  pomodoro.refresh()
                }}
                className="w-16 rounded-xl border border-line bg-card px-2 py-1 text-right font-semibold text-ink"
              />
            </span>
          </div>

          <div className="flex items-center justify-between p-4 text-sm font-medium">
            <span>Mục tiêu mỗi ngày (số câu học mới / ôn)</span>
            <input
              type="number"
              min={1}
              max={999}
              value={settings.dailyGoal}
              onChange={(e) => update({ dailyGoal: Math.max(1, Math.min(999, Number(e.target.value) || 1)) })}
              className="w-20 rounded-xl border border-line bg-card px-2.5 py-1 text-right font-semibold text-ink outline-none focus:border-indigo-500"
            />
          </div>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold text-ink">Quản lý & Sao lưu tiến độ</h2>
        <Card className="p-5 space-y-4">
          <p className="text-xs text-muted leading-relaxed">
            Dữ liệu được lưu trong trình duyệt (IndexedDB) hoàn toàn offline trên máy bạn. Hãy sao lưu định kỳ để tránh mất tiến độ khi dọn dẹp trình duyệt.
            {backup.lastAt && ` Lần sao lưu gần nhất: ${new Date(backup.lastAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}.`}
          </p>

          <div className="rounded-2xl border border-line bg-slate-50/70 dark:bg-slate-900/40 p-4 text-sm">
            <div className="font-bold text-ink">Sao lưu tự động ra file máy tính</div>
            {!backup.supported ? (
              <p className="mt-1 text-xs text-muted">
                Trình duyệt này không hỗ trợ ghi file tự động (khuyên dùng Chrome hoặc Edge trên máy tính).
              </p>
            ) : backup.enabled ? (
              <>
                <p className="mt-1 text-xs text-muted">
                  Đang tự động ghi vào <b className="text-ink">{backup.fileName}</b> sau mỗi phiên học.
                  {backup.needsPermission && ' Cần bạn cấp lại quyền ghi file trong phiên này.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {backup.needsPermission && (
                    <Button variant="primary" onClick={() => auto(() => grantAutoBackup(exportBackup()), 'Đã bật lại sao lưu tự động.')}>
                      Cấp quyền ghi file
                    </Button>
                  )}
                  <Button onClick={() => auto(disableAutoBackup, 'Đã tắt sao lưu tự động.')}>Tắt sao lưu tự động</Button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-1 text-xs text-muted">
                  Chọn 1 file (nên để trong thư mục Google Drive / OneDrive), ứng dụng sẽ tự động ghi đè bản mới nhất sau mỗi thay đổi.
                </p>
                <Button className="mt-3" onClick={() => auto(() => enableAutoBackup(exportBackup()), 'Đã kích hoạt sao lưu tự động.')}>
                  Chọn file sao lưu tự động…
                </Button>
              </>
            )}
            {backup.error && <p className="mt-2 text-xs text-err">Lỗi: {backup.error}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Button onClick={doExport} className="py-2 px-4">
              <Download size={15} /> Xuất file tiến độ
            </Button>
            <Button onClick={() => file.current?.click()} className="py-2 px-4">
              <Upload size={15} /> Khôi phục từ file
            </Button>
            <input ref={file} type="file" accept="application/json" hidden onChange={(e) => handleFileSelect(e.target.files?.[0])} />

            <Button
              variant="err"
              className="ml-auto py-2 px-4"
              onClick={() => setShowResetConfirm(true)}
            >
              <Trash2 size={15} /> Xoá toàn bộ tiến độ
            </Button>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold text-ink">Trạng thái nạp ngân hàng câu hỏi</h2>
        <Card className="divide-y divide-line overflow-hidden">
          {loadReports.map((r) => (
            <div key={r.file} className="p-4 text-xs">
              <div className="flex items-center gap-2">
                {r.ok ? <CheckCircle2 size={15} className="text-ok shrink-0" /> : <AlertTriangle size={15} className="text-err shrink-0" />}
                <span className="font-bold text-ink">{r.file}</span>
                <span className="text-muted">({r.id})</span>
              </div>
              {[...r.errors.map((e) => ['text-err font-medium', e]), ...r.warnings.map((w) => ['text-muted', w])].map(([cls, t], i) => (
                <div key={i} className={`mt-1 pl-6 ${cls}`}>
                  {t}
                </div>
              ))}
            </div>
          ))}
        </Card>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={async () => {
          await resetAll()
          toast.success('Đã xoá toàn bộ tiến độ học tập.')
        }}
        title="Xoá toàn bộ tiến độ học?"
        description="Toàn bộ lịch sử làm bài, các hộp Leitner SRS và kết quả thi thử sẽ bị xoá vĩnh viễn (các ghi chú cá nhân của bạn vẫn được giữ lại).\n\nHành động này KHÔNG THỂ HOÀN TÁC."
        confirmText="Xoá vĩnh viễn"
        cancelText="Hủy bỏ"
        tone="danger"
      />

      <ConfirmDialog
        open={!!pendingImport}
        onClose={() => setPendingImport(null)}
        onConfirm={confirmImport}
        title="Khôi phục tiến độ từ file?"
        description={`File chứa ${pendingImport?.progress.length ?? 0} bản ghi tiến độ.\n\nLưu ý: Quá trình khôi phục sẽ ghi đè lên toàn bộ tiến độ hiện tại trên trình duyệt này.`}
        confirmText="Khôi phục ngay"
        cancelText="Hủy"
        tone="primary"
      />
    </div>
  )
}
