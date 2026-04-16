import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/shared/Sidebar'
import DashboardPage from './components/dashboard/DashboardPage'
import UploadPage from './components/upload/UploadPage'
import ResultsPage from './components/results/ResultsPage'
import HistoryPage from './components/history/HistoryPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <div className="app-content">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/" element={<UploadPage />} />
            <Route path="/results/:id" element={<ResultsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
