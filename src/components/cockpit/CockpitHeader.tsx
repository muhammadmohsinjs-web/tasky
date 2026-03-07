interface CockpitHeaderProps {
  dailyStreak: number
  habitsTotal: number
  habitsDone: number
}

export function CockpitHeader({ dailyStreak, habitsTotal, habitsDone }: CockpitHeaderProps) {
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const habitsProgress = habitsTotal > 0 ? Math.round((habitsDone / habitsTotal) * 100) : 0
  const allDone = habitsTotal > 0 && habitsProgress === 100

  return (
    <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 px-5 py-5 shadow-sm backdrop-blur sm:px-6 sm:py-6">
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-sky-100/80 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 left-10 h-36 w-36 rounded-full bg-blue-100/70 blur-2xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Today</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{dateLabel}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
            <span aria-hidden>🔥</span>
            <span>{dailyStreak}-day streak</span>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              allDone
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-100/70 text-slate-600'
            }`}
          >
            <span>{habitsDone}/{habitsTotal || 0} habits</span>
            <span aria-hidden>{allDone ? '✓' : `${habitsProgress}%`}</span>
          </div>
        </div>
      </div>

      {habitsTotal > 0 && (
        <div className="relative mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
            <span>Habit completion</span>
            <span>{habitsProgress}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${
                allDone ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
              style={{ width: `${habitsProgress}%` }}
            />
          </div>
        </div>
      )}
    </header>
  )
}
