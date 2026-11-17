import { Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Collections from './pages/Collections'
import CollectionDetail from './pages/CollectionDetail'
import FlashcardsPage from './pages/FlashcardsPage'
import QuizPage from './pages/QuizPage'
import ReviewPage from './pages/ReviewPage'
import TodayPage from './pages/TodayPage'
import ExamPage from './pages/ExamPage'
import MistakesPage from './pages/MistakesPage'
import SearchPage from './pages/SearchPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="collections" element={<Collections />} />
        <Route path="collections/:id" element={<CollectionDetail />} />
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
