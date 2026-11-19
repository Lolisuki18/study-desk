import type { ActivityRecord, ExamRecord, ProgressRecord } from '../types'
import { getStarredSet } from './storage/starred'

export interface Badge {
  id: string
  title: string
  desc: string
  icon: string
  unlocked: boolean
  progressText?: string
  progressPct: number
}

export function computeBadges({
  progress,
  activity,
  exams,
  longestStreak,
  studiedCount,
  masteredCount,
}: {
  progress: Map<string, ProgressRecord>
  activity: ActivityRecord[]
  exams: ExamRecord[]
  longestStreak: number
  studiedCount: number
  masteredCount: number
}): Badge[] {
  const starredCount = getStarredSet().size

  // 1. Cú đêm chăm chỉ: có hoạt động học trong khoảng 22:00 - 04:00
  const nightCount = activity.filter((a) => {
    const h = new Date(a.ts).getHours()
    return h >= 22 || h < 4
  }).length
  const nightUnlocked = nightCount >= 5

  // 2. Bách phát bách trúng: có bài thi đạt điểm 10
  const perfectExams = exams.filter((e) => e.score10 >= 10).length
  const perfectUnlocked = perfectExams >= 1

  // 3. Tốc độ tia chớp: thi thử đạt >= 8 điểm
  const highExams = exams.filter((e) => e.score10 >= 8).length
  const highExamsUnlocked = highExams >= 1

  // 4. Chiến binh bền bỉ: chuỗi ngày học >= 7 ngày
  const streakUnlocked = longestStreak >= 7

  // 5. Bậc thầy kiến thức: làm chủ >= 100 câu
  const masterUnlocked = masteredCount >= 100

  // 6. Kho tàng ôn tủ: gắn sao >= 10 câu
  const starUnlocked = starredCount >= 10

  // 7. Chiến thần diệt lỗi: câu từng sai nhưng lần gần nhất đã trả lời đúng
  let mistakesFixed = 0
  for (const p of progress.values()) {
    if (p.incorrect > 0 && p.lastResult === 'correct') {
      mistakesFixed++
    }
  }
  const fixedUnlocked = mistakesFixed >= 15

  // 8. Học giả uyên thâm: đã học >= 300 câu
  const scholarUnlocked = studiedCount >= 300

  return [
    {
      id: 'streak',
      title: 'Chiến binh bền bỉ',
      desc: 'Duy trì chuỗi học tập liên tục đạt 7 ngày',
      icon: 'shield',
      unlocked: streakUnlocked,
      progressText: `${Math.min(7, longestStreak)}/7 ngày`,
      progressPct: Math.min(100, Math.round((longestStreak / 7) * 100)),
    },
    {
      id: 'master',
      title: 'Bậc thầy kiến thức',
      desc: 'Đưa ít nhất 100 câu vào hộp thành thạo',
      icon: 'sparkles',
      unlocked: masterUnlocked,
      progressText: `${Math.min(100, masteredCount)}/100 câu`,
      progressPct: Math.min(100, Math.round((masteredCount / 100) * 100)),
    },
    {
      id: 'perfect',
      title: 'Bách phát bách trúng',
      desc: 'Đạt điểm tuyệt đối 10/10 ở bài thi thử',
      icon: 'target',
      unlocked: perfectUnlocked,
      progressText: perfectUnlocked ? 'Đã đạt' : '0/1 lần',
      progressPct: perfectUnlocked ? 100 : 0,
    },
    {
      id: 'high_score',
      title: 'Phong độ đỉnh cao',
      desc: 'Đạt từ 8.0 điểm trở lên trong bài thi thử',
      icon: 'zap',
      unlocked: highExamsUnlocked,
      progressText: `${Math.min(3, highExams)}/3 bài`,
      progressPct: Math.min(100, Math.round((highExams / 3) * 100)),
    },
    {
      id: 'star',
      title: 'Kho tàng ôn tủ',
      desc: 'Đánh dấu sao ít nhất 10 câu hỏi trọng tâm',
      icon: 'star',
      unlocked: starUnlocked,
      progressText: `${Math.min(10, starredCount)}/10 câu`,
      progressPct: Math.min(100, Math.round((starredCount / 10) * 100)),
    },
    {
      id: 'fix_mistakes',
      title: 'Chiến thần diệt lỗi',
      desc: 'Sửa sai thành công 15 câu từng trả lời sai',
      icon: 'eraser',
      unlocked: fixedUnlocked,
      progressText: `${Math.min(15, mistakesFixed)}/15 câu`,
      progressPct: Math.min(100, Math.round((mistakesFixed / 15) * 100)),
    },
    {
      id: 'night_owl',
      title: 'Cú đêm chăm chỉ',
      desc: 'Hoàn thành 5 lượt học sau 22:00 đêm',
      icon: 'moon',
      unlocked: nightUnlocked,
      progressText: `${Math.min(5, nightCount)}/5 lượt`,
      progressPct: Math.min(100, Math.round((nightCount / 5) * 100)),
    },
    {
      id: 'scholar',
      title: 'Học giả uyên thâm',
      desc: 'Học qua ít nhất 300 câu trong ngân hàng',
      icon: 'library',
      unlocked: scholarUnlocked,
      progressText: `${Math.min(300, studiedCount)}/300 câu`,
      progressPct: Math.min(100, Math.round((studiedCount / 300) * 100)),
    },
  ]
}
