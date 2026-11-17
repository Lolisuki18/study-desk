// Generates the PWA icons in public/ (icon-192.png, icon-512.png) with no dependencies.
// Run: node scripts/make-icons.mjs
// The artwork matches public/icon.svg: a dark-to-indigo rounded square with two stacked white cards.
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

/** signed distance to a rounded rectangle centred at (cx, cy); negative = inside */
const roundRect = (x, y, cx, cy, hw, hh, r) => {
  const dx = Math.abs(x - cx) - (hw - r)
  const dy = Math.abs(y - cy) - (hh - r)
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - r
}
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)
/** 0..1 coverage from a signed distance, one pixel of anti-aliasing */
const cover = (d) => Math.min(1, Math.max(0, 0.5 - d))

function png(size) {
  const s = size / 512
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1)
    raw[row] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const px = (x + 0.5) / s
      const py = (y + 0.5) / s
      // background: full-bleed square (safe for maskable icons), slate-900 → indigo-600 diagonal
      let rgb = mix([15, 23, 42], [79, 70, 229], Math.min(1, Math.max(0, (px + (512 - py)) / 1024)))
      // back card (translucent white), then front card (white) with two "text" lines
      rgb = mix(rgb, [255, 255, 255], 0.45 * cover(roundRect(px, py, 286, 226, 110, 78, 22) * s))
      rgb = mix(rgb, [255, 255, 255], cover(roundRect(px, py, 236, 286, 110, 78, 22) * s))
      rgb = mix(rgb, [79, 70, 229], cover(roundRect(px, py, 216, 266, 62, 10, 10) * s))
      rgb = mix(rgb, [165, 180, 252], cover(roundRect(px, py, 196, 306, 42, 10, 10) * s))
      const o = row + 1 + x * 4
      raw[o] = Math.round(rgb[0])
      raw[o + 1] = Math.round(rgb[1])
      raw[o + 2] = Math.round(rgb[2])
      raw[o + 3] = 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public', { recursive: true })
for (const size of [192, 512]) {
  writeFileSync(`public/icon-${size}.png`, png(size))
  console.log(`public/icon-${size}.png`)
}
