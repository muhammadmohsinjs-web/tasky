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

  const allDone = habitsTotal > 0 && habitsDone === habitsTotal

  return (
    <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">{dateLabel}</h1>
        {habitsTotal > 0 && (
          <p
            className={`text-sm mt-1 ${
              allDone ? 'text-emerald-600 font-medium' : 'text-slate-500'
            }`}
          >
            {habitsDone} / {habitsTotal} habits done today{allDone ? ' 🎉' : ''}
          </p>
        )}
      </div>

      {dailyStreak > 0 && (
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-lg font-bold text-orange-500">
            🔥 {dailyStreak}-day streak
          </span>
        </div>
      )}
    </div>
  )
}
