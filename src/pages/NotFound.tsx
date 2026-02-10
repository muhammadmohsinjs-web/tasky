import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-6">
      <div className="text-center max-w-sm animate-fade-in">
        <div className="text-7xl font-bold text-slate-200 mb-2">404</div>
        <h1 className="text-lg font-semibold text-slate-700 mb-2">Page not found</h1>
        <p className="text-sm text-slate-400 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-500 rounded-xl hover:bg-indigo-600 shadow-sm cursor-pointer transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
