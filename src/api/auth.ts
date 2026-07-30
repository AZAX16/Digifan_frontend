import { ApiError, apiRequest } from './client'
import { clearQueryCache } from './queryCache'

export interface AdminLoginRequest {
  phoneNumber: string
  password: string
}

export interface AdminContext {
  id: string
  phoneNumber: string | null
  role: string | null
  permissions: string[] | null
}

export interface AdminAuthResult {
  accessToken: string | null
  accessTokenExpiresAt: string | null
  refreshToken: string | null
  refreshTokenExpiresAt: string | null
  administrator?: AdminContext | null
}

interface AdminLoginResult extends AdminAuthResult {
  requiresTwoFactor: boolean
  twoFactorToken: string | null
  twoFactorTokenExpiresAt: string | null
}

export interface AdminTwoFactorChallenge {
  token: string
  expiresAt: string | null
}

export type AdminLoginOutcome =
  | { status: 'authenticated' }
  | {
      status: 'two-factor-required'
      challenge: AdminTwoFactorChallenge
    }

export interface AdminProfile {
  id: string
  phoneNumber: string | null
  isActive: boolean
  role: string | null
  permissions: string[]
}

interface AdminProfileResponse {
  id: string
  phoneNumber: string | null
  isActive: boolean
  role?: string | null
  permissions?: string[] | null
}

interface RefreshSession {
  refreshToken: string
  refreshTokenExpiresAt: string
}

interface ActiveSession extends RefreshSession {
  accessToken: string
  accessTokenExpiresAt: string
}

const STORAGE_KEY = 'digifan.admin.refresh-session.v1'
const ACCESS_TOKEN_LEEWAY_MS = 15_000
const sessionListeners = new Set<() => void>()
const profileListeners = new Set<(profile: AdminProfile | null) => void>()

let activeSession: ActiveSession | null = null
let refreshRequest: Promise<ActiveSession> | undefined
let restoreRequest: Promise<boolean> | undefined
let profileRequest: Promise<AdminProfile> | undefined
let cachedProfile: AdminProfile | undefined

function isFutureDate(value: string | null | undefined, leewayMs = 0) {
  if (!value) return false

  const timestamp = Date.parse(value)

  return Number.isFinite(timestamp) && timestamp > Date.now() + leewayMs
}

function readStoredRefreshSession(): RefreshSession | null {
  try {
    const storedValue = window.sessionStorage.getItem(STORAGE_KEY)

    if (!storedValue) return null

    const parsedValue = JSON.parse(storedValue) as Partial<RefreshSession>

    if (
      typeof parsedValue.refreshToken !== 'string' ||
      !parsedValue.refreshToken.trim() ||
      typeof parsedValue.refreshTokenExpiresAt !== 'string' ||
      !isFutureDate(parsedValue.refreshTokenExpiresAt)
    ) {
      window.sessionStorage.removeItem(STORAGE_KEY)
      return null
    }

    return {
      refreshToken: parsedValue.refreshToken,
      refreshTokenExpiresAt: parsedValue.refreshTokenExpiresAt,
    }
  } catch {
    return null
  }
}

function storeRefreshSession(session: RefreshSession | null) {
  try {
    if (session && isFutureDate(session.refreshTokenExpiresAt)) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Authentication still works in memory when browser storage is unavailable.
  }
}

function notifySessionListeners() {
  sessionListeners.forEach((listener) => listener())
}

function updateCachedProfile(profile: AdminProfile | undefined) {
  cachedProfile = profile
  profileListeners.forEach((listener) => listener(profile ?? null))
}

function normalizePermissions(permissions: string[] | null | undefined) {
  return Array.from(
    new Set(
      (permissions ?? [])
        .filter((permission): permission is string => typeof permission === 'string')
        .map((permission) => permission.trim().toLowerCase())
        .filter(Boolean),
    ),
  )
}

function normalizeOptionalString(value: string | null | undefined) {
  const normalizedValue = value?.trim()

  return normalizedValue?.length ? normalizedValue : null
}

function normalizeProfile(profile: AdminProfileResponse): AdminProfile {
  return {
    id: profile.id,
    phoneNumber: profile.phoneNumber,
    isActive: profile.isActive,
    role: normalizeOptionalString(profile.role),
    permissions: normalizePermissions(profile.permissions),
  }
}

function clearSession() {
  activeSession = null
  profileRequest = undefined
  updateCachedProfile(undefined)
  clearQueryCache()
  storeRefreshSession(null)
  notifySessionListeners()
}

function commitAuthResult(result: AdminAuthResult, fallback?: RefreshSession) {
  const accessToken = result.accessToken?.trim()
  const accessTokenExpiresAt = result.accessTokenExpiresAt
  const nextRefreshToken = result.refreshToken?.trim()
  const refreshToken = nextRefreshToken?.length ? nextRefreshToken : fallback?.refreshToken
  const nextRefreshTokenExpiresAt = result.refreshTokenExpiresAt
  const refreshTokenExpiresAt = nextRefreshToken?.length
    ? nextRefreshTokenExpiresAt
    : fallback?.refreshTokenExpiresAt

  if (!accessToken || !accessTokenExpiresAt || !isFutureDate(accessTokenExpiresAt)) {
    clearSession()
    throw new ApiError(500, 'سرور توکن دسترسی معتبر برنگرداند.')
  }

  if (!refreshToken || !refreshTokenExpiresAt || !isFutureDate(refreshTokenExpiresAt)) {
    clearSession()
    throw new ApiError(500, 'سرور توکن نوسازی معتبر برنگرداند.')
  }

  activeSession = {
    accessToken,
    accessTokenExpiresAt,
    refreshToken,
    refreshTokenExpiresAt,
  }

  if (result.administrator) {
    const currentProfile =
      cachedProfile?.id === result.administrator.id ? cachedProfile : undefined

    updateCachedProfile({
      id: result.administrator.id,
      phoneNumber: result.administrator.phoneNumber,
      isActive: currentProfile?.isActive ?? true,
      role: normalizeOptionalString(result.administrator.role),
      permissions: normalizePermissions(result.administrator.permissions),
    })
  }

  storeRefreshSession({ refreshToken, refreshTokenExpiresAt })
  notifySessionListeners()

  return activeSession
}

function getRefreshSession() {
  if (activeSession && isFutureDate(activeSession.refreshTokenExpiresAt)) {
    return {
      refreshToken: activeSession.refreshToken,
      refreshTokenExpiresAt: activeSession.refreshTokenExpiresAt,
    }
  }

  return readStoredRefreshSession()
}

function withAccessToken(init: RequestInit, accessToken: string) {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)

  return { ...init, headers }
}

export function subscribeToAdminSession(listener: () => void) {
  sessionListeners.add(listener)

  return () => sessionListeners.delete(listener)
}

export function subscribeToAdminProfile(listener: (profile: AdminProfile | null) => void) {
  profileListeners.add(listener)

  return () => profileListeners.delete(listener)
}

export function getCachedAdminProfile() {
  return cachedProfile ?? null
}

export function hasActiveAdminSession() {
  return activeSession !== null && isFutureDate(activeSession.refreshTokenExpiresAt)
}

export function getActiveAdminSessionExpiresAt() {
  if (!activeSession || !isFutureDate(activeSession.refreshTokenExpiresAt)) return null

  const expiresAt = Date.parse(activeSession.refreshTokenExpiresAt)
  return Number.isFinite(expiresAt) ? expiresAt : null
}

export function hasStoredAdminSession() {
  return readStoredRefreshSession() !== null
}

export async function loginAdmin(input: AdminLoginRequest) {
  const result = await apiRequest<AdminLoginResult>('/api/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  if (result.requiresTwoFactor) {
    const token = result.twoFactorToken?.trim()

    if (!token) throw new ApiError(500, 'سرور توکن احراز هویت دومرحله‌ای برنگرداند.')
    if (result.twoFactorTokenExpiresAt && !isFutureDate(result.twoFactorTokenExpiresAt)) {
      throw new ApiError(401, 'مهلت احراز هویت دومرحله‌ای تمام شده است. دوباره وارد شوید.')
    }

    return {
      status: 'two-factor-required',
      challenge: {
        token,
        expiresAt: result.twoFactorTokenExpiresAt,
      },
    } satisfies AdminLoginOutcome
  }

  commitAuthResult(result)
  return { status: 'authenticated' } satisfies AdminLoginOutcome
}

export function requestAdminTwoFactorCode(twoFactorToken: string) {
  return apiRequest<void>('/api/auth/admin/2fa/request', {
    method: 'POST',
    body: JSON.stringify({ twoFactorToken }),
  })
}

export async function verifyAdminTwoFactorCode(twoFactorToken: string, code: string) {
  const result = await apiRequest<AdminAuthResult>('/api/auth/admin/2fa/verify', {
    method: 'POST',
    body: JSON.stringify({ twoFactorToken, code }),
  })

  commitAuthResult(result)
}

export function refreshAdminSession() {
  if (refreshRequest) return refreshRequest

  const refreshSession = getRefreshSession()

  if (!refreshSession) {
    clearSession()
    return Promise.reject(new ApiError(401, 'نشست شما منقضی شده است. دوباره وارد شوید.'))
  }

  refreshRequest = apiRequest<AdminAuthResult>('/api/auth/admin/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: refreshSession.refreshToken }),
  })
    .then((result) => commitAuthResult(result, refreshSession))
    .catch((error: unknown) => {
      clearSession()
      throw error
    })
    .finally(() => {
      refreshRequest = undefined
    })

  return refreshRequest
}

export function restoreAdminSession() {
  if (hasActiveAdminSession()) return Promise.resolve(true)
  if (activeSession) {
    clearSession()
    return Promise.resolve(false)
  }
  if (!hasStoredAdminSession()) return Promise.resolve(false)
  if (restoreRequest) return restoreRequest

  restoreRequest = refreshAdminSession()
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      restoreRequest = undefined
    })

  return restoreRequest
}

async function getAccessToken() {
  if (activeSession && isFutureDate(activeSession.accessTokenExpiresAt, ACCESS_TOKEN_LEEWAY_MS)) {
    return activeSession.accessToken
  }

  return (await refreshAdminSession()).accessToken
}

export async function authorizedRequest<T>(path: string, init: RequestInit = {}) {
  const accessToken = await getAccessToken()

  try {
    return await apiRequest<T>(path, withAccessToken(init, accessToken))
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error
  }

  const refreshedSession = await refreshAdminSession()

  try {
    return await apiRequest<T>(path, withAccessToken(init, refreshedSession.accessToken))
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) clearSession()
    throw error
  }
}

export function getAdminProfile() {
  if (cachedProfile) return Promise.resolve(cachedProfile)

  profileRequest ??= authorizedRequest<AdminProfileResponse>('/api/admin/account/profile')
    .then((response) => {
      const profile = normalizeProfile(response)
      updateCachedProfile(profile)
      return profile
    })
    .finally(() => {
      profileRequest = undefined
    })

  return profileRequest
}

export function changeAdminPhoneNumber(newPhoneNumber: string) {
  return authorizedRequest<void>('/api/admin/account/change-phone-number', {
    method: 'POST',
    body: JSON.stringify({ newPhoneNumber }),
  }).then(() => {
    if (cachedProfile) updateCachedProfile({ ...cachedProfile, phoneNumber: newPhoneNumber })
  })
}

export function changeAdminPassword(currentPassword: string, newPassword: string) {
  return authorizedRequest<void>('/api/admin/account/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export async function logoutAdmin() {
  const accessToken = activeSession?.accessToken
  const refreshSession = getRefreshSession()

  clearSession()

  if (!accessToken || !refreshSession) return

  try {
    await apiRequest<void>('/api/auth/admin/logout', withAccessToken({
      method: 'POST',
      body: JSON.stringify({ refreshToken: refreshSession.refreshToken }),
    }, accessToken))
  } catch {
    // Local logout must succeed even when server-side token revocation is unavailable.
  }
}
