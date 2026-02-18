import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Profile } from '../types'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        // Fallback: build profile from Supabase auth user metadata
        setProfile({
          id: user.id,
          display_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
          email: user.email ?? null,
          created_at: user.created_at,
          updated_at: user.updated_at ?? user.created_at,
        })
      } else {
        setProfile(data as Profile)
      }
      setLoading(false)
    }

    fetchProfile()
  }, [user])

  return { profile, loading }
}
