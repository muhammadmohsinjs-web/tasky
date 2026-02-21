import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Events from './pages/Events'
import Categories from './pages/Categories'
import Analytics from './pages/Analytics'
import Welcome from './pages/Welcome'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <>
    <Toaster position="bottom-right" richColors visibleToasts={3} />
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/welcome" element={<Welcome />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/events" element={<Events />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  )
}
