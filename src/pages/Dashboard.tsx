import { Link } from 'react-router-dom'
import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Library,
  RefreshCw,
} from 'lucide-react'
import { collections } from '../data'
import { useProgress } from '../features/learning/ProgressContext'
import { CollectionsBySubject } from '../components/dashboard/CollectionCard'
import RecentActivity from '../components/dashboard/RecentActivity'
import ExamPlan from '../components/dashboard/ExamPlan'
import DailyGoal from '../components/dashboard/DailyGoal'
import BackupNotice from '../components/dashboard/BackupNotice'
import Readiness from '../components/dashboard/Readiness'
import WelcomeHero from '../components/dashboard/WelcomeHero'
import { Card, Empty, ProgressBar, Stat } from '../components/ui'
import { pct } from '../utils'

export default function Dashboard() {
  const { summary } = useProgress()
  const overall = pct(summary.mastered, summary.items)

  return (
    <div className="space-y-6">
      {/* 1. Hero Welcome & Motivational Card */}
      <WelcomeHero />

      {/* 2. Key Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat
          label="Bộ học"
          value={summary.collections}
          hint="Đã nạp vào hệ thống"
          icon={<Library size={18} />}
        />
        <Stat
          label="Tổng câu hỏi"
          value={summary.items}
          hint="Mục kiến thức"
          icon={<BookOpen size={18} />}
        />
        <Stat
          label="Đã thành thạo"
          value={summary.mastered}
          tone="ok"
          hint={`${overall}% tổng nội dung`}
          icon={<CheckCircle2 size={18} className="text-emerald-500" />}
        />
        <Link to="/review" className="block">
          <Stat
            label="Cần ôn tập"
            value={summary.needReview}
            tone={summary.needReview ? 'err' : undefined}
            hint={`${summary.dueCount} câu đến hạn SRS`}
            icon={<RefreshCw size={18} className={summary.needReview ? 'text-rose-500' : 'text-muted'} />}
          />
        </Link>
      </div>

      {/* 3. Overall Progress Card */}
      <Card className="p-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2 font-bold text-ink">
            <GraduationCap size={18} className="text-indigo-600" />
            <span>Tiến độ làm chủ kiến thức</span>
          </div>
          <span className="text-xs font-semibold text-muted">
            {summary.mastered} / {summary.items} câu · {overall}%
          </span>
        </div>
        <ProgressBar value={overall} className="h-2.5" />
      </Card>

      {/* 4. Daily Goal & Backup Alert */}
      <DailyGoal />
      <BackupNotice />

      {/* 5. Exam Planning & Readiness Estimation */}
      <ExamPlan />
      <Readiness />

      {/* 6. Collections by Subject */}
      <section className="pt-2">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-ink">Các bộ học đã nạp</h2>
            <p className="text-xs text-muted">Chọn một bộ môn để bắt đầu học thẻ hoặc trắc nghiệm</p>
          </div>
          <Link
            to="/collections"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Xem tất cả ({collections.length}) →
          </Link>
        </div>
        {collections.length ? <CollectionsBySubject list={collections} /> : <Empty>Chưa có bộ học nào.</Empty>}
      </section>

      {/* 7. Recent Activity Feed */}
      <section className="pt-2">
        <h2 className="mb-3 text-lg font-bold tracking-tight text-ink">Hoạt động gần đây</h2>
        <RecentActivity />
      </section>
    </div>
  )
}
