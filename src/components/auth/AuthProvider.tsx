import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  getAdminProfile,
  getCachedAdminProfile,
  hasActiveAdminSession,
  getActiveAdminSessionExpiresAt,
  hasStoredAdminSession,
  restoreAdminSession,
  subscribeToAdminProfile,
  subscribeToAdminSession,
} from '../../api/auth'
import {
  AuthContext,
  type AdminProfileStatus,
  type AuthStatus,
} from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialProfile = getCachedAdminProfile()
  const [status, setStatus] = useState<AuthStatus>(() =>
    hasActiveAdminSession()
      ? 'authenticated'
      : hasStoredAdminSession()
        ? 'checking'
        : 'anonymous',
  )
  const [profile, setProfile] = useState(initialProfile)
  const [profileStatus, setProfileStatus] = useState<AdminProfileStatus>(
    initialProfile ? 'ready' : 'idle',
  )

  useEffect(() => {
    let isActive = true
    let expirationTimer: ReturnType<typeof setTimeout> | undefined
    const updateProfile = (nextProfile: typeof profile) => {
      if (!isActive) return

      setProfile(nextProfile)
      setProfileStatus(nextProfile ? 'ready' : 'idle')
    }
    const updateStatus = () => {
      if (isActive) {
        const isAuthenticated = hasActiveAdminSession()
        setStatus(isAuthenticated ? 'authenticated' : 'anonymous')
        clearTimeout(expirationTimer)

        if (isAuthenticated) {
          const cachedProfile = getCachedAdminProfile()

          if (cachedProfile) {
            updateProfile(cachedProfile)
          } else {
            setProfileStatus('loading')
            void getAdminProfile()
              .then(updateProfile)
              .catch(() => {
                if (isActive) setProfileStatus('error')
              })
          }
        } else {
          updateProfile(null)
        }

        const expiresAt = isAuthenticated ? getActiveAdminSessionExpiresAt() : null
        if (expiresAt) {
          expirationTimer = setTimeout(
            updateStatus,
            Math.min(Math.max(0, expiresAt - Date.now()), 2_147_483_647),
          )
        }
      }
    }
    const unsubscribeSession = subscribeToAdminSession(updateStatus)
    const unsubscribeProfile = subscribeToAdminProfile(updateProfile)

    void restoreAdminSession().finally(updateStatus)

    return () => {
      isActive = false
      clearTimeout(expirationTimer)
      unsubscribeSession()
      unsubscribeProfile()
    }
  }, [])

  const value = useMemo(
    () => ({ status, profile, profileStatus }),
    [profile, profileStatus, status],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
