import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { TASK_SELECT } from '../lib/constants'
import type { Task } from '../types'

export function useAllTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAllTasks = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_SELECT)
      .order('date', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('Failed to fetch all tasks:', error)
    } else {
      setTasks(data as unknown as Task[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAllTasks()
  }, [fetchAllTasks])

  return { tasks, loading, refetch: fetchAllTasks }
}
