import { Link } from 'react-router-dom'
import {
  BookOpen,
  CalendarRange,
  CheckCircle2,
  Flame,
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

      {/* New Practice Modes Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          to="/survival"
          className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-orange-200 dark:border-orange-950/60 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent p-4 transition-all hover:border-orange-400 dark:hover:border-orange-700 hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/30 group-hover:scale-105 transition-transform">
              <Flame size={22} className="fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">Chế độ Sinh tồn 3 mạng</span>
                <span className="rounded-full bg-orange-100 dark:bg-orange-900/50 px-2 py-0.5 text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider">Hot</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">3 ❤️ · 15 giây/câu · Thử thách phản xạ cực căng!</p>
            </div>
          </div>
          <span className="text-xs font-bold text-orange-600 dark:text-orange-400 group-hover:translate-x-1 transition-transform">Bắt đầu →</span>
        </Link>

        <Link
          to="/timeline"
          className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-sky-200 dark:border-sky-950/60 bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent p-4 transition-all hover:border-sky-400 dark:hover:border-sky-700 hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 text-white shadow-sm shadow-sky-500/30 group-hover:scale-105 transition-transform">
              <CalendarRange size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">Trục thời gian sự kiện</span>
                <span className="rounded-full bg-sky-100 dark:bg-sky-900/50 px-2 py-0.5 text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-wider">Mới</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Xâu chuỗi các mốc lịch sử VNR202 theo trình tự năm</p>
            </div>
          </div>
          <span className="text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:translate-x-1 transition-transform">Khám phá →</span>
        </Link>
      </div>

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
