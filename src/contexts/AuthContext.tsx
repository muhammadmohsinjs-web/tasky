import { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  authenticated: boolean
  loading: boolean
  signIn: (pin: string) => boolean
  signOut: () => void
}

const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  loading: true,
  signIn: () => false,
  signOut: () => {},
})

const AUTH_KEY = 'tasky_authenticated'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY)
    setAuthenticated(stored === 'true')
    setLoading(false)
  }, [])

  const signIn = (pin: string): boolean => {
    const correctPin = import.meta.env.VITE_ADMIN_PIN
    if (pin === correctPin) {
      localStorage.setItem(AUTH_KEY, 'true')
      setAuthenticated(true)
      return true
    }
    return false
  }

  const signOut = () => {
    localStorage.removeItem(AUTH_KEY)
    setAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ authenticated, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
