import { useMemo, useState } from 'react'
import { Bug, Check, Copy, HelpCircle, Lightbulb, Mail, MessageSquareText, SearchCheck } from 'lucide-react'
import { FEEDBACK_EMAIL } from '../config'
import { mailtoLink } from '../utils/mailto'
import { Button, Card, PageHeader, useToast } from '../components/ui'
import { cx } from '../utils'

const KINDS = [
  { id: 'idea', label: 'Đề xuất tính năng', icon: Lightbulb },
  { id: 'bug', label: 'Báo lỗi', icon: Bug },
  { id: 'answer', label: 'Sai đáp án / nội dung', icon: SearchCheck },
  { id: 'other', label: 'Khác', icon: HelpCircle },
] as const

type Kind = (typeof KINDS)[number]['id']

const HINT: Record<Kind, string> = {
  idea: 'Bạn muốn app có thêm gì, hoặc thay đổi gì cho dễ học hơn?',
  bug: 'Bạn đang làm gì thì lỗi xảy ra, và bạn thấy điều gì? Nếu có thông báo lỗi, hãy dán vào đây.',
  answer: 'Ghi rõ tên bộ học, số câu (hoặc chép câu hỏi), đáp án hiện tại và đáp án bạn cho là đúng, kèm nguồn (trang giáo trình) nếu có.',
  other: 'Bất cứ điều gì bạn muốn nhắn.',
}

/** Where learners send feedback. Nothing is sent by the app itself: the button opens the learner's own mail program. */
export default function FeedbackPage() {
  const { toast } = useToast()
  const [kind, setKind] = useState<Kind>('idea')
  const [text, setText] = useState('')
  const [withTech, setWithTech] = useState(true)
  const [copied, setCopied] = useState(false)

  const tech = useMemo(
    () => [`Trang: ${location.hash || '/'}`, `Trình duyệt: ${navigator.userAgent}`, `Màn hình: ${innerWidth}x${innerHeight}`, `Ngôn ngữ: ${navigator.language}`, `Thời điểm: ${new Date().toLocaleString('vi-VN')}`].join('\n'),
    [],
  )
  const label = KINDS.find((k) => k.id === kind)!.label
  const subject = `[Góc học tập] ${label}`
  const body = `${text.trim()}${withTech ? `\n\n---\nThông tin kỹ thuật (có thể xóa):\n${tech}` : ''}`

  const copy = async (value: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
      toast.success(msg)
    } catch {
      toast.error('Trình duyệt không cho sao chép tự động. Hãy chọn và chép thủ công.')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Góp ý & liên hệ" subtitle="Mọi góp ý, báo lỗi, đề xuất hay chỉ ra câu sai đáp án đều được đón nhận" />

      <Card className="space-y-5 p-6">
        <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <MessageSquareText size={20} />
          </span>
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-ink">Gửi góp ý qua email</p>
            <p className="mt-0.5 break-all font-mono text-[13px] text-indigo-700 dark:text-indigo-300">{FEEDBACK_EMAIL}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                href={`mailto:${FEEDBACK_EMAIL}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1 text-xs font-semibold text-ink hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Mail size={13} /> Mở thư trống
              </a>
              <button
                type="button"
                onClick={() => copy(FEEDBACK_EMAIL, 'Đã sao chép địa chỉ email.')}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1 text-xs font-semibold text-ink hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Copy size={13} /> Sao chép địa chỉ
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium">Bạn muốn gửi gì?</div>
          <div className="flex flex-wrap gap-2">
            {KINDS.map(({ id, label: l, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setKind(id)}
                aria-pressed={kind === id}
                className={cx(
                  'inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors',
                  kind === id ? 'border-ink bg-ink text-white' : 'border-line bg-card text-muted hover:text-ink',
                )}
              >
                <Icon size={14} /> {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="feedback-text" className="mb-1.5 block text-sm font-medium">
            Nội dung
          </label>
          <textarea
            id="feedback-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            placeholder={HINT[kind]}
            className="w-full rounded-2xl border border-line bg-card p-3.5 text-sm leading-relaxed text-ink placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={withTech} onChange={(e) => setWithTech(e.target.checked)} className="mt-1 accent-indigo-600" />
          <span>
            Kèm thông tin kỹ thuật (trang đang mở, trình duyệt, kích thước màn hình) để dễ tìm lỗi.
            <span className="block text-xs text-muted">Không gồm tiến độ học hay dữ liệu cá nhân nào của bạn.</span>
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={text.trim() ? mailtoLink(FEEDBACK_EMAIL, subject, body) : undefined}
            aria-disabled={!text.trim()}
            className={cx(
              'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors',
              text.trim() ? 'cursor-pointer border-ink bg-ink text-white hover:opacity-90' : 'pointer-events-none border-line bg-slate-100 text-muted opacity-60 dark:bg-slate-800',
            )}
          >
            <Mail size={16} /> Mở thư để gửi
          </a>
          <Button disabled={!text.trim()} onClick={() => copy(`Gửi tới: ${FEEDBACK_EMAIL}\nTiêu đề: ${subject}\n\n${body}`, 'Đã sao chép nội dung. Dán vào email rồi gửi.')}>
            {copied ? <Check size={15} className="text-ok" /> : <Copy size={15} />} Sao chép nội dung
          </Button>
        </div>

        <p className="text-xs leading-relaxed text-muted">
          Ứng dụng chạy hoàn toàn trên máy bạn nên không tự gửi gì đi. Nút "Mở thư để gửi" chỉ mở chương trình email của bạn với nội dung đã soạn, bạn xem lại rồi tự bấm gửi. Nếu máy chưa cài chương trình email, hãy dùng "Sao chép nội dung" và gửi tới địa chỉ ở trên bằng Gmail hoặc cách khác.
        </p>
      </Card>
    </div>
  )
}
