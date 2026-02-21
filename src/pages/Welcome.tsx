import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Sparkles, Calendar, BarChart3 } from 'lucide-react'
import tasksPulseLogo from '../assets/TasksPulse-logo-horizontal.svg'

const features = [
  { icon: Calendar, title: 'Calendar View', desc: 'Plan and visualize tasks on a clean monthly timeline' },
  { icon: Sparkles, title: 'Smart Categories', desc: 'Organize work with clear labels and lightweight taxonomy' },
  { icon: BarChart3, title: 'Analytics', desc: 'Track output and completion trends over time' },
]

export default function Welcome() {
  const { authenticated, loading, signInWithGoogle } = useAuth()
  const [signingIn, setSigningIn] = useState(false)

  if (!loading && authenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } catch {
      setSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8 animate-fade-in">
          <img src={tasksPulseLogo} alt="TasksPulse logo" className="h-16 w-auto max-w-[260px] object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Welcome to TasksPulse</h1>
          <p className="text-sm text-slate-500 mt-2">Organize your work, track progress, and stay focused.</p>
        </div>

        <div className="space-y-3 mb-8">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="panel p-4 animate-fade-in" style={{ animationDelay: `${(i + 1) * 100}ms`, animationFillMode: 'backwards' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">{title}</div>
                  <div className="text-xs text-slate-500">{desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {signingIn ? 'Redirecting...' : 'Continue with Google'}
          </button>
        </div>

        <p className="text-[11px] text-slate-400 text-center mt-4 animate-fade-in" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
          Sign in with your Google account to get started.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500">
          <a href="/privacy" className="hover:text-slate-800">Privacy</a>
          <a href="/terms" className="hover:text-slate-800">Terms</a>
          <a href="/support" className="hover:text-slate-800">Support</a>
        </div>
      </div>
    </div>
  )
}
