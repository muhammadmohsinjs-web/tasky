import { useMemo, useState } from 'react'
import type { HeatmapDay } from '../../hooks/useCalendarHeatmap'

interface HeatmapCalendarProps {
  data: Record<string, HeatmapDay>
  year: number
  month: number
}

function toISODate(value: Date): string {
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function generateMonthGrid(year: number, month: number) {
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)
  const leadingDays = monthStart.getDay()
  const trailingDays = 6 - monthEnd.getDay()

  const firstGridDate = new Date(year, month, 1 - leadingDays)
  const totalCells = monthEnd.getDate() + leadingDays + trailingDays
  const normalizedCellCount = totalCells <= 35 ? 35 : 42

  return Array.from({ length: normalizedCellCount }, (_, index) => {
    const date = new Date(firstGridDate)
    date.setDate(firstGridDate.getDate() + index)

    return {
      date,
      isoDate: toISODate(date),
      inCurrentMonth: date.getMonth() === month,
      dayNumber: date.getDate(),
    }
  })
}

function getCellClasses(params: {
  isToday: boolean
  isFuture: boolean
  inCurrentMonth: boolean
  pct: number | null
}) {
  const { isToday, isFuture, inCurrentMonth, pct } = params

  let base = 'h-16 rounded-xl border text-sm font-semibold transition-all flex flex-col justify-between p-2 '

  if (!inCurrentMonth) {
    base += 'border-slate-100 bg-slate-50 text-slate-300 '
  } else if (isFuture) {
    base += 'border-slate-200 bg-slate-100 text-slate-300 '
  } else if (pct === null) {
    base += 'border-slate-200 bg-slate-100 text-slate-300 '
  } else if (pct >= 0.8) {
    base += 'border-emerald-500 bg-emerald-500 text-white '
  } else if (pct >= 0.5) {
    base += 'border-amber-400 bg-amber-400 text-white '
  } else if (pct > 0) {
    base += 'border-red-400 bg-red-400 text-white '
  } else {
    base += 'border-slate-200 bg-slate-200 text-slate-500 '
  }

  if (isToday) {
    base += 'ring-2 ring-slate-400 '
  }

  return base
}

function formatSummaryLabel(isoDate: string, entry: HeatmapDay | undefined): string {
  const date = new Date(`${isoDate}T00:00:00`)
  const prefix = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (!entry || entry.total === 0) {
    return `${prefix} - No tasks`
  }

  const pct = Math.round((entry.done / entry.total) * 100)
  return `${prefix} - ${entry.done}/${entry.total} done (${pct}%)`
}

export function HeatmapCalendar({ data, year, month }: HeatmapCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const cells = useMemo(() => generateMonthGrid(year, month), [year, month])
  const todayStr = toISODate(new Date())

  return (
    <div>
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
          <span key={label} className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center">
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell) => {
          const entry = data[cell.isoDate]
          const isToday = cell.isoDate === todayStr
          const isFuture = cell.isoDate > todayStr
          const pctLabel = entry?.pct == null ? '-' : `${Math.round(entry.pct * 100)}%`
          const canOpen = cell.inCurrentMonth && !isFuture

          return (
            <button
              key={cell.isoDate}
              type="button"
              onClick={() => {
                if (!canOpen) return
                setSelectedDate(cell.isoDate)
              }}
              className={getCellClasses({
                isToday,
                isFuture,
                inCurrentMonth: cell.inCurrentMonth,
                pct: entry?.pct ?? null,
              })}
            >
              <span className="text-left leading-none">{cell.dayNumber}</span>
              <span className="text-[11px] font-medium text-left opacity-90">{pctLabel}</span>
            </button>
          )
        })}
      </div>

      {selectedDate ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          {formatSummaryLabel(selectedDate, data[selectedDate])}
        </div>
      ) : null}
    </div>
  )
}
