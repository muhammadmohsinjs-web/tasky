import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute() {
  const { authenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse-soft" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse-soft" style={{ animationDelay: '200ms' }} />
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-soft" style={{ animationDelay: '400ms' }} />
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return <Navigate to="/welcome" replace />
  }

  return <Outlet />
}
