import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  hasActiveAdminSession,
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
    const updateStatus = () => {
      if (isActive) {
        setStatus(hasActiveAdminSession() ? 'authenticated' : 'anonymous')
      }
    }
    const unsubscribe = subscribeToAdminSession(updateStatus)

    void restoreAdminSession().finally(updateStatus)

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({ status }), [status])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
