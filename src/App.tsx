import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Categories from './pages/Categories'
import Analytics from './pages/Analytics'
import Welcome from './pages/Welcome'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <>
    <Toaster position="bottom-right" richColors />
    <Routes>
      <Route path="/welcome" element={<Welcome />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  )
}
