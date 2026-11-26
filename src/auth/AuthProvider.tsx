import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError, setToken, USER_KEY } from '../lib/api'
import { STAFF_ROLES, AuthContext } from './authContext'
import type { User } from '../types'

function readCachedUser(): User | null {
  try {
    const raw = window.localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function cacheUser(user: User | null) {
  if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user))
  else window.localStorage.removeItem(USER_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readCachedUser)
  const [loading, setLoading] = useState(true)

  const applyUser = useCallback((next: User | null) => {
    setUser(next)
    cacheUser(next)
  }, [])
  const clearSession = useCallback(() => {
    setToken(null)
    applyUser(null)
  }, [applyUser])

  useEffect(() => {
    let active = true
    const finish = () => {
      if (active) setLoading(false)
    }
    if (!window.localStorage.getItem('grovia.auth.token')) {
      finish()
      return
    }
    api.auth
      .me()
      .then(({ user: next }) => {
        if (active) applyUser(next)
      })
      .catch((error: unknown) => {
        if (active && error instanceof ApiError && error.status === 401) clearSession()
      })
      .finally(finish)
    return () => {
      active = false
    }
  }, [applyUser, clearSession])

  useEffect(() => {
    const handleUnauthorized = () => clearSession()
    window.addEventListener('grovia:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('grovia:unauthorized', handleUnauthorized)
  }, [clearSession])

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.auth.login(email, password)
    setToken(result.token)
    applyUser(result.user)
    return result.user
  }, [applyUser])

  const register = useCallback(async (input: {
    name: string
    email: string
    password: string
    password_confirmation: string
    phone?: string
    referral_code?: string
  }) => {
    const result = await api.auth.register(input)
    setToken(result.token)
    applyUser(result.user)
    return result.user
  }, [applyUser])

  const logout = useCallback(async () => {
    try {
      await api.auth.logout()
    } catch {
      // The local session is cleared even when the network call fails.
    }
    setToken(null)
    applyUser(null)
  }, [applyUser])

  const updateProfile = useCallback(async (input: { name: string; phone?: string | null }) => {
    const result = await api.auth.updateProfile(input)
    applyUser(result.user)
    return result.user
  }, [applyUser])

  const changePassword = useCallback(async (input: {
    current_password: string
    password: string
    password_confirmation: string
  }) => {
    await api.auth.changePassword(input)
  }, [])

  const refresh = useCallback(async () => {
    const result = await api.auth.me()
    applyUser(result.user)
  }, [applyUser])

  const value = useMemo(
    () => ({
      user,
      loading,
      isStaff: Boolean(user && STAFF_ROLES.includes(user.role as (typeof STAFF_ROLES)[number])),
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      refresh,
    }),
    [user, loading, login, register, logout, updateProfile, changePassword, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
