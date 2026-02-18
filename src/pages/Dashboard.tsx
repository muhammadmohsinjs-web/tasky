import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAllTasks } from '../hooks/useAllTasks'
import { useCategories } from '../hooks/useCategories'
import { useProfile } from '../hooks/useProfile'
import { StatCard } from '../components/ui/StatCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { CategoryBadge } from '../components/ui/CategoryBadge'
import { ListTodo, Circle, Clock, CheckCircle2, Plus, ArrowRight } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { STATUS_CONFIG } from '../lib/constants'
import type { TaskStatus } from '../types'

export default function Dashboard() {
  const { tasks, loading } = useAllTasks()
  const { categories } = useCategories()
  const { profile } = useProfile()
  const navigate = useNavigate()

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

  const recentTasks = useMemo(() => tasks.slice(0, 6), [tasks])

  const categoryStats = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      count: tasks.filter((t) => t.category_id === cat.id).length,
    }))
  }, [tasks, categories])

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-3">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse-soft" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse-soft" style={{ animationDelay: '200ms' }} />
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-soft" style={{ animationDelay: '400ms' }} />
        </div>
        <span className="text-xs text-slate-400">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="p-6 lg:pl-8 max-w-6xl">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-slate-800">
          {greeting}{profile?.display_name ? `, ${profile.display_name.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Tasks" value={stats.total} icon={ListTodo} iconColor="bg-indigo-50 text-indigo-600" />
        <StatCard title="To Do" value={stats.todo} icon={Circle} iconColor="bg-slate-100 text-slate-600" />
        <StatCard title="In Progress" value={stats.inprogress} icon={Clock} iconColor="bg-amber-50 text-amber-600" />
        <StatCard title="Done" value={stats.done} icon={CheckCircle2} iconColor="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Tasks */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Recent Tasks</h2>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentTasks.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                No tasks yet. Create your first task!
              </div>
            ) : (
              recentTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate('/tasks')}
                  className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate('/tasks') }}
                >
                  <StatusBadge status={task.status} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm truncate ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {task.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{task.date ?? 'Unscheduled'}</div>
                  </div>
                  <CategoryBadge category={task.category} />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Status Distribution Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-700">Status Overview</h2>
          </div>
          <div className="p-5">
            {stats.total === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400">No data yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-3">
                  {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
                    <div key={s} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
                      <span className="text-[11px] text-slate-500">{STATUS_CONFIG[s].label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Tasks by Category</h2>
          <button
            onClick={() => navigate('/categories')}
            className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
          >
            Manage <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="p-5">
          {categoryStats.length === 0 ? (
            <div className="text-center py-4 text-sm text-slate-400">No categories</div>
          ) : (
            <div className="space-y-3">
              {categoryStats.map((cat) => {
                const pct = stats.total > 0 ? Math.round((cat.count / stats.total) * 100) : 0
                return (
                  <div key={cat.id} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-600 w-24 truncate">{cat.name}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${cat.color.split(' ')[0]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 w-12 text-right">{cat.count} tasks</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Action */}
      <button
        onClick={() => navigate('/tasks')}
        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 shadow-sm font-medium text-sm cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Add Task
      </button>
    </div>
  )
}
