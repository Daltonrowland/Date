import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authAPI, type AuthUser } from '../api/client'

interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (token: string, user: Partial<AuthUser>) => void
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('rs_token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      authAPI.me()
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('rs_token')
          setToken(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [token])

  const login = (newToken: string, userData: Partial<AuthUser>) => {
    localStorage.setItem('rs_token', newToken)
    setToken(newToken)
    setUser(userData as AuthUser)
  }

  const logout = () => {
    localStorage.removeItem('rs_token')
    localStorage.removeItem('rs_user')
    setToken(null)
    setUser(null)
  }

  const refresh = async () => {
    try {
      const res = await authAPI.me()
      setUser(res.data)
    } catch {
      logout()
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
