import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The interface uses SVG icons only. Emoji are drawn by the operating system's own font (Segoe UI Emoji on Windows,
 * Apple Color Emoji on a Mac), so they look different on every device and clash with the app's style.
 * Plain text arrows such as → are fine; they are not emoji.
 */
const EMOJI = /\p{Emoji_Presentation}|️|[❤✅✔☑]/u

// the raw-text importer READS ✅ marks that ChatGPT writes; it never shows them
const ALLOWED = new Set(['services/templates/rawParser.ts'])

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return files(path)
    return /\.(tsx?|css|html)$/.test(name) && !/\.test\.ts$/.test(name) ? [path] : []
  })
}

describe('interface text', () => {
  it('contains no emoji', () => {
    const root = join(process.cwd(), 'src')
    const found: string[] = []
    for (const file of files(root)) {
      const rel = file.slice(root.length + 1).replace(/\\/g, '/')
      if (ALLOWED.has(rel)) continue
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (EMOJI.test(line)) found.push(`${rel}:${i + 1}: ${line.trim().slice(0, 80)}`)
        })
    }
    expect(found).toEqual([])
  })
})
