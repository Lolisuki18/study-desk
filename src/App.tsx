import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'

// every other page is fetched when it is first opened, so the first screen loads less code
const Collections = lazy(() => import('./pages/Collections'))
const CollectionDetail = lazy(() => import('./pages/CollectionDetail'))
const FlashcardsPage = lazy(() => import('./pages/FlashcardsPage'))
const QuizPage = lazy(() => import('./pages/QuizPage'))
const ReviewPage = lazy(() => import('./pages/ReviewPage'))
const TodayPage = lazy(() => import('./pages/TodayPage'))
const ExamPage = lazy(() => import('./pages/ExamPage'))
const MistakesPage = lazy(() => import('./pages/MistakesPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const StatsPage = lazy(() => import('./pages/StatsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const ImportPage = lazy(() => import('./pages/ImportPage'))
const TimelinePage = lazy(() => import('./pages/TimelinePage'))
const SurvivalPage = lazy(() => import('./pages/SurvivalPage'))
const DrillPage = lazy(() => import('./pages/DrillPage'))
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="collections" element={<Collections />} />
        <Route path="collections/:id" element={<CollectionDetail />} />
        <Route path="import" element={<ImportPage />} />
        <Route path="timeline" element={<TimelinePage />} />
        <Route path="survival" element={<SurvivalPage />} />
        <Route path="drill" element={<DrillPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="flashcards/:id?" element={<FlashcardsPage />} />
        <Route path="quiz/:id?" element={<QuizPage />} />
        <Route path="review/:category?" element={<ReviewPage />} />
        <Route path="today" element={<TodayPage />} />
        <Route path="exam" element={<ExamPage />} />
        <Route path="mistakes" element={<MistakesPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="statistics" element={<StatsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}
