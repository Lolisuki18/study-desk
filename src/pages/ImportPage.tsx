import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileCode,
  FileJson,
  Layers,
  ListChecks,
  Plus,
  Trash2,
  Upload,
  UploadCloud,
} from 'lucide-react'
import type { Collection } from '../types'
import { validateCollection } from '../utils/validate'
import { refreshDataCollections } from '../data'
import { useCustomCollections } from '../services/storage/customCollections'
import { TEMPLATES, downloadJsonFile, type JsonTemplate } from '../services/templates/examples'
import { Button, Card, ConfirmDialog, Empty, PageHeader, useToast } from '../components/ui'
import { getContentTypeBadge, getSubjectColor } from '../components/dashboard/CollectionCard'
import { cx } from '../utils'

export default function ImportPage() {
  const { toast } = useToast()
  const nav = useNavigate()
  const { customCollections, add, deleteCollection } = useCustomCollections()

  const [activeTab, setActiveTab] = useState<'upload' | 'templates' | 'manage'>('upload')
  const [selectedTemplate, setSelectedTemplate] = useState<JsonTemplate>(TEMPLATES[0])
  const [copied, setCopied] = useState(false)

  // Upload state
  const [jsonInput, setJsonInput] = useState('')
  const [fileName, setFileName] = useState('')
  const [parsedData, setParsedData] = useState<Collection | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null)

  const handleFileChange = (file: File) => {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setJsonInput(text)
      validateRawJson(text)
    }
    reader.readAsText(file)
  }

  const validateRawJson = (text: string) => {
    if (!text.trim()) {
      setParsedData(null)
      setValidationErrors([])
      return
    }

    try {
      const parsed = JSON.parse(text)
      const res = validateCollection(parsed)
      if (res.ok) {
        setParsedData(parsed as Collection)
        setValidationErrors([])
      } else {
        setParsedData(null)
        setValidationErrors(res.errors)
      }
    } catch (err: any) {
      setParsedData(null)
      setValidationErrors([`Lỗi cú pháp JSON: ${err.message}`])
    }
  }

  const handleSaveCollection = () => {
    if (!parsedData) return
    const res = add(parsedData)
    if (res.ok) {
      refreshDataCollections()
      toast.info(`Đã thêm thành công bộ học "${parsedData.title}"!`)
      setJsonInput('')
      setFileName('')
      setParsedData(null)
      setActiveTab('manage')
    } else {
      setValidationErrors(res.errors)
    }
  }

  const handleDelete = (id: string) => {
    deleteCollection(id)
    refreshDataCollections()
    toast.info('Đã xóa bộ học tự tải lên')
    setDeleteTarget(null)
  }

  const handleCopyTemplate = (data: object) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    toast.info('Đã sao chép mã JSON mẫu vào bộ nhớ tạm')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadTemplate = (tmpl: JsonTemplate) => {
    downloadJsonFile(`mau-${tmpl.id}.json`, tmpl.data)
    toast.info(`Đã tải xuống file mau-${tmpl.id}.json`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tải lên bộ học & Mẫu JSON"
        subtitle="Tự do nạp ngân hàng câu hỏi cá nhân vào ứng dụng hoặc tải các khung JSON chuẩn"
      />

      {/* Main Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
        <button
          onClick={() => setActiveTab('upload')}
          className={cx(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer',
            activeTab === 'upload'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'border border-line bg-card text-muted hover:text-ink hover:border-slate-300 dark:hover:border-slate-700',
          )}
        >
          <Upload size={16} />
          <span>Tải lên file JSON</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={cx(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer',
            activeTab === 'templates'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'border border-line bg-card text-muted hover:text-ink hover:border-slate-300 dark:hover:border-slate-700',
          )}
        >
          <FileCode size={16} />
          <span>Thư viện JSON mẫu</span>
        </button>

        <button
          onClick={() => setActiveTab('manage')}
          className={cx(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer',
            activeTab === 'manage'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'border border-line bg-card text-muted hover:text-ink hover:border-slate-300 dark:hover:border-slate-700',
          )}
        >
          <Layers size={16} />
          <span>Bộ tự tải lên ({customCollections.length})</span>
        </button>
      </div>

      {/* TAB 1: UPLOAD ZONE */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          <Card className="p-6 sm:p-8">
            {/* Drag & Drop File Box */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file) handleFileChange(file)
              }}
              className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 px-6 py-10 text-center transition-all hover:bg-indigo-50/70 dark:hover:bg-indigo-950/30 cursor-pointer"
            >
              <input
                type="file"
                accept=".json,application/json"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileChange(file)
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 mb-3">
                <UploadCloud size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-ink">
                {fileName ? fileName : 'Chọn hoặc kéo thả file .json vào đây'}
              </h3>
              <p className="mt-1 text-xs text-muted max-w-sm leading-relaxed">
                Hệ thống sẽ tự động đọc, kiểm tra cấu trúc câu hỏi và cho phép bạn xem trước trước khi lưu.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-card border border-line px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 shadow-2xs">
                <FileJson size={14} /> Duyệt file từ máy tính
              </span>
            </div>

            {/* Direct Paste Area (collapsible / secondary) */}
            <div className="mt-6 pt-5 border-t border-line">
              <details className="group">
                <summary className="text-xs font-bold text-muted hover:text-ink cursor-pointer list-none flex items-center justify-between">
                  <span>Hoặc dán trực tiếp mã JSON vào đây</span>
                  <span className="text-[11px] font-normal text-indigo-600 dark:text-indigo-400 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="mt-3 space-y-2">
                  <textarea
                    rows={8}
                    value={jsonInput}
                    onChange={(e) => {
                      setJsonInput(e.target.value)
                      validateRawJson(e.target.value)
                    }}
                    placeholder="Dán nội dung JSON vào đây..."
                    className="w-full rounded-2xl border border-line bg-slate-50 dark:bg-slate-900/60 p-3.5 font-mono text-xs text-ink outline-none focus:border-indigo-500"
                  />
                </div>
              </details>
            </div>
          </Card>

          {/* Validation Feedback & Preview */}
          {validationErrors.length > 0 && (
            <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 p-5 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
                <AlertCircle size={18} />
                <span>Phát hiện {validationErrors.length} lỗi trong file JSON:</span>
              </div>
              <ul className="list-disc pl-6 space-y-1 text-xs text-rose-800 dark:text-rose-300 font-mono">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
              <p className="text-[11px] text-muted pt-1">
                Gợi ý: Mở tab <b>"Thư viện JSON mẫu"</b> để tham khảo cấu trúc chuẩn của từng trường dữ liệu.
              </p>
            </div>
          )}

          {parsedData && (
            <Card className="p-6 border-emerald-300 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/40 via-card to-card dark:from-emerald-950/20 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 size={18} />
                  <span>Dữ liệu hợp lệ! Sẵn sàng thêm vào hệ thống.</span>
                </div>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  {parsedData.items.length} câu hỏi
                </span>
              </div>

              <div className="rounded-2xl border border-line bg-card p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-base font-bold text-ink">{parsedData.title}</h4>
                  <span className="rounded-lg bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                    Môn: {parsedData.subject}
                  </span>
                </div>
                <p className="text-xs text-muted">{parsedData.description}</p>
                <div className="text-[11px] text-muted font-mono pt-1">
                  Mã ID: <b>{parsedData.id}</b> · Định dạng: <b>{parsedData.contentType}</b>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="primary"
                  onClick={handleSaveCollection}
                  className="px-6 py-2.5 text-sm font-bold shadow-md shadow-emerald-600/20 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  <Plus size={16} /> Lưu vào bộ học & Bắt đầu học
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: TEMPLATE PLAYGROUND */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Template Category Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplate.id === tmpl.id
              return (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={cx(
                    'rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'border border-line bg-card text-muted hover:border-slate-300 dark:hover:border-slate-700 hover:text-ink',
                  )}
                >
                  <span>{tmpl.name}</span>
                  <span className={cx('text-[10px] px-1.5 rounded-full font-normal', isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-muted')}>
                    {tmpl.badge}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Template Details Card */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-line">
              <div>
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <FileJson size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Mẫu JSON: {selectedTemplate.name}</span>
                </h3>
                <p className="text-xs text-muted mt-0.5">{selectedTemplate.desc}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={() => handleCopyTemplate(selectedTemplate.data)}
                  className="py-1.5 px-3 text-xs font-semibold cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-ok" /> : <Copy size={14} />}
                  <span>{copied ? 'Đã chép' : 'Sao chép mẫu'}</span>
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleDownloadTemplate(selectedTemplate)}
                  className="py-1.5 px-3.5 text-xs font-bold cursor-pointer"
                >
                  <Download size={14} />
                  <span>Tải file .json</span>
                </Button>
              </div>
            </div>

            {/* Code Display */}
            <div className="relative">
              <pre className="max-h-96 overflow-auto rounded-2xl border border-line bg-slate-900 p-4 font-mono text-xs text-slate-100 leading-relaxed">
                <code>{JSON.stringify(selectedTemplate.data, null, 2)}</code>
              </pre>
            </div>

            {/* Quick Schema Guide */}
            <div className="rounded-2xl border border-line bg-slate-50/60 dark:bg-slate-900/40 p-4 text-xs space-y-2">
              <div className="font-bold text-ink">💡 Hướng dẫn điền thông tin:</div>
              <ul className="space-y-1 text-muted leading-relaxed list-disc pl-5">
                <li><b className="text-ink">id:</b> Mã định danh viết liền không dấu, duy nhất (VD: <code>triet-hoc-chuong-1</code>).</li>
                <li><b className="text-ink">title & subject:</b> Tên hiển thị của bộ học và tên môn học để lọc.</li>
                <li><b className="text-ink">options (với trắc nghiệm):</b> Mảng các phương án gồm <code>key</code> (A, B, C, D) và <code>text</code>.</li>
                <li><b className="text-ink">answer:</b> Phím đáp án đúng (ví dụ <code>"A"</code>, hoặc <code>"ABC"</code> nếu câu hỏi chọn nhiều đáp án).</li>
                <li><b className="text-ink">explanation:</b> Lời giải thích hiển thị sau khi nộp bài hoặc khi lật mặt sau thẻ.</li>
              </ul>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: MANAGE CUSTOM DECKS */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          {customCollections.length === 0 ? (
            <Empty icon={<BookOpen size={36} />}>
              <div className="font-bold text-ink text-base mb-1">Chưa có bộ học tự tải lên nào</div>
              <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed mb-4">
                Bạn có thể nạp file JSON bài học của riêng mình để học Flashcard, Trắc nghiệm và Thi thử hoàn toàn offline.
              </p>
              <Button variant="primary" onClick={() => setActiveTab('upload')} className="py-2 px-4 text-xs font-bold">
                <Upload size={14} /> Tải lên bộ học đầu tiên
              </Button>
            </Empty>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {customCollections.map((c) => {
                const badge = getContentTypeBadge(c.contentType)
                const BadgeIcon = badge.icon
                const subjectColor = getSubjectColor(c.subject)
                return (
                  <Card key={c.id} className="p-5 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={cx('rounded-full px-2.5 py-0.5 text-[11px] font-bold border', subjectColor)}>
                          {c.subject}
                        </span>
                        <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                          Tự tải lên
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-ink">{c.title}</h4>
                      <p className="text-xs text-muted line-clamp-2 mt-1">{c.description}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted font-medium">
                        <span className="flex items-center gap-1">
                          <BadgeIcon size={13} /> {badge.label}
                        </span>
                        <span>·</span>
                        <span>{c.items.length} câu hỏi</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-line">
                      <div className="flex items-center gap-1.5">
                        <Link to={`/flashcards/${c.id}`}>
                          <Button className="py-1.5 px-2.5 text-xs font-semibold">
                            <Layers size={13} /> Thẻ
                          </Button>
                        </Link>
                        <Link to={`/quiz/${c.id}`}>
                          <Button className="py-1.5 px-2.5 text-xs font-semibold">
                            <ListChecks size={13} /> Quiz
                          </Button>
                        </Link>
                      </div>

                      <button
                        onClick={() => setDeleteTarget(c)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Xóa bộ học này"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa bộ học đã tải lên"
        description={`Bạn có chắc chắn muốn xóa bộ học "${deleteTarget?.title}"? Mọi câu hỏi và tiến độ của bộ này sẽ bị xóa khỏi trình duyệt.`}
        confirmText="Xóa vĩnh viễn"
        tone="danger"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget.id)
        }}
      />
    </div>
  )
}
