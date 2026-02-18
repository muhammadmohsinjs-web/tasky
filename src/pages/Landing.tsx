import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  CheckSquare,
  Calendar,
  BarChart3,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  Clock,
  ChevronRight,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Calendar,
    title: 'Calendar-First Planning',
    desc: 'See your tasks laid out on a beautiful monthly calendar. Plan visually, not in endless lists.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Sparkles,
    title: 'Smart Categories',
    desc: 'Color-coded categories keep your projects organized — work, personal, side projects, and more.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: BarChart3,
    title: 'Built-in Analytics',
    desc: 'Track your productivity trends over time. See what you accomplish, not just what you plan.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Zap,
    title: 'Instant Status Tracking',
    desc: 'One-click status cycling: To Do → In Progress → Done. No menus, no friction.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    desc: 'Your data stays yours. Secure authentication with row-level isolation per user.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: Clock,
    title: 'Zero Setup Time',
    desc: 'Sign up, create your first task in under 30 seconds. No tutorials needed.',
    color: 'bg-cyan-50 text-cyan-600',
  },
]

const STEPS = [
  { step: '1', title: 'Sign up free', desc: 'Create your account in seconds' },
  { step: '2', title: 'Add your tasks', desc: 'Drop tasks onto your calendar' },
  { step: '3', title: 'Track progress', desc: 'Watch your productivity grow' },
]


export default function Landing() {
  const navigate = useNavigate()
  const { authenticated } = useAuth()

  const handleCTA = () => {
    navigate(authenticated ? '/dashboard' : '/welcome')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
              <CheckSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-800">Tasky</span>
          </div>
          <div className="hidden sm:flex items-center gap-8 text-sm text-slate-500">
            <a href="#features" className="hover:text-slate-800 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-800 transition-colors">How it works</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/welcome')}
              className="text-sm text-slate-600 hover:text-slate-800 font-medium cursor-pointer transition-colors hidden sm:block"
            >
              Log in
            </button>
            <button
              onClick={handleCTA}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium rounded-lg shadow-sm hover:from-indigo-600 hover:to-violet-700 cursor-pointer transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-indigo-50 via-violet-50 to-transparent rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full text-xs font-medium text-indigo-600 mb-6 animate-fade-in">
            <Zap className="w-3 h-3" />
            The calendar-first task manager
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
            Plan your work.
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Track your progress.
            </span>
          </h1>

          <p className="text-lg text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
            Stop drowning in to-do lists. Tasky puts your tasks on a calendar so you can see the big picture, stay focused, and actually finish what you start.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
            <button
              onClick={handleCTA}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-200 hover:from-indigo-600 hover:to-violet-700 hover:shadow-xl hover:shadow-indigo-200 cursor-pointer transition-all flex items-center gap-2 text-sm"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-3 text-slate-600 font-medium rounded-xl hover:bg-slate-50 cursor-pointer transition-all text-sm"
            >
              See features
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-4 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
            Free forever. No credit card required.
          </p>
        </div>

        {/* Hero visual — App preview mockup */}
        <div className="max-w-4xl mx-auto mt-16 animate-fade-in" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/60 overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <div className="w-3 h-3 rounded-full bg-slate-200" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 bg-white rounded-md border border-slate-200 text-[11px] text-slate-400">
                  app.tasky.dev
                </div>
              </div>
            </div>
            {/* Simulated calendar UI */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <CheckSquare className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Tasky</span>
                </div>
                <span className="text-xs text-slate-400">February 2026</span>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <div key={d} className="text-[10px] text-slate-400 text-center font-medium py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 28 }, (_, i) => {
                  const day = i + 1
                  const isToday = day === 11
                  const hasTasks = [3, 5, 7, 8, 11, 12, 14, 16, 19, 21, 23, 25].includes(day)
                  const taskColors = [
                    ['bg-blue-400', 'bg-amber-400'],
                    ['bg-violet-400'],
                    ['bg-emerald-400', 'bg-blue-400'],
                    ['bg-rose-400'],
                    ['bg-blue-400', 'bg-violet-400', 'bg-emerald-400'],
                    ['bg-amber-400'],
                    ['bg-blue-400'],
                    ['bg-violet-400', 'bg-emerald-400'],
                    ['bg-cyan-400'],
                    ['bg-blue-400'],
                    ['bg-amber-400', 'bg-rose-400'],
                    ['bg-emerald-400'],
                  ]
                  const colorIdx = [3, 5, 7, 8, 11, 12, 14, 16, 19, 21, 23, 25].indexOf(day)
                  return (
                    <div
                      key={day}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 text-xs ${
                        isToday
                          ? 'bg-indigo-50 ring-2 ring-indigo-400 text-indigo-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{day}</span>
                      {hasTasks && (
                        <div className="flex gap-0.5">
                          {taskColors[colorIdx]?.map((c, j) => (
                            <div key={j} className={`w-1.5 h-1.5 rounded-full ${c}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF BAR ─── */}
      <section className="py-8 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>100% free</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Set up in 30 seconds</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Works on all devices</span>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Everything you need. Nothing you don't.
            </h2>
            <p className="text-slate-500 mt-4 max-w-md mx-auto">
              Built for people who want clarity, not complexity.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="group p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-800 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-24 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Simple by design
            </h2>
            <p className="text-slate-500 mt-4">
              Three steps to a more productive you.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map(({ step, title, desc }, i) => (
              <div key={step} className="text-center relative">
                {i < STEPS.length - 1 && (
                  <ChevronRight className="hidden sm:block absolute top-8 -right-5 w-5 h-5 text-slate-300" />
                )}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg shadow-lg shadow-indigo-200">
                  {step}
                </div>
                <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
            Ready to get organized?
          </h2>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto">
            Tasky is completely free. Unlimited tasks, unlimited categories, full analytics. No credit card, no catch.
          </p>
          <button
            onClick={handleCTA}
            className="px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-200 hover:from-indigo-600 hover:to-violet-700 hover:shadow-xl cursor-pointer transition-all flex items-center gap-2 mx-auto text-sm"
          >
            Get started for free
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <CheckSquare className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-700">Tasky</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Contact</a>
          </div>
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Tasky. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
