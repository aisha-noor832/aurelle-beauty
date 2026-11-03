import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, getApiError } from '../api/client'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('aurelle_token')))

  const clearSession = useCallback(() => {
    localStorage.removeItem('aurelle_token')
    setUser(null)
  }, [])

  // Restore an existing session asynchronously. No state is changed directly
  // in the effect body; all updates happen after the network request resolves.
  useEffect(() => {
    const token = localStorage.getItem('aurelle_token')
    if (!token) return undefined

    let active = true

    api.get('/auth/me')
      .then((response) => {
        if (!active) return
        const currentUser = response.data?.data?.user ?? response.data?.data ?? null
        setUser(currentUser)
      })
      .catch((error) => {
        if (!active) return
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('aurelle_token')
        }
        setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('aurelle_token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return null
    }

    try {
      const response = await api.get('/auth/me')
      const currentUser = response.data?.data?.user ?? response.data?.data ?? null
      setUser(currentUser)
      return currentUser
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        clearSession()
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [clearSession])

  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const payload = response.data?.data ?? {}
      if (!payload.token) {
        throw new Error('The server did not return an authentication token.')
      }

      localStorage.setItem('aurelle_token', payload.token)
      const currentUser = payload.user ?? (await refreshUser())
      if (payload.user) setUser(payload.user)
      setLoading(false)
      return currentUser
    } catch (error) {
      const message = error.response
        ? getApiError(error, 'Unable to sign in.')
        : error.message || 'Unable to sign in.'
      throw new Error(message, { cause: error })
    }
  }, [refreshUser])

  const register = useCallback(async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password })
      const payload = response.data?.data ?? {}
      if (payload.token) {
        localStorage.setItem('aurelle_token', payload.token)
        if (payload.user) setUser(payload.user)
        else await refreshUser()
      }
      setLoading(false)
      return { authenticated: Boolean(payload.token), user: payload.user ?? null }
    } catch (error) {
      const message = error.response
        ? getApiError(error, 'Unable to create your account.')
        : error.message || 'Unable to create your account.'
      throw new Error(message, { cause: error })
    }
  }, [refreshUser])

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    refreshUser,
  }), [user, loading, login, register, logout, refreshUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
