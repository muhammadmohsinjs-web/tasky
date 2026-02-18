import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../ui/LoadingSpinner'

export function ProtectedRoute() {
  const { authenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <LoadingSpinner message="" />
      </div>
    )
  }

  if (!authenticated) {
    return <Navigate to="/welcome" replace />
  }

  return <Outlet />
}
