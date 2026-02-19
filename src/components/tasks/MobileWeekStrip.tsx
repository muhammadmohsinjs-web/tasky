import { useMemo, useRef, useState } from 'react'
import type { Task } from '../../types'
import { MONTH_NAMES } from '../../lib/constants'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  year: number
  month: number
  tasks: Task[]
  selectedDate: string | null
  onDateSelect: (date: string) => void
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function MobileWeekStrip({ tasks, selectedDate, onDateSelect }: Props) {
  const [weekOffset, setWeekOffset] = useState(0)
  const touchStartX = useRef(0)

  const today = new Date()
  const todayStr = formatDateStr(today)

  const weekDays = useMemo(() => {
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      return d
    })
  }, [weekOffset])

  const taskCountByDate = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const task of tasks) {
      if (!task.date) continue
      counts[task.date] = (counts[task.date] || 0) + 1
    }
    return counts
  }, [tasks])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      setWeekOffset((prev) => prev + (diff > 0 ? 1 : -1))
    }
  }

  const weekStart = weekDays[0]
  const weekEnd = weekDays[6]
  const weekLabel = weekStart.getMonth() === weekEnd.getMonth()
    ? `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${weekStart.getFullYear()}`
    : `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getDate()} - ${MONTH_NAMES[weekEnd.getMonth()]} ${weekEnd.getDate()}`

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Week navigation header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <button
          onClick={() => setWeekOffset((p) => p - 1)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">{weekLabel}</span>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full cursor-pointer hover:bg-blue-100"
            >
              Today
            </button>
          )}
        </div>
        <button
          onClick={() => setWeekOffset((p) => p + 1)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day strip */}
      <div
        className="flex gap-1 py-3 px-2"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {weekDays.map((day) => {
          const dateStr = formatDateStr(day)
          const count = taskCountByDate[dateStr] || 0
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === todayStr

          return (
            <button
              key={dateStr}
              onClick={() => onDateSelect(dateStr)}
              className={`flex-1 flex flex-col items-center py-2.5 px-1 rounded-xl transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md'
                  : isToday
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wide ${
                isSelected ? 'text-blue-100' : 'text-slate-400'
              }`}>
                {DAY_ABBR[day.getDay()]}
              </span>
              <span className="text-lg font-bold mt-0.5">{day.getDate()}</span>
              {count > 0 && (
                <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                  isSelected ? 'bg-white/70' : 'bg-blue-400'
                }`} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
