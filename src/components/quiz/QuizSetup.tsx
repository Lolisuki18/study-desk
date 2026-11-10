import { useMemo, useState } from 'react'
import type { Entry } from '../../types'
import { availableKinds, buildQuiz, KIND_LABEL, type Question, type QuizKind } from '../../services/quiz/generate'
import { reviewReasons } from '../../services/review/srs'
import { useProgress } from '../../features/learning/ProgressContext'
import { loadSettings } from '../../services/storage/settings'
import { Button, Card } from '../ui'
import { cx } from '../../utils'
import type { QuizMode } from './QuizRunner'
import ExamHistory from './ExamHistory'

export interface QuizStartOptions {
  limitSec?: number
  title: string
  collectionId: string
}

type Scope = 'all' | 'incorrect' | 'review'

export default function QuizSetup({
  entries,
  collectionId,
  title,
  onStart,
}: {
  entries: Entry[]
  collectionId: string
  title: string
  onStart: (q: Question[], m: QuizMode, o: QuizStartOptions) => void
}) {
  const { get } = useProgress()
  const settings = loadSettings()
  const [scope, setScope] = useState<Scope>('all')
  const [mode, setMode] = useState<QuizMode>(settings.quizPracticeDefault ? 'practice' : 'exam')
  const [count, setCount] = useState(settings.quizCount)
  const [randomize, setRandomize] = useState(true)
  const [shuffleOptions, setShuffleOptions] = useState(true)
  const [minutes, setMinutes] = useState<number | null>(null) // null = auto (1 phút / câu)

  const scoped = useMemo(
    () =>
      entries.filter((e) => {
        const p = get(e.collection.id, e.item.id)
        if (scope === 'incorrect') return p?.lastResult === 'incorrect'
        if (scope === 'review') return reviewReasons(p).length > 0
        return true
      }),
    [entries, scope, get],
  )
  const kinds = useMemo(() => availableKinds(scoped), [scoped])
  const [picked, setPicked] = useState<QuizKind[] | null>(null)
  const active = (picked ?? kinds).filter((k) => kinds.includes(k))
  const max = scoped.length
  const n = Math.min(count, max)
  const limitMin = minutes ?? n

  const toggle = (k: QuizKind) => setPicked(active.includes(k) ? active.filter((x) => x !== k) : [...active, k])

  const start = () => {
    const qs = buildQuiz(scoped, { count: n, kinds: active, randomize, shuffleOptions: mode === 'exam' && shuffleOptions, distractorPool: entries })
    if (qs.length) onStart(qs, mode, { limitSec: mode === 'exam' && limitMin > 0 ? Math.round(limitMin * 60) : undefined, title, collectionId })
  }

  const Seg = ({ v, cur, set, children }: { v: string; cur: string; set: (v: any) => void; children: string }) => (
    <button
      onClick={() => set(v)}
      className={cx('rounded-lg border px-3 py-1.5 text-sm', cur === v ? 'border-ink bg-ink text-white' : 'border-line bg-card hover:bg-bg')}
    >
      {children}
    </button>
  )

  return (
    <Card className="max-w-xl space-y-6 p-6">
      <div>
        <div className="mb-2 text-sm font-medium">Chế độ</div>
        <div className="flex gap-2">
          <Seg v="practice" cur={mode} set={setMode}>Luyện tập (phản hồi ngay)</Seg>
          <Seg v="exam" cur={mode} set={setMode}>Thi thử (xem kết quả sau)</Seg>
        </div>
      </div>
      <div>
        <div className="mb-2 text-sm font-medium">Câu hỏi từ</div>
        <div className="flex gap-2">
          <Seg v="all" cur={scope} set={setScope}>Tất cả</Seg>
          <Seg v="incorrect" cur={scope} set={setScope}>Đã làm sai</Seg>
          <Seg v="review" cur={scope} set={setScope}>Cần ôn tập</Seg>
        </div>
        <div className="mt-1 text-xs text-muted">{max} mục khả dụng</div>
      </div>
      <div>
        <div className="mb-2 text-sm font-medium">Số câu: {n}</div>
        <input
          type="range"
          min={1}
          max={Math.max(1, max)}
          value={n}
          disabled={max === 0}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-full accent-ink"
        />
      </div>
      <div>
        <div className="mb-2 text-sm font-medium">Dạng câu hỏi</div>
        <div className="flex flex-wrap gap-2">
          {kinds.map((k) => (
            <button
              key={k}
              onClick={() => toggle(k)}
              className={cx('rounded-lg border px-3 py-1.5 text-sm', active.includes(k) ? 'border-ink bg-bg font-medium' : 'border-line text-muted')}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
          {!kinds.length && <span className="text-sm text-muted">Không có dạng câu hỏi phù hợp.</span>}
        </div>
        <div className="mt-1 text-xs text-muted">Chỉ hiển thị các dạng phù hợp với nội dung của bộ học.</div>
      </div>
      {mode === 'exam' && (
        <div className="space-y-3 rounded-lg border border-line bg-bg p-4">
          <div className="text-sm font-medium">Thiết lập như đề thật</div>
          <label className="flex items-center gap-2 text-sm">
            Thời gian làm bài
            <input
              type="number"
              min={0}
              max={300}
              value={limitMin}
              onChange={(e) => setMinutes(Math.max(0, Number(e.target.value) || 0))}
              className="w-20 rounded-lg border border-line bg-card px-2 py-1 text-right"
            />
            phút <span className="text-xs text-muted">(0 = không giới hạn)</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={shuffleOptions} onChange={(e) => setShuffleOptions(e.target.checked)} className="accent-ink" />
            Trộn thứ tự đáp án A, B, C, D
          </label>
          <p className="text-xs text-muted">Hết giờ bài sẽ tự nộp. Điểm tính theo thang 10 và được lưu vào lịch sử thi thử.</p>
        </div>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={randomize} onChange={(e) => setRandomize(e.target.checked)} className="accent-ink" />
        Trộn ngẫu nhiên câu hỏi
      </label>
      <Button variant="primary" disabled={!active.length || n === 0} onClick={start}>
        Bắt đầu
      </Button>
      <ExamHistory collectionId={collectionId} limit={5} compact />
    </Card>
  )
}
