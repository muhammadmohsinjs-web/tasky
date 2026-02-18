import { useMemo } from 'react'
import { useAllTasks } from '../hooks/useAllTasks'
import { useCategories } from '../hooks/useCategories'
import { StatCard } from '../components/ui/StatCard'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ListTodo, Circle, Clock, CheckCircle2 } from 'lucide-react'
import { STATUS_CONFIG, MONTH_NAMES, CATEGORY_PALETTE } from '../lib/constants'
import type { TaskStatus } from '../types'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts'

export default function Analytics() {
  const { tasks, loading } = useAllTasks()
  const { categories } = useCategories()

  const stats = useMemo(() => {
    const todo = tasks.filter((t) => t.status === 'todo').length
    const inprogress = tasks.filter((t) => t.status === 'inprogress').length
    const done = tasks.filter((t) => t.status === 'done').length
    return { total: tasks.length, todo, inprogress, done }
  }, [tasks])

  const statusChartData = useMemo(() => [
    { name: 'To Do', value: stats.todo, fill: STATUS_CONFIG.todo.hex },
    { name: 'In Progress', value: stats.inprogress, fill: STATUS_CONFIG.inprogress.hex },
    { name: 'Done', value: stats.done, fill: STATUS_CONFIG.done.hex },
  ], [stats])

  const categoryChartData = useMemo(() => {
    return categories.map((cat) => {
      const paletteMatch = CATEGORY_PALETTE.find((p) => p.color === cat.color)
      return {
        name: cat.short_label,
        fullName: cat.name,
        count: tasks.filter((t) => t.category_id === cat.id).length,
        fill: paletteMatch?.hex ?? '#94a3b8',
      }
    })
  }, [tasks, categories])

  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; done: number; total: number }> = {}

    // Get last 6 months
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months[key] = { month: MONTH_NAMES[d.getMonth()].slice(0, 3), done: 0, total: 0 }
    }

    for (const task of tasks) {
      if (!task.date) continue // skip backlog tasks
      const key = task.date.slice(0, 7) // YYYY-MM
      if (months[key]) {
        months[key].total++
        if (task.status === 'done') months[key].done++
      }
    }

    return Object.values(months)
  }, [tasks])

  if (loading) {
    return <LoadingSpinner message="Loading analytics..." />
  }

  return (
    <div className="p-6 lg:pl-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-slate-800">Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">Track your task progress and productivity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Tasks" value={stats.total} icon={ListTodo} iconColor="bg-indigo-50 text-indigo-600" />
        <StatCard title="To Do" value={stats.todo} icon={Circle} iconColor="bg-slate-100 text-slate-600" />
        <StatCard title="In Progress" value={stats.inprogress} icon={Clock} iconColor="bg-amber-50 text-amber-600" />
        <StatCard title="Done" value={stats.done} icon={CheckCircle2} iconColor="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Status Distribution - Donut */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-700">Status Distribution</h2>
          </div>
          <div className="p-5">
            {stats.total === 0 ? (
              <div className="text-center py-12 text-sm text-slate-400">No data yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({
                        cx, cy, midAngle, outerRadius: or, percent, name,
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      }: any) => {
                        if ((percent ?? 0) === 0) return null
                        const RADIAN = Math.PI / 180
                        const radius = (or ?? 90) + 18
                        const x = cx + radius * Math.cos(-midAngle * RADIAN)
                        const y = cy + radius * Math.sin(-midAngle * RADIAN)
                        return (
                          <text x={x} y={y} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fill="#64748b">
                            {`${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          </text>
                        )
                      }}
                      labelLine={false}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
                    <div key={s} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
                      <span className="text-[11px] text-slate-500">{STATUS_CONFIG[s].label}: {stats[s === 'inprogress' ? 'inprogress' : s]}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tasks by Category - Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-700">Tasks by Category</h2>
          </div>
          <div className="p-5">
            {categoryChartData.length === 0 ? (
              <div className="text-center py-12 text-sm text-slate-400">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
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
        </div>
      </div>

      {/* Completion Over Time - Area Chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700">Activity Over Time (Last 6 Months)</h2>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#818cf8"
                fill="#eef2ff"
                strokeWidth={2}
                name="Total Tasks"
              />
              <Area
                type="monotone"
                dataKey="done"
                stroke="#10b981"
                fill="#ecfdf5"
                strokeWidth={2}
                name="Completed"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="text-[11px] text-slate-500">Total Tasks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-slate-500">Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
