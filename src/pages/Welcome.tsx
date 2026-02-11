import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CheckSquare, Sparkles, Calendar, BarChart3, Lock } from 'lucide-react'

const features = [
  { icon: Calendar, title: 'Calendar View', desc: 'Plan and visualize tasks on a beautiful monthly calendar' },
  { icon: Sparkles, title: 'Smart Categories', desc: 'Color-coded organization to keep everything sorted' },
  { icon: BarChart3, title: 'Analytics', desc: 'Track your productivity trends with insightful charts' },
]

export default function Welcome() {
  const { authenticated, loading, signIn } = useAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  if (!loading && authenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const success = signIn(pin)
    if (!success) {
      setError(true)
      setShake(true)
      setPin('')
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo & Brand */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg mx-auto mb-4">
            <CheckSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome to Tasky</h1>
          <p className="text-sm text-slate-400 mt-2">
            Organize your work, track progress, stay focused.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-3 mb-8">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 shadow-sm p-4 animate-fade-in"
              style={{ animationDelay: `${(i + 1) * 100}ms`, animationFillMode: 'backwards' }}
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700">{title}</div>
                <div className="text-xs text-slate-400">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* PIN Login */}
        <form
          onSubmit={handleSubmit}
          className={`animate-fade-in ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
          style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}
        >
          <div className="relative mb-3">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(false) }}
              placeholder="Enter admin PIN"
              className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl shadow-sm text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-colors ${
                error ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-indigo-300'
              }`}
              autoFocus
            />
          </div>
          {error && (
            <p className="text-xs text-red-500 mb-3 ml-1 animate-fade-in">
              Incorrect PIN. Please try again.
            </p>
          )}
          <button
            type="submit"
            className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium rounded-xl shadow-sm hover:from-indigo-600 hover:to-violet-700 cursor-pointer transition-all"
          >
            Unlock
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center mt-4 animate-fade-in" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
          Enter your PIN to access your tasks.
        </p>
      </div>
    </div>
  )
}
