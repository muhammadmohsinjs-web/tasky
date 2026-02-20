import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Profile, StreakData } from '../types'

export function useProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = ['profile']

  const { data: profile = null, isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        return {
          id: user.id,
          display_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
          email: user.email ?? null,
          created_at: user.created_at,
          updated_at: user.updated_at ?? user.created_at,
        } as Profile
      }

      return data as Profile
    },
    enabled: !!user,
  })

  const updateStreak = async (completedDate: string) => {
    if (!user || !profile) return

    const streak: StreakData = profile.streak ?? { current: 0, longest: 0, last_completed_date: null }

    const today = new Date(completedDate)
    const lastDate = streak.last_completed_date ? new Date(streak.last_completed_date) : null

    let newCurrent = streak.current
    if (lastDate) {
      const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / 86400000)
      if (diffDays === 1) {
        newCurrent += 1
      } else if (diffDays > 1) {
        newCurrent = 1
      }
    } else {
      newCurrent = 1
    }

    const newLongest = Math.max(streak.longest, newCurrent)
    const newStreak: StreakData = {
      current: newCurrent,
      longest: newLongest,
      last_completed_date: completedDate,
    }

    await supabase
      .from('profiles')
      .update({ streak: newStreak })
      .eq('id', user.id)

    await queryClient.invalidateQueries({ queryKey })
  }

  return { profile, loading, updateStreak }
}
