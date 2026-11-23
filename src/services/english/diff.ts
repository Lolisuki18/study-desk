/**
 * Letter-level difference utility for IELTS spelling check.
 * Identifies exact missing, extra, or substituted letters.
 */

export interface DiffPart {
  char: string
  status: 'correct' | 'missing' | 'extra' | 'wrong'
}

/**
 * Compares actual string against expected string using Levenshtein distance backtracking.
 */
export function computeSpellingDiff(actual: string, expected: string): {
  isExact: boolean
  similarity: number
  parts: DiffPart[]
} {
  const s1 = actual.trim().toLowerCase()
  const s2 = expected.trim().toLowerCase()

  if (s1 === s2) {
    return {
      isExact: true,
      similarity: 1.0,
      parts: s2.split('').map((c) => ({ char: c, status: 'correct' })),
    }
  }

  const m = s1.length
  const n = s2.length

  // DP table for edit distance
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j], // deletion (extra letter)
          dp[i][j - 1], // insertion (missing letter)
          dp[i - 1][j - 1] // substitution (wrong letter)
        )
      }
    }
  }

  // Backtracking to find alignment
  let i = m
  let j = n
  const reversedParts: DiffPart[] = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && s1[i - 1] === s2[j - 1]) {
      reversedParts.push({ char: s2[j - 1], status: 'correct' })
      i--
      j--
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      reversedParts.push({ char: s2[j - 1], status: 'wrong' })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j] === dp[i][j - 1] + 1)) {
      reversedParts.push({ char: s2[j - 1], status: 'missing' })
      j--
    } else if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + 1)) {
      reversedParts.push({ char: s1[i - 1], status: 'extra' })
      i--
    } else {
      break
    }
  }

  const parts = reversedParts.reverse()
  const maxLen = Math.max(m, n)
  const distance = dp[m][n]
  const similarity = maxLen > 0 ? Math.max(0, (maxLen - distance) / maxLen) : 1

  return {
    isExact: false,
    similarity: Math.round(similarity * 100) / 100,
    parts,
  }
}
