import { createContext, useContext } from 'react'

import type { AdminProfile } from '../../api/auth'

export type AuthStatus = 'checking' | 'authenticated' | 'anonymous'
export type AdminProfileStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface AuthContextValue {
  status: AuthStatus
  profile: AdminProfile | null
  profileStatus: AdminProfileStatus
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) throw new Error('useAuth must be used inside AuthProvider.')

  return context
}
