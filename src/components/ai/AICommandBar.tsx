import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Brain, Command, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useAllTasks } from '../../hooks/useAllTasks'
import { useGoals } from '../../hooks/useGoals'
import { AIConfirmationPanel } from './AIConfirmationPanel'
import type {
  ConversationMessage,
  Proposal,
  ProposedReschedule,
  ProposedTask,
  Task,
  TaskPriority,
} from '../../types'

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

function isComplexRequest(text: string): boolean {
  const lower = text.toLowerCase()
  return ['generate tasks', 'break down', 'plan my day', 'weekly review', 'rearrange'].some((keyword) => lower.includes(keyword))
}

function inferPriority(text: string): TaskPriority {
  const lower = text.toLowerCase()
  if (lower.includes('urgent')) return 'urgent'
  if (lower.includes('high')) return 'high'
  if (lower.includes('low')) return 'low'
  return 'medium'
}

function extractTitleForCreate(text: string): string {
  const cleaned = text
    .replace(/^\s*(add|create|schedule)\s+/i, '')
    .replace(/\s+(today|tomorrow).*$/i, '')
    .trim()
  return cleaned || 'New task'
}

function nextDateISO(daysFromToday: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromToday)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function buildLocalResponse(userText: string, tasks: Task[]): { text?: string; proposal?: Proposal } {
  const text = userText.trim()
  const lower = text.toLowerCase()

  if (/^(add|create|schedule)\b/.test(lower)) {
    const proposedTask: ProposedTask = {
      title: extractTitleForCreate(text),
      date: lower.includes('tomorrow') ? nextDateISO(1) : (lower.includes('today') ? getTodayStr() : null),
      priority: inferPriority(text),
    }

    return {
      proposal: {
        type: 'proposal',
        proposal_type: 'create_tasks',
        summary: 'AI suggests creating 1 task',
        items: [proposedTask],
      },
    }
  }

  if (lower.includes('plan my day') || lower.includes('rearrange')) {
    const today = getTodayStr()
    const todayTasks = tasks.filter((task) => task.date === today && (task.task_type ?? 'task') === 'task')

    if (todayTasks.length === 0) {
      return { text: 'No scheduled tasks found for today to rearrange.' }
    }

    const firstTask = todayTasks[0]
    const proposal: Proposal = {
      type: 'proposal',
      proposal_type: 'reschedule_tasks',
      summary: 'AI suggests rescheduling your next task',
      items: [
        {
          task_id: firstTask.id,
          task_title: firstTask.title,
          new_date: today,
          new_time: '14:00',
          reason: 'Create focused deep-work block.',
        } as ProposedReschedule,
      ],
    }

    return { proposal }
  }

  if (lower.includes('how many tasks') || lower.includes('completed')) {
    const done = tasks.filter((task) => task.status === 'done').length
    return { text: `You have completed ${done} tasks so far.` }
  }

  return {
    text: isComplexRequest(text)
      ? 'Backend AI server is not integrated yet. Complex planning requests will be enabled after backend hookup.'
      : 'Backend AI server is not integrated yet. You can still use add/create/rearrange commands for local proposals.',
  }
}

export function AICommandBar() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { tasks } = useAllTasks()
  const { goals } = useGoals()

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [pendingProposal, setPendingProposal] = useState<Proposal | null>(null)

  const canSend = input.trim().length > 0 && !thinking

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((prev) => !prev)
      }

      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!open) {
      setInput('')
      setMessages([])
      setPendingProposal(null)
      setThinking(false)
    }
  }, [open])

  const quickHint = useMemo(() => {
    if (goals.length === 0) return 'Try: add draft weekly reflection tomorrow'
    return `Try: add task linked to "${goals[0].title}"`
  }, [goals])

  async function sendMessage() {
    const userText = input.trim()
    if (!userText || !user?.id) return

    setInput('')
    setThinking(true)

    const nextMessages: ConversationMessage[] = [
      ...messages,
      { role: 'user', content: userText, timestamp: new Date().toISOString() },
    ]
    setMessages(nextMessages)

    await new Promise((resolve) => setTimeout(resolve, 250))

    const local = buildLocalResponse(userText, tasks)

    if (local.proposal) {
      setPendingProposal(local.proposal)
    }

    if (local.text) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: local.text ?? '', timestamp: new Date().toISOString() },
      ])
    }

    setThinking(false)
  }

  async function applyProposal(proposal: Proposal) {
    if (!user?.id) return

    if (proposal.proposal_type === 'create_tasks') {
      const items = proposal.items as ProposedTask[]
      if (items.length === 0) {
        setPendingProposal(null)
        return
      }

      const rows = items.map((item) => ({
        user_id: user.id,
        title: item.title,
        description: item.description ?? null,
        date: item.date ?? null,
        time: item.time ?? null,
        goal_id: item.goal_id ?? null,
        task_type: 'task',
        status: 'todo',
        priority: item.priority ?? 'medium',
      }))

      const { error } = await supabase.from('tasks').insert(rows)
      if (error) {
        toast.error('Failed to create tasks')
        return
      }
    }

    if (proposal.proposal_type === 'reschedule_tasks') {
      const items = proposal.items as ProposedReschedule[]
      await Promise.all(items.map(async (item) => {
        const updates: { date?: string; time?: string } = {}
        if (item.new_date) updates.date = item.new_date
        if (item.new_time) updates.time = item.new_time
        if (Object.keys(updates).length === 0) return
        await supabase.from('tasks').update(updates).eq('id', item.task_id).eq('user_id', user.id)
      }))
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tasks', user.id] }),
      queryClient.invalidateQueries({ queryKey: ['goals'] }),
      queryClient.invalidateQueries({ queryKey: ['cockpit-tasks', user.id] }),
    ])

    toast.success('Proposal applied')
    setPendingProposal(null)
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: 'Proposal applied successfully.',
        timestamp: new Date().toISOString(),
      },
    ])
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 h-11 rounded-full bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg hover:bg-blue-700"
      >
        <Command className="w-4 h-4" />
        AI
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[1px] p-4" onClick={() => setOpen(false)}>
      <section
        className="mx-auto mt-8 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Brain className="w-4 h-4 text-blue-600" />
            AI Command Bar
          </div>
          <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </header>

        <div className="p-4 space-y-3">
          <p className="text-xs text-slate-500">{quickHint}</p>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {messages.map((message, index) => (
              <div
                key={`${message.timestamp}-${index}`}
                className={`rounded-xl px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white ml-10'
                    : 'bg-slate-100 text-slate-700 mr-10'
                }`}
              >
                {message.content}
              </div>
            ))}
            {thinking ? <p className="text-xs text-slate-400">Thinking...</p> : null}
          </div>

          {pendingProposal ? (
            <AIConfirmationPanel
              proposal={pendingProposal}
              onConfirm={applyProposal}
              onCancel={() => setPendingProposal(null)}
            />
          ) : null}

          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void sendMessage()
                }
              }}
              placeholder="Ask or type command..."
              className="h-11 flex-1 rounded-xl border border-slate-300 px-3 text-sm text-slate-700"
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={!canSend}
              className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-blue-600 text-white disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
