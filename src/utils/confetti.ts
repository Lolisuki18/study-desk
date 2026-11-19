/**
 * Lightweight canvas-based confetti celebration effect.
 * Pure DOM & Canvas, zero dependencies, self-cleaning.
 */
export function fireConfetti(durationMs = 2500) {
  if (typeof window === 'undefined') return

  const canvas = document.createElement('canvas')
  canvas.style.position = 'fixed'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.width = '100vw'
  canvas.style.height = '100vh'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '9999'
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.remove()
    return
  }

  const resize = () => {
    canvas.width = window.innerWidth * window.devicePixelRatio
    canvas.height = window.innerHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
  }
  resize()

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6']
  const count = 75
  const particles: Array<{
    x: number
    y: number
    w: number
    h: number
    color: string
    vx: number
    vy: number
    rot: number
    vRot: number
    opacity: number
  }> = []

  for (let i = 0; i < count; i++) {
    particles.push({
      x: window.innerWidth * (0.2 + Math.random() * 0.6),
      y: window.innerHeight * (0.3 + Math.random() * 0.2),
      w: 8 + Math.random() * 6,
      h: 5 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 12,
      vy: -8 - Math.random() * 8,
      rot: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 12,
      opacity: 1,
    })
  }

  const startTime = Date.now()
  let animId: number

  const frame = () => {
    const elapsed = Date.now() - startTime
    const progress = elapsed / durationMs
    if (progress >= 1) {
      canvas.remove()
      return
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.35 // gravity
      p.vx *= 0.98 // air resistance
      p.rot += p.vRot
      p.opacity = Math.max(0, 1 - progress)

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rot * Math.PI) / 180)
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.opacity
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    }

    animId = requestAnimationFrame(frame)
  }

  animId = requestAnimationFrame(frame)

  setTimeout(() => {
    cancelAnimationFrame(animId)
    if (canvas.parentNode) canvas.remove()
  }, durationMs + 100)
}
