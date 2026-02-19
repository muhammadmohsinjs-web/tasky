import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CheckSquare, Calendar, BarChart3, ArrowRight, CheckCircle2, Zap, Shield, Clock, Sparkles } from 'lucide-react'

const FEATURES = [
  {
    icon: Calendar,
    title: 'Calendar-First Planning',
    desc: 'See tasks in time context and plan capacity week by week.',
  },
  {
    icon: Sparkles,
    title: 'Smart Categories',
    desc: 'Maintain clean, color-coded workstreams across teams and projects.',
  },
  {
    icon: BarChart3,
    title: 'Built-in Analytics',
    desc: 'Measure throughput and completion trends without extra tooling.',
  },
  {
    icon: Zap,
    title: 'Fast Status Updates',
    desc: 'Move tasks through states with one click and no modal churn.',
  },
  {
    icon: Shield,
    title: 'Private by Default',
    desc: 'Every workspace is isolated and access-controlled by design.',
  },
  {
    icon: Clock,
    title: 'Launch in Minutes',
    desc: 'Start tracking work immediately with a minimal setup flow.',
  },
]

const STEPS = [
  { step: '1', title: 'Create your workspace', desc: 'Sign in and set your categories' },
  { step: '2', title: 'Plan tasks on calendar', desc: 'Schedule work with visible load per day' },
  { step: '3', title: 'Ship and review', desc: 'Track execution with dashboards and analytics' },
]

export default function Landing() {
  const navigate = useNavigate()
  const { authenticated } = useAuth()

  const handleCTA = () => {
    navigate(authenticated ? '/dashboard' : '/welcome')
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-700">
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm">
              <CheckSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">Tasky</span>
          </div>
          <div className="hidden sm:flex items-center gap-8 text-sm text-slate-500">
            <a href="#features" className="hover:text-slate-800 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-slate-800 transition-colors">
              How it works
            </a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/welcome')} className="btn btn-ghost hidden sm:flex">
              Log in
            </button>
            <button onClick={handleCTA} className="btn btn-primary">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <section className="pt-28 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[760px] h-[760px] rounded-full bg-blue-100/55 blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs font-semibold text-blue-700 mb-6 animate-fade-in">
            <Zap className="w-3 h-3" />
            Built for focused execution
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-slate-900 tracking-tight leading-[1.08] mb-6 animate-fade-in" style={{ animationDelay: '80ms', animationFillMode: 'backwards' }}>
            Plan with clarity.
            <br />
            Execute without noise.
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: '160ms', animationFillMode: 'backwards' }}>
            Tasky gives teams a calm, calendar-first workspace to schedule tasks, track progress, and ship consistently.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in" style={{ animationDelay: '240ms', animationFillMode: 'backwards' }}>
            <button onClick={handleCTA} className="btn btn-primary !px-6 !py-3">
              Start for free
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="btn btn-secondary !px-6 !py-3">
              See product tour
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-4 animate-fade-in" style={{ animationDelay: '320ms', animationFillMode: 'backwards' }}>
            No credit card required.
          </p>
        </div>

        <div className="max-w-5xl mx-auto mt-16 animate-fade-in" style={{ animationDelay: '420ms', animationFillMode: 'backwards' }}>
          <div className="panel overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              </div>
              <div className="mx-auto text-[11px] text-slate-500">app.tasky.dev</div>
            </div>

            <div className="grid lg:grid-cols-[220px_1fr]">
              <div className="border-r border-slate-200 bg-slate-50/70 p-4 space-y-2">
                {['Overview', 'Tasks', 'Categories', 'Analytics'].map((item, index) => (
                  <div key={item} className={`px-3 py-2 rounded-lg text-sm ${index === 1 ? 'bg-white border border-blue-100 text-slate-800 font-semibold' : 'text-slate-500'}`}>
                    {item}
                  </div>
                ))}
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-xs text-slate-500">Total tasks</div>
                    <div className="text-xl font-semibold text-slate-900 mt-1">42</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-xs text-slate-500">In progress</div>
                    <div className="text-xl font-semibold text-slate-900 mt-1">8</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-xs text-slate-500">Completed</div>
                    <div className="text-xl font-semibold text-slate-900 mt-1">24</div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">This week</div>
                  <div className="grid grid-cols-7 gap-2">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => (
                      <div key={d} className="text-[11px] text-slate-400 text-center">
                        {d}
                      </div>
                    ))}
                    {Array.from({ length: 14 }).map((_, i) => (
                      <div key={i} className={`h-9 rounded-md border ${i === 9 ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 border-y border-slate-200 bg-white/70">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-slate-500">
          {['Free plan available', 'No credit card needed', 'Setup in minutes', 'Works on all devices'].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-[0.16em] mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">Everything you need for operational clarity</h2>
            <p className="text-slate-500 mt-4 max-w-xl mx-auto">Purpose-built for teams that want predictable execution, not chaotic task lists.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="panel p-6 hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-800 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 px-6 bg-white/70 border-y border-slate-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-[0.16em] mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">Simple by design</h2>
            <p className="text-slate-500 mt-4">Three steps from setup to consistent delivery.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="panel p-6 text-center">
                <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-4 text-sm font-semibold">{step}</div>
                <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center panel p-10">
          <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight mb-4">Ready to run your work with intent?</h2>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto">Bring structure to planning, visibility to execution, and confidence to delivery.</p>
          <button onClick={handleCTA} className="btn btn-primary !px-7 !py-3.5 mx-auto">
            Get started for free
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  )
}
