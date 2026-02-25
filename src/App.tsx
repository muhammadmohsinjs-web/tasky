import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Planning from './pages/Planning'
import Categories from './pages/Categories'
import Analytics from './pages/Analytics'
import Welcome from './pages/Welcome'
import NotFound from './pages/NotFound'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import Support from './pages/Support'
import GoogleApiDisclosure from './pages/GoogleApiDisclosure'
import { GlobalApiLoadingIndicator } from './components/ui/GlobalApiLoadingIndicator'

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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/planning" element={<Planning />} />
            <Route path="/events" element={<Navigate to="/tasks" replace />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
