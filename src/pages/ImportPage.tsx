import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, BookOpen, Check, CheckCircle2, Copy, Download, FileCode, FileJson, Layers, ListChecks, Plus, Trash2, Upload, UploadCloud, Lightbulb, Sparkles } from 'lucide-react'
import type { Collection } from '../types'
import { validateCollection } from '../utils/validate'
import { isBundledId, refreshDataCollections } from '../data'
import { useCustomCollections } from '../services/storage/customCollections'
import { TEMPLATES, downloadJsonFile, type JsonTemplate } from '../services/templates/examples'
import { Button, Card, ConfirmDialog, Empty, PageHeader, useToast } from '../components/ui'
import { getContentTypeBadge, getSubjectColor } from '../components/dashboard/CollectionCard'
import { parseRawText } from '../services/templates/rawParser'
import { cx } from '../utils'

export default function ImportPage() {
  const { toast } = useToast()
  const nav = useNavigate()
  const { customCollections, add, deleteCollection } = useCustomCollections()

  const [activeTab, setActiveTab] = useState<'raw' | 'upload' | 'templates' | 'manage'>('raw')
  const [selectedTemplate, setSelectedTemplate] = useState<JsonTemplate>(TEMPLATES[0])
  const [copied, setCopied] = useState(false)

  // Smart Raw / AI Text state
  const [rawTitle, setRawTitle] = useState('')
  const [rawSubject, setRawSubject] = useState('')
  const [rawContent, setRawContent] = useState('')
  const [rawParsedResult, setRawParsedResult] = useState<Collection | null>(null)
  const [rawWarnings, setRawWarnings] = useState<string[]>([])
  const [rawSkipped, setRawSkipped] = useState(0)

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
      if (res.ok && isBundledId(parsed.id)) {
        setParsedData(null)
        setValidationErrors([`Mã bộ "${parsed.id}" trùng với một bộ học có sẵn trong app. Hãy đổi "id" thành mã khác để không lẫn tiến độ học.`])
      } else if (res.ok) {
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

  const handleParseRaw = () => {
    try {
      const res = parseRawText(rawContent, {
        title: rawTitle || 'Bộ câu hỏi tự nhập',
        subject: rawSubject,
      })
      setRawParsedResult(res.collection)
      setRawWarnings(res.warnings)
      setRawSkipped(res.skipped)
      if (res.skipped > 0) toast.info(`Nhận diện được ${res.itemCount} câu, bỏ qua ${res.skipped} câu (xem lưu ý bên dưới).`)
      else toast.info(`Đã nhận diện thành công ${res.itemCount} câu hỏi!`)
    } catch (err: any) {
      toast.error(err.message || 'Không thể phân tích văn bản này')
    }
  }

  const handleSaveRawCollection = () => {
    if (!rawParsedResult) return
    const res = add(rawParsedResult)
    if (res.ok) {
      refreshDataCollections()
      toast.info(`Đã tạo bộ học "${rawParsedResult.title}" với ${rawParsedResult.items.length} câu!`)
      setRawContent('')
      setRawTitle('')
      setRawParsedResult(null)
      setRawWarnings([])
      setRawSkipped(0)
      setActiveTab('manage')
    } else {
      toast.error(res.errors[0] || 'Lỗi khi lưu bộ học')
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
          onClick={() => setActiveTab('raw')}
          className={cx(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer',
            activeTab === 'raw'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'border border-line bg-card text-muted hover:text-ink hover:border-slate-300 dark:hover:border-slate-700',
          )}
        >
          <Sparkles size={16} />
          <span>Nhập văn bản thô / AI</span>
        </button>

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

      {/* TAB 0: SMART RAW / AI TEXT IMPORTER */}
      {activeTab === 'raw' && (
        <div className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-5">
            <div>
              <div className="flex items-center gap-2 font-extrabold text-base text-ink">
                <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
                <span>Trình chuyển đổi văn bản thô / ChatGPT sang Bộ học</span>
              </div>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Dán nguyên văn câu hỏi copy từ ChatGPT, Word, PDF hoặc tài liệu ôn thi. Parser thông minh sẽ tự động tách câu hỏi, đáp án A-B-C-D và lời giải thích.
              </p>
            </div>

            {/* Title & Subject Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">Tên bộ câu hỏi:</label>
                <input
                  type="text"
                  value={rawTitle}
                  onChange={(e) => setRawTitle(e.target.value)}
                  placeholder="Ví dụ: Ôn thi Lịch sử Đảng chương 2"
                  className="w-full rounded-xl border border-line bg-card px-3.5 py-2 text-xs font-semibold text-ink placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  Môn học / Chủ đề: <span className="font-normal text-muted">(để trống = "Bộ tự nhập")</span>
                </label>
                <input
                  type="text"
                  value={rawSubject}
                  onChange={(e) => setRawSubject(e.target.value)}
                  placeholder="Ví dụ: Lịch sử Đảng, Triết học, Tiếng Anh..."
                  className="w-full rounded-xl border border-line bg-card px-3.5 py-2 text-xs font-semibold text-ink placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Raw Text Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-ink">Nội dung câu hỏi thô:</label>
                <button
                  type="button"
                  onClick={() => {
                    const sample = `Câu 1: Đảng Cộng sản Việt Nam ra đời vào ngày tháng năm nào?
A. 03/02/1930
B. 19/08/1945
C. 02/09/1945
D. 30/04/1975
Đáp án: A. Giải thích: Hội nghị thành lập Đảng họp tại Cửu Long (Hương Cảng, Trung Quốc) do Nguyễn Ái Quốc chủ trì.

Câu 2: Cơ quan ngôn luận của Hội Việt Nam Cách mạng Thanh niên là tờ báo nào?
A. Báo Lao động
B. Báo Nhân dân
C. Báo Thanh niên
D. Báo Cứu quốc
Đáp án: C. Giải thích: Báo Thanh niên do Nguyễn Ái Quốc sáng lập ngày 21/6/1925.`
                    setRawContent(sample)
                    setRawTitle('Mẫu thử: Lịch sử Đảng')
                    setRawSubject('Mẫu thử')
                  }}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                >
                  Dán nội dung mẫu thử
                </button>
              </div>

              <textarea
                rows={10}
                value={rawContent}
                onChange={(e) => {
                  setRawContent(e.target.value)
                  setRawParsedResult(null)
                }}
                placeholder={`Dán câu hỏi vào đây theo bất kỳ định dạng nào, ví dụ:\n\nCâu 1: Nội dung câu hỏi...\nA. Phương án 1\nB. Phương án 2\nC. Phương án 3\nD. Phương án 4\nĐáp án: A\nGiải thích: Vì lý do...`}
                className="w-full rounded-2xl border border-line bg-slate-50/70 dark:bg-slate-900/50 p-4 font-mono text-xs text-ink placeholder-slate-400 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>

            {/* AI Prompt Template Suggestion */}
            <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-indigo-800 dark:text-indigo-300">
                <span className="flex items-center gap-1.5">
                  <Lightbulb size={14} className="text-amber-500" />
                  <span>Prompt mẫu chuẩn để nhờ ChatGPT / Gemini tạo đề</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const prompt = `Hãy soạn 15 câu trắc nghiệm về môn [TÊN MÔN HỌC, CHỦ ĐỀ CỦA BẠN].
Định dạng mỗi câu như sau:
Câu [Số]: [Nội dung câu hỏi]
A. [Phương án A]
B. [Phương án B]
C. [Phương án C]
D. [Phương án D]
Đáp án: [Chữ cái đáp án đúng]
Giải thích: [Giải thích ngắn gọn súc tích lý do chọn]`
                    navigator.clipboard
                      .writeText(prompt)
                      .then(() => toast.info('Đã sao chép prompt mẫu vào clipboard!'))
                      .catch(() => toast.error('Trình duyệt không cho sao chép tự động. Hãy chọn và chép prompt thủ công.'))
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <Copy size={12} /> Sao chép prompt
                </button>
              </div>
              <p className="text-muted leading-relaxed text-[11px]">
                Copy prompt trên gửi cho AI, sau đó dán toàn bộ kết quả trả về vào khung trên. Ứng dụng sẽ nạp đề vào máy chỉ trong 1 click!
              </p>
            </div>

            {/* Parse Action Button */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-line">
              <Button
                variant="primary"
                disabled={!rawContent.trim()}
                onClick={handleParseRaw}
                className="py-2.5 px-6 font-bold"
              >
                <Sparkles size={16} /> Phân tích văn bản (Parse)
              </Button>
            </div>
          </Card>

          {/* Parsed Preview Area */}
          {rawParsedResult && (
            <Card className="p-6 sm:p-8 space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      ✓ Phân tích thành công {rawParsedResult.items.length} câu hỏi
                    </span>
                    <span className="text-xs text-muted font-medium">({rawParsedResult.contentType})</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-ink mt-1.5">{rawParsedResult.title}</h3>
                </div>

                <Button variant="ok" onClick={handleSaveRawCollection} className="py-2.5 px-6 font-bold shadow-md">
                  <Check size={16} /> Lưu thành bộ học mới
                </Button>
              </div>

              {rawWarnings.length > 0 && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <span className="font-bold">{rawSkipped > 0 ? `Đã bỏ qua ${rawSkipped} câu vì không đọc chắc được đáp án hoặc phương án:` : 'Lưu ý khi phân tích:'}</span>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {rawWarnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Question Items Preview */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {rawParsedResult.items.map((it, idx) => (
                  <div key={it.id} className="rounded-2xl border border-line bg-card p-4 space-y-2 text-xs">
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        {idx + 1}
                      </span>
                      <p className="font-bold text-ink leading-snug">
                        {it.type === 'multiple-choice' ? it.content.question : it.type === 'true-false' ? it.content.statement : it.type === 'vocabulary' ? it.content.term : ''}
                      </p>
                    </div>

                    {it.type === 'multiple-choice' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-7.5">
                        {it.content.options.map((o) => {
                          const isRight = it.content.answer.includes(o.key)
                          return (
                            <div
                              key={o.key}
                              className={cx(
                                'flex items-center gap-2 rounded-xl p-2 border transition-colors',
                                isRight
                                  ? 'border-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold'
                                  : 'border-line text-muted',
                              )}
                            >
                              <span className="font-bold font-mono">[{o.key}]</span>
                              <span>{o.text}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {it.type === 'true-false' && (
                      <div className="pl-7.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Đáp án: {it.content.answer ? 'Đúng' : 'Sai'}</div>
                    )}
                    {it.type === 'vocabulary' && <div className="pl-7.5 text-[11px] text-muted">{it.content.meaning}</div>}

                    {it.type === 'multiple-choice' && it.content.explanation && (
                      <div className="pl-7.5 pt-1 text-[11px] text-muted italic">
                        Giải thích: {it.content.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

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
              <div className="flex items-center gap-1.5 font-bold text-ink"><Lightbulb size={14} className="text-amber-500" /> Hướng dẫn điền thông tin:</div>
              <ul className="space-y-1 text-muted leading-relaxed list-disc pl-5">
                <li><b className="text-ink">id:</b> Mã định danh chỉ gồm chữ thường, số và dấu gạch ngang (VD: <code>triet-hoc-chuong-1</code>), không trùng bộ nào có sẵn. Đổi <code>id</code> sau khi đã học sẽ mất tiến độ.</li>
                <li><b className="text-ink">title, subject, description:</b> Tên bộ học, tên môn học để lọc, và mô tả ngắn (<code>description</code> là bắt buộc).</li>
                <li><b className="text-ink">contentType:</b> <code>multiple-choice</code>, <code>true-false</code>, <code>theory</code>, <code>vocabulary</code>, <code>programming</code> hoặc <code>mixed</code> (nếu bộ có nhiều loại).</li>
                <li><b className="text-ink">items:</b> Mỗi mục cần <code>id</code> riêng trong bộ (không chứa <code>::</code>), <code>type</code> và <code>content</code>. Tùy chọn: <code>tags</code>, <code>source.ref</code>, <code>enrichment</code>.</li>
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
