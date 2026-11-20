import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Download } from 'lucide-react'
import { Button, Modal } from './index'
import { useToast } from './Toast'

type Aspect = 'story' | 'square'

interface Props {
  open: boolean
  onClose: () => void
  stats: {
    mastered: number
    total: number
    streak: number
    studiedToday: number
  }
}

// ---- drawing helpers -------------------------------------------------------------------------------------
const W = 1080
const PAD = 96
const FONT = '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif'

// Icons are the lucide paths (24 × 24, stroked), drawn by hand so the card needs no emoji font and looks the
// same on every device.
const FLAME = ['M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z']
const CHECK = ['M21.801 10A10 10 0 1 1 17 3.335', 'm9 11 3 3L22 4']

const rrect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** Draw text, shrinking the font from `size` until it fits `maxW` (long numbers and translations never overflow). */
function label(
  ctx: CanvasRenderingContext2D,
  str: string,
  x: number,
  y: number,
  o: { size: number; weight?: number; color: string; align?: CanvasTextAlign; maxW?: number; min?: number },
) {
  const weight = o.weight ?? 600
  let size = o.size
  ctx.font = `${weight} ${size}px ${FONT}`
  while (o.maxW && size > (o.min ?? 20) && ctx.measureText(str).width > o.maxW) {
    size -= 2
    ctx.font = `${weight} ${size}px ${FONT}`
  }
  ctx.fillStyle = o.color
  ctx.textAlign = o.align ?? 'left'
  ctx.fillText(str, x, y)
}

function icon(ctx: CanvasRenderingContext2D, paths: string[], x: number, y: number, size: number, color: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size / 24, size / 24)
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = color
  for (const d of paths) ctx.stroke(new Path2D(d))
  ctx.restore()
}

/** The app icon (two stacked cards), redrawn from public/icon.svg. */
function logo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const g = ctx.createLinearGradient(x, y + size, x + size, y)
  g.addColorStop(0, '#312e81')
  g.addColorStop(1, '#6366f1')
  rrect(ctx, x, y, size, size, size * 0.24)
  ctx.fillStyle = g
  ctx.fill()
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size / 512, size / 512)
  const shapes: [number, number, number, number, number, string][] = [
    [176, 148, 220, 156, 22, 'rgba(255,255,255,0.45)'],
    [126, 208, 220, 156, 22, '#ffffff'],
    [154, 256, 124, 20, 10, '#4f46e5'],
    [154, 296, 84, 20, 10, '#a5b4fc'],
  ]
  for (const [sx, sy, sw, sh, sr, fill] of shapes) {
    rrect(ctx, sx, sy, sw, sh, sr)
    ctx.fillStyle = fill
    ctx.fill()
  }
  ctx.restore()
}

function ring(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, thickness: number, frac: number) {
  ctx.lineCap = 'round'
  ctx.lineWidth = thickness
  ctx.strokeStyle = 'rgba(255,255,255,0.09)'
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  if (frac <= 0) return
  const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
  g.addColorStop(0, '#818cf8')
  g.addColorStop(0.55, '#a78bfa')
  g.addColorStop(1, '#f472b6')
  ctx.save()
  ctx.shadowColor = 'rgba(129,140,248,0.55)'
  ctx.shadowBlur = 38
  ctx.strokeStyle = g
  ctx.beginPath()
  // a tiny share still shows as a visible dot instead of nothing
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(frac, 0.012))
  ctx.stroke()
  ctx.restore()
}

/** Glass tile: big number on the left, tinted icon badge on the right, caption underneath. `k` scales everything. */
function tile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  k: number,
  o: { paths: string[]; color: string; tint: string; value: string; caption: string },
) {
  rrect(ctx, x, y, w, h, 40 * k)
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.13)'
  ctx.lineWidth = 2
  ctx.stroke()

  const pad = 40 * k
  const badge = 84 * k
  const bx = x + w - pad - badge
  const by = y + pad * 0.9
  rrect(ctx, bx, by, badge, badge, 26 * k)
  ctx.fillStyle = o.tint
  ctx.fill()
  icon(ctx, o.paths, bx + badge * 0.24, by + badge * 0.24, badge * 0.52, o.color)

  label(ctx, o.value, x + pad, y + h - 92 * k, { size: 104 * k, weight: 800, color: '#ffffff', maxW: bx - x - pad - 16 * k })
  label(ctx, o.caption, x + pad, y + h - 38 * k, { size: Math.max(26, 31 * k), color: '#94a3b8', maxW: w - pad * 2 })
}

function drawCard(canvas: HTMLCanvasElement, aspect: Aspect, stats: Props['stats']) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const story = aspect === 'story'
  const H = story ? 1920 : 1080
  canvas.width = W
  canvas.height = H
  ctx.textBaseline = 'alphabetic'

  // background: deep indigo, two soft glows, a faint dot grid
  const bg = ctx.createLinearGradient(0, 0, W * 0.6, H)
  bg.addColorStop(0, '#0a0f24')
  bg.addColorStop(0.5, '#16134a')
  bg.addColorStop(1, '#0a0f24')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  const glow = (gx: number, gy: number, color: string) => {
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, W * 0.75)
    g.addColorStop(0, color)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  }
  glow(W * 0.12, H * 0.1, 'rgba(99,102,241,0.38)')
  glow(W * 0.92, H * 0.94, 'rgba(236,72,153,0.22)')
  ctx.fillStyle = 'rgba(255,255,255,0.05)'
  for (let gy = 27; gy < H; gy += 54)
    for (let gx = 27; gx < W; gx += 54) {
      ctx.beginPath()
      ctx.arc(gx, gy, 2, 0, Math.PI * 2)
      ctx.fill()
    }

  const date = new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })
  const frac = stats.total > 0 ? stats.mastered / stats.total : 0
  const pctText = stats.mastered === 0 ? '0%' : frac < 0.01 ? '<1%' : `${Math.round(frac * 100)}%`
  const nf = (n: number) => n.toLocaleString('vi-VN')
  const countText = `${nf(stats.mastered)} / ${nf(stats.total)} câu hỏi`

  // brand
  const logoSize = story ? 104 : 88
  const brandY = story ? 120 : 80
  logo(ctx, PAD, brandY, logoSize)
  const nameX = PAD + logoSize + 26
  label(ctx, 'Góc học tập', nameX, brandY + logoSize * 0.52, { size: story ? 52 : 44, weight: 800, color: '#ffffff' })
  label(ctx, 'Personal Study Hub', nameX, brandY + logoSize * 0.52 + (story ? 44 : 38), { size: story ? 28 : 25, color: '#94a3b8' })

  if (story) {
    label(ctx, 'Tiến độ học tập', PAD, 400, { size: 96, weight: 800, color: '#ffffff', maxW: W - PAD * 2 })
    label(ctx, date, PAD, 462, { size: 34, color: '#a5b4fc' })

    const cx = W / 2
    const cy = 930
    const r = 290
    ring(ctx, cx, cy, r, 60, frac)
    label(ctx, pctText, cx, cy + 66, { size: 200, weight: 800, color: '#ffffff', align: 'center', maxW: r * 1.5 })
    label(ctx, 'đã làm chủ', cx, cy + 138, { size: 40, color: '#a5b4fc', align: 'center' })
    label(ctx, countText, cx, 1362, { size: 44, weight: 700, color: '#e0e7ff', align: 'center', maxW: W - PAD * 2 })

    const tw = (W - PAD * 2 - 32) / 2
    tile(ctx, PAD, 1450, tw, 240, 1, { paths: FLAME, color: '#fb923c', tint: 'rgba(251,146,60,0.16)', value: nf(stats.streak), caption: 'Ngày học liên tiếp' })
    tile(ctx, PAD + tw + 32, 1450, tw, 240, 1, { paths: CHECK, color: '#34d399', tint: 'rgba(52,211,153,0.16)', value: nf(stats.studiedToday), caption: 'Câu học hôm nay' })

    label(ctx, 'Ôn tập ngắt quãng · học offline', W / 2, 1830, { size: 30, color: 'rgba(255,255,255,0.5)', align: 'center', maxW: W - PAD * 2 })
  } else {
    label(ctx, date, W - PAD, brandY + logoSize * 0.52, { size: 28, color: '#a5b4fc', align: 'right' })
    label(ctx, 'Tiến độ học tập', PAD, 280, { size: 72, weight: 800, color: '#ffffff', maxW: W - PAD * 2 })

    const r = 185
    const cx = PAD + r + 30
    const cy = 610
    ring(ctx, cx, cy, r, 46, frac)
    label(ctx, pctText, cx, cy + 46, { size: 140, weight: 800, color: '#ffffff', align: 'center', maxW: r * 1.5 })
    label(ctx, 'đã làm chủ', cx, cy + 100, { size: 32, color: '#a5b4fc', align: 'center' })
    label(ctx, countText, cx, 890, { size: 36, weight: 700, color: '#e0e7ff', align: 'center', maxW: r * 2 + 90 })

    const tx = 560
    const tw = W - PAD - tx
    const k = 0.78
    tile(ctx, tx, 420, tw, 190, k, { paths: FLAME, color: '#fb923c', tint: 'rgba(251,146,60,0.16)', value: nf(stats.streak), caption: 'Ngày học liên tiếp' })
    tile(ctx, tx, 640, tw, 190, k, { paths: CHECK, color: '#34d399', tint: 'rgba(52,211,153,0.16)', value: nf(stats.studiedToday), caption: 'Câu học hôm nay' })

    label(ctx, 'Ôn tập ngắt quãng · học offline', W / 2, 1020, { size: 26, color: 'rgba(255,255,255,0.5)', align: 'center', maxW: W - PAD * 2 })
  }
}

const canvasToBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Không tạo được ảnh'))), 'image/png'))

export default function ShareCard({ open, onClose, stats }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [aspect, setAspect] = useState<Aspect>('story')
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  // The dialog renders the canvas a moment after `open` flips, and the web font may still be loading: draw once the
  // element exists, then again when fonts are ready.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    const draw = () => {
      if (!cancelled && canvasRef.current) drawCard(canvasRef.current, aspect, stats)
    }
    const timer = setTimeout(() => {
      draw()
      void document.fonts?.ready.then(draw)
    }, 50)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // stats is rebuilt on every parent render, so depend on its values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, aspect, stats.mastered, stats.total, stats.streak, stats.studiedToday])

  const handleDownload = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      const url = URL.createObjectURL(await canvasToBlob(canvas))
      const link = document.createElement('a')
      link.download = `study-achievement-${new Date().toISOString().slice(0, 10)}.png`
      link.href = url
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      toast.error('Không tải được ảnh, bạn thử lại nhé.')
    }
  }

  const handleCopyImage = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) throw new Error('unsupported')
      // the blob is passed as a promise: Safari only allows the write inside the click if it is still being produced
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': canvasToBlob(canvas) })])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // no image clipboard (older Firefox, insecure page) or permission refused: save the file instead
      await handleDownload()
      toast.info('Trình duyệt không cho sao chép ảnh nên mình đã tải ảnh về máy.')
    }
  }

  const seg = (v: Aspect) =>
    `px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${aspect === v ? 'bg-card text-ink shadow-2xs' : 'text-muted hover:text-ink'}`

  return (
    <Modal open={open} onClose={onClose} title="Thẻ thành tích học tập" className="max-w-xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <span className="text-xs font-semibold text-muted">Định dạng ảnh chia sẻ:</span>
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button onClick={() => setAspect('story')} className={seg('story')}>
              Story (9:16)
            </button>
            <button onClick={() => setAspect('square')} className={seg('square')}>
              Vuông (1:1)
            </button>
          </div>
        </div>

        <div className="flex justify-center bg-slate-950/20 dark:bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-line overflow-hidden">
          <canvas ref={canvasRef} className="rounded-xl shadow-xl max-h-[56vh] w-auto max-w-full object-contain" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>

          <div className="flex items-center gap-2">
            <Button onClick={handleCopyImage}>
              {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
              <span>{copied ? 'Đã sao chép ảnh' : 'Sao chép ảnh'}</span>
            </Button>
            <Button variant="primary" onClick={handleDownload}>
              <Download size={15} />
              <span>Tải ảnh PNG</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
