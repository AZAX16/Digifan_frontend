import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  hasActiveAdminSession,
  getActiveAdminSessionExpiresAt,
  hasStoredAdminSession,
  restoreAdminSession,
  subscribeToAdminSession,
} from '../../api/auth'
import { AuthContext, type AuthStatus } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() =>
    hasActiveAdminSession()
      ? 'authenticated'
      : hasStoredAdminSession()
        ? 'checking'
        : 'anonymous',
  )

  useEffect(() => {
    let isActive = true
    let expirationTimer: ReturnType<typeof setTimeout> | undefined
    const updateStatus = () => {
      if (isActive) {
        const isAuthenticated = hasActiveAdminSession()
        setStatus(isAuthenticated ? 'authenticated' : 'anonymous')
        clearTimeout(expirationTimer)

        const expiresAt = isAuthenticated ? getActiveAdminSessionExpiresAt() : null
        if (expiresAt) {
          expirationTimer = setTimeout(
            updateStatus,
            Math.min(Math.max(0, expiresAt - Date.now()), 2_147_483_647),
          )
        }
      }
    }
    const unsubscribe = subscribeToAdminSession(updateStatus)

    void restoreAdminSession().finally(updateStatus)

    return () => {
      isActive = false
      clearTimeout(expirationTimer)
      unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({ status }), [status])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
