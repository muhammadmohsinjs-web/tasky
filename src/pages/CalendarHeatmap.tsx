import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HeatmapCalendar } from '../components/calendar/HeatmapCalendar'
import { useCalendarHeatmap } from '../hooks/useCalendarHeatmap'

function monthLabel(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export default function CalendarHeatmap() {
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const { data, isLoading } = useCalendarHeatmap(year, month)

  const legend = useMemo(
    () => [
      { label: '80%+', color: 'bg-emerald-500' },
      { label: '50-80%', color: 'bg-amber-400' },
      { label: '<50%', color: 'bg-red-400' },
      { label: 'No tasks', color: 'bg-slate-200' },
    ],
    [],
  )

  return (
    <div className="content-wrap">
      <div className="page-header">
        <span className="page-kicker">Calendar</span>
        <h1>Calendar</h1>
        <p className="page-subtitle">Read-only completion heatmap by day.</p>
      </div>

      <section className="panel p-5">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <h2 className="text-lg font-semibold text-slate-800">{monthLabel(monthDate)}</h2>

          <button
            type="button"
            onClick={() => setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading heatmap...</p>
        ) : (
          <HeatmapCalendar data={data} year={year} month={month} />
        )}

        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          {legend.map((item) => (
            <div key={item.label} className="inline-flex items-center gap-1.5">
              <span className={`inline-block w-3 h-3 rounded-full ${item.color}`} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
