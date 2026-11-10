import { Link } from 'react-router-dom'
import { collections } from '../data'
import { useProgress } from '../features/learning/ProgressContext'
import { CollectionsBySubject } from '../components/dashboard/CollectionCard'
import RecentActivity from '../components/dashboard/RecentActivity'
import ExamPlan from '../components/dashboard/ExamPlan'
import { Card, Empty, PageHeader, ProgressBar, Stat } from '../components/ui'
import { pct } from '../utils'

export default function Dashboard() {
  const { summary } = useProgress()
  const overall = pct(summary.mastered, summary.items)
  return (
    <div>
      <PageHeader title="Tổng quan" subtitle="Tổng quan việc học của bạn" />
      <div className="grid grid-cols-4 gap-3">
        <Stat label="Bộ học" value={summary.collections} />
        <Stat label="Số mục học" value={summary.items} />
        <Stat label="Đã thuộc" value={summary.mastered} tone="ok" />
        <Link to="/review">
          <Stat label="Cần ôn" value={summary.needReview} tone={summary.needReview ? 'err' : undefined} hint={`${summary.dueCount} đến hạn`} />
        </Link>
      </div>
      <Card className="mt-3 p-4">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-medium">Tiến độ chung</span>
          <span className="text-muted">
            {summary.mastered} / {summary.items} · {overall}%
          </span>
        </div>
        <ProgressBar value={overall} />
      </Card>

      <ExamPlan />

      <h2 className="mb-3 mt-8 text-lg font-semibold">Bộ học</h2>
      {collections.length ? <CollectionsBySubject list={collections} /> : <Empty>Chưa có bộ học nào.</Empty>}

      <h2 className="mb-3 mt-8 text-lg font-semibold">Hoạt động gần đây</h2>
      <RecentActivity />
    </div>
  )
}
