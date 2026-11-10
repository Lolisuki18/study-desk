import { Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Collections from './pages/Collections'
import CollectionDetail from './pages/CollectionDetail'
import FlashcardsPage from './pages/FlashcardsPage'
import QuizPage from './pages/QuizPage'
import ReviewPage from './pages/ReviewPage'
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
        <Route path="statistics" element={<StatsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}
