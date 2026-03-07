import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CheckCircle2, Flame, ListTodo, Target } from 'lucide-react'
import { useAllTasks } from '../hooks/useAllTasks'
import { useCategories } from '../hooks/useCategories'
import { useGoals } from '../hooks/useGoals'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { CATEGORY_PALETTE, MONTH_NAMES } from '../lib/constants'
import { expandRecurrence, formatDateStr } from '../lib/recurrence'
import { StatCard } from '../components/ui/StatCard'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

interface TopHabitStreak {
  task_id: string
  title: string
  current_streak: number
}

function toDateKey(value: Date): string {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return formatDateStr(date)
}

function parseCompletedDate(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return toDateKey(date)
}

export default function Analytics() {
  const { user } = useAuth()
  const { tasks, loading } = useAllTasks()
  const { categories } = useCategories()
  const { goals, isLoading: goalsLoading } = useGoals()
  const { profile, loading: profileLoading } = useProfile()

  const taskItems = useMemo(() => tasks.filter((task) => (task.task_type ?? 'task') === 'task'), [tasks])
  const habitItems = useMemo(() => tasks.filter((task) => (task.task_type ?? 'task') === 'habit'), [tasks])

  const stats = useMemo(() => {
    const done = taskItems.filter((task) => task.status === 'done').length
    const activeGoals = goals.filter((goal) => goal.status === 'active').length
    return {
      tasks: taskItems.length,
      done,
      completionRate: taskItems.length > 0 ? Math.round((done / taskItems.length) * 100) : 0,
      habits: habitItems.length,
      activeGoals,
    }
  }, [goals, habitItems.length, taskItems])

  const categoryChartData = useMemo(() => {
    return categories.map((category) => {
      const paletteMatch = CATEGORY_PALETTE.find((palette) => palette.color === category.color)
      return {
        name: category.short_label,
        fullName: category.name,
        count: taskItems.filter((task) => task.category_id === category.id).length,
        fill: paletteMatch?.hex ?? '#94a3b8',
      }
    })
  }, [categories, taskItems])

  const monthlyCompletionData = useMemo(() => {
    const months: Record<string, { month: string; done: number; total: number }> = {}

    const now = new Date()
    for (let index = 5; index >= 0; index--) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      months[key] = {
        month: MONTH_NAMES[date.getMonth()].slice(0, 3),
        done: 0,
        total: 0,
      }
    }

    for (const task of taskItems) {
      if (!task.date) continue
      const key = task.date.slice(0, 7)
      if (!months[key]) continue
      months[key].total += 1
      if (task.status === 'done') months[key].done += 1
    }

    return Object.values(months)
  }, [taskItems])

  const habitPerformanceData = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const start = new Date(today)
    start.setDate(start.getDate() - 29)

    const rangeStart = new Date(start)
    const rangeEnd = new Date(today)

    const dayKeys: string[] = []
    const scheduledMap: Record<string, number> = {}
    const doneMap: Record<string, number> = {}

    for (let date = new Date(rangeStart); date <= rangeEnd; date.setDate(date.getDate() + 1)) {
      const key = toDateKey(date)
      dayKeys.push(key)
      scheduledMap[key] = 0
      doneMap[key] = 0
    }

    for (const habit of habitItems) {
      const anchorDate = habit.date ?? habit.created_at?.slice(0, 10)
      if (!anchorDate) continue
      const recurrence = habit.recurrence ?? { frequency: 'daily', interval: 1, end_date: null }
      const occurrences = expandRecurrence(anchorDate, recurrence, rangeStart, rangeEnd)
      const occurrenceSet = new Set(occurrences)

      for (const occurrence of occurrenceSet) {
        if (scheduledMap[occurrence] == null) continue
        scheduledMap[occurrence] += 1
      }

      const completedDate = parseCompletedDate(habit.completed_at)
      if (!completedDate) continue
      if (habit.status !== 'done') continue
      if (!occurrenceSet.has(completedDate)) continue
      if (doneMap[completedDate] == null) continue
      doneMap[completedDate] += 1
    }

    const weeks: Array<{ week: string; completion: number }> = []
    for (let index = 0; index < dayKeys.length; index += 7) {
      const slice = dayKeys.slice(index, index + 7)
      const scheduledTotal = slice.reduce((sum, key) => sum + (scheduledMap[key] ?? 0), 0)
      const doneTotal = slice.reduce((sum, key) => sum + (doneMap[key] ?? 0), 0)
      const completion = scheduledTotal > 0 ? Math.round((doneTotal / scheduledTotal) * 100) : 0
      const labelDate = new Date(`${slice[0]}T00:00:00`)
      const label = labelDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      weeks.push({ week: label, completion })
    }

    return weeks
  }, [habitItems])

  const { data: topHabitStreaks = [], isLoading: streaksLoading } = useQuery({
    queryKey: ['analytics-top-habit-streaks', user?.id ?? 'anon'],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: streakRows, error: streakError } = await supabase
        .from('habit_streaks')
        .select('task_id,current_streak')
        .eq('user_id', user!.id)
        .order('current_streak', { ascending: false })
        .limit(3)

      if (streakError) throw streakError

      const rows = (streakRows as Array<{ task_id: string; current_streak: number }> | null) ?? []
      if (rows.length === 0) return [] as TopHabitStreak[]

      const { data: taskRows, error: taskError } = await supabase
        .from('habits')
        .select('id,title')
        .in('id', rows.map((row) => row.task_id))

      if (taskError) throw taskError

      const titleMap = new Map<string, string>()
      for (const row of (taskRows as Array<{ id: string; title: string }> | null) ?? []) {
        titleMap.set(row.id, row.title)
      }

      return rows.map((row) => ({
        task_id: row.task_id,
        current_streak: row.current_streak,
        title: titleMap.get(row.task_id) ?? 'Habit',
      }))
    },
  })

  const activeGoals = useMemo(
    () => goals.filter((goal) => goal.status === 'active'),
    [goals],
  )

  if (loading || goalsLoading || profileLoading || streaksLoading) {
    return <LoadingSpinner message="Loading analytics..." />
  }

  return (
    <div className="content-wrap">
      <div className="page-header">
        <span className="page-kicker">Insights</span>
        <h1>Analytics</h1>
        <p className="page-subtitle">Habits, goals, streaks, and task completion trends in one place.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Task Completion" value={`${stats.completionRate}%`} icon={CheckCircle2} iconColor="bg-emerald-50 text-emerald-700" />
        <StatCard title="Total Tasks" value={stats.tasks} icon={ListTodo} iconColor="bg-blue-50 text-blue-700" />
        <StatCard title="Active Goals" value={stats.activeGoals} icon={Target} iconColor="bg-violet-50 text-violet-700" />
        <StatCard title="Habits" value={stats.habits} icon={Flame} iconColor="bg-amber-50 text-amber-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <section className="panel overflow-hidden">
          <div className="panel-header">
            <h2 className="text-sm font-semibold text-slate-700">Habit Performance (Last 30 Days)</h2>
          </div>
          <div className="panel-body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={habitPerformanceData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#edf2fa" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #dbe3ef' }} formatter={(value) => [`${value}%`, 'Completion']} />
                <Bar dataKey="completion" radius={[6, 6, 0, 0]} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel overflow-hidden">
          <div className="panel-header">
            <h2 className="text-sm font-semibold text-slate-700">Streak Summary</h2>
          </div>
          <div className="panel-body">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Global Current</p>
                <p className="text-lg font-semibold text-slate-800">{profile?.streak?.current ?? 0} days</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Global Longest</p>
                <p className="text-lg font-semibold text-slate-800">{profile?.streak?.longest ?? 0} days</p>
              </div>
            </div>

            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Top Habit Streaks</h3>
            {topHabitStreaks.length === 0 ? (
              <p className="text-sm text-slate-500">No habit streaks yet.</p>
            ) : (
              <div className="space-y-2">
                {topHabitStreaks.map((habit) => (
                  <div key={habit.task_id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <span className="text-sm text-slate-700 truncate pr-2">{habit.title}</span>
                    <span className="text-sm font-semibold text-amber-600">🔥 {habit.current_streak}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="panel overflow-hidden mb-8">
        <div className="panel-header">
          <h2 className="text-sm font-semibold text-slate-700">Goal Progress</h2>
        </div>
        <div className="panel-body">
          {activeGoals.length === 0 ? (
            <p className="text-sm text-slate-500">No active goals.</p>
          ) : (
            <div className="space-y-3">
              {activeGoals.map((goal) => {
                const progress = goal.progress ?? 0
                return (
                  <div key={goal.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-semibold text-slate-700 truncate pr-2">{goal.title}</span>
                      <span className="text-slate-500">{goal.completed_task_count ?? 0} / {goal.task_count ?? 0}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{progress}% complete</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <section className="panel overflow-hidden">
          <div className="panel-header">
            <h2 className="text-sm font-semibold text-slate-700">Tasks by Category</h2>
          </div>
          <div className="panel-body">
            {categoryChartData.length === 0 ? (
              <div className="text-center py-12 text-sm text-slate-400">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#edf2fa" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #dbe3ef' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={((value: any, _name: any, props: any) => [value, props?.payload?.fullName ?? '']) as any}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="panel overflow-hidden">
          <div className="panel-header">
            <h2 className="text-sm font-semibold text-slate-700">Task Completion Rate (Last 6 Months)</h2>
          </div>
          <div className="panel-body">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyCompletionData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#edf2fa" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #dbe3ef' }} />
                <Area type="monotone" dataKey="total" stroke="#2563eb" fill="#dbeafe" strokeWidth={2} name="Total Tasks" />
                <Area type="monotone" dataKey="done" stroke="#059669" fill="#d1fae5" strokeWidth={2} name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  )
}
