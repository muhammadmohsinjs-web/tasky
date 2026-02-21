import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  authenticated: boolean
  loading: boolean
  user: User | null
  googleAccessToken: string | null
  googleRefreshToken: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshGoogleToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  loading: true,
  user: null,
  googleAccessToken: null,
  googleRefreshToken: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshGoogleToken: async () => null,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null)
  const [googleRefreshToken, setGoogleRefreshToken] = useState<string | null>(null)
  const appBaseUrl = window.location.origin
  const googleScopes = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
    'https://www.googleapis.com/auth/tasks.readonly',
  ].join(' ')

  useEffect(() => {
    // Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.provider_token) {
        setGoogleAccessToken(session.provider_token)
      }
      if (session?.provider_refresh_token) {
        setGoogleRefreshToken(session.provider_refresh_token)
      }
      setLoading(false)
    })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      // Capture Google provider token whenever it's available (e.g. right after OAuth sign-in)
      if (session?.provider_token) {
        setGoogleAccessToken(session.provider_token)
      }
      if (session?.provider_refresh_token) {
        setGoogleRefreshToken(session.provider_refresh_token)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${appBaseUrl}/dashboard`,
        scopes: googleScopes,
        queryParams: {
          access_type: 'offline',
          include_granted_scopes: 'true',
          prompt: 'consent',
        },
      },
    })
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out failed:', error)
        toast.error('Failed to sign out')
        return
      }
      setUser(null)
      setGoogleAccessToken(null)
      setGoogleRefreshToken(null)
    } catch (err) {
      console.error('Sign out failed:', err)
      toast.error('Failed to sign out')
    }
  }

  const refreshGoogleToken = useCallback(async (): Promise<string | null> => {
    // If we already have a token in memory, return it.
    // It may be expired (Google tokens last ~1 hour), but Google will
    // return a 401 in that case which the caller can handle.
    if (googleAccessToken) return googleAccessToken

    // Try to get it from the current session (available right after OAuth)
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.provider_token) {
      setGoogleAccessToken(session.provider_token)
      return session.provider_token
    }

    return null
  }, [googleAccessToken])

  return (
    <AuthContext.Provider value={{ authenticated: !!user, loading, user, googleAccessToken, googleRefreshToken, signInWithGoogle, signOut, refreshGoogleToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
