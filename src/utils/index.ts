export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const pick = <T,>(arr: readonly T[], n: number) => shuffle(arr).slice(0, n)

export const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100))

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'vừa xong'
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`
  return `${Math.floor(s / 86400)} ngày trước`
}

export const dayKey = (d: Date | string) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

/** lowercase, trim, collapse spaces, drop trailing punctuation. Keeps diacritics. */
export const normalizeAnswer = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFC')
    .replace(/[.,;:!?"'()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
