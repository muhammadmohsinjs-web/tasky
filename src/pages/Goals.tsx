import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { GoalCard } from '../components/goals/GoalCard'
import { GoalFormModal } from '../components/goals/GoalFormModal'
import { useGoals } from '../hooks/useGoals'
import type { Goal } from '../types'

type GoalFilter = 'active' | 'all' | 'completed'

export default function Goals() {
  const navigate = useNavigate()
  const { goals, isLoading, createGoal } = useGoals()
  const [filter, setFilter] = useState<GoalFilter>('active')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const visibleGoals = useMemo(() => {
    if (filter === 'all') return goals
    if (filter === 'completed') return goals.filter((goal) => goal.status === 'completed')
    return goals.filter((goal) => goal.status === 'active')
  }, [goals, filter])

  async function handleCreateGoal(values: {
    title: string
    description: string | null
    start_date: string | null
    end_date: string | null
    color: string | null
    status?: Goal['status']
  }) {
    try {
      await createGoal(values)
      toast.success('Goal created')
      return true
    } catch {
      toast.error('Failed to create goal')
      return false
    }
  }

  return (
    <div className="content-wrap">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <span className="page-kicker">Focus</span>
          <h1>Goals</h1>
          <p className="page-subtitle">Track long-term outcomes through linked tasks and measurable progress.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
            {([
              { key: 'active', label: 'Active' },
              { key: 'all', label: 'All' },
              { key: 'completed', label: 'Completed' },
            ] as const).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  filter === item.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1 h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Goal
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="panel p-6 text-sm text-slate-500">Loading goals...</div>
      ) : visibleGoals.length === 0 ? (
        <div className="panel p-8 text-center">
          <h3 className="text-lg font-semibold text-slate-700">No goals yet</h3>
          <p className="text-sm text-slate-500 mt-1">Create your first goal to start organizing tasks around outcomes.</p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-1 h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {visibleGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onClick={() => navigate(`/goals/${goal.id}`)}
            />
          ))}
        </div>
      )}

      <GoalFormModal
        isOpen={showCreateModal}
        mode="create"
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateGoal}
      />
    </div>
  )
}
