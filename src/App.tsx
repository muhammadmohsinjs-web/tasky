import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import Landing from './pages/Landing'
import Cockpit from './pages/Cockpit'
import Goals from './pages/Goals'
import GoalDetail from './pages/GoalDetail'
import Backlog from './pages/Backlog'
import CalendarHeatmap from './pages/CalendarHeatmap'
import Categories from './pages/Categories'
import Analytics from './pages/Analytics'
import Welcome from './pages/Welcome'
import NotFound from './pages/NotFound'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import Support from './pages/Support'
import GoogleApiDisclosure from './pages/GoogleApiDisclosure'
import { GlobalApiLoadingIndicator } from './components/ui/GlobalApiLoadingIndicator'
import Tasks from './pages/Tasks'

export default function App() {
  return (
    <>
      <GlobalApiLoadingIndicator />
      <Toaster position="bottom-right" richColors visibleToasts={3} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/support" element={<Support />} />
        <Route path="/google-api-disclosure" element={<GoogleApiDisclosure />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/cockpit" replace />} />
            <Route path="/dashboard" element={<Navigate to="/cockpit" replace />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/planning" element={<Navigate to="/goals" replace />} />
            <Route path="/cockpit" element={<Cockpit />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/goals/:id" element={<GoalDetail />} />
            <Route path="/backlog" element={<Backlog />} />
            <Route path="/calendar" element={<CalendarHeatmap />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/categories" element={<Categories />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
