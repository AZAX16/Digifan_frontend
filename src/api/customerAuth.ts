import { ApiError, apiRequest } from './client'

export interface CustomerProfile {
  id: string
  phoneNumber: string | null
  isPhoneVerified: boolean
  createdAt: string | null
}

interface CustomerAuthResult {
  accessToken: string | null
  accessTokenExpiresAt: string | null
  refreshToken: string | null
  refreshTokenExpiresAt: string | null
}

interface CustomerSession {
  accessToken: string
  accessTokenExpiresAt: string
  refreshToken: string
  refreshTokenExpiresAt: string
}

type StoredCustomerSession = Pick<CustomerSession, 'refreshToken' | 'refreshTokenExpiresAt'>

const STORAGE_KEY = 'fanino.customer.refresh-session.v1'
const ACCESS_TOKEN_LEEWAY_MS = 15_000

let activeSession: CustomerSession | null = null
let refreshRequest: Promise<CustomerSession> | undefined
let profileRequest: Promise<CustomerProfile> | undefined
let cachedProfile: CustomerProfile | null = null

function isFutureDate(value: string | null | undefined, leewayMs = 0) {
  if (!value) return false

  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && timestamp > Date.now() + leewayMs
}

function readStoredSession(): StoredCustomerSession | null {
  try {
    const storedValue = window.sessionStorage.getItem(STORAGE_KEY)
    if (!storedValue) return null

    const parsedValue = JSON.parse(storedValue) as Partial<StoredCustomerSession>
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

function storeSession(session: StoredCustomerSession | null) {
  try {
    if (session && isFutureDate(session.refreshTokenExpiresAt)) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Customer authentication still works in memory when storage is unavailable.
  }
}

function clearCustomerSession() {
  activeSession = null
  cachedProfile = null
  profileRequest = undefined
  storeSession(null)
}

function getRefreshSession() {
  if (activeSession && isFutureDate(activeSession.refreshTokenExpiresAt)) {
    return {
      refreshToken: activeSession.refreshToken,
      refreshTokenExpiresAt: activeSession.refreshTokenExpiresAt,
    }
  }

  return readStoredSession()
}

function commitAuthResult(result: CustomerAuthResult, fallback?: StoredCustomerSession) {
  const accessToken = result.accessToken?.trim()
  const accessTokenExpiresAt = result.accessTokenExpiresAt
  const nextRefreshToken = result.refreshToken?.trim()
  const refreshToken = nextRefreshToken?.length ? nextRefreshToken : fallback?.refreshToken
  const refreshTokenExpiresAt = nextRefreshToken?.length
    ? result.refreshTokenExpiresAt
    : fallback?.refreshTokenExpiresAt

  if (!accessToken || !accessTokenExpiresAt || !isFutureDate(accessTokenExpiresAt)) {
    clearCustomerSession()
    throw new ApiError(500, 'سرور توکن دسترسی معتبر برنگرداند.')
  }
  if (!refreshToken || !refreshTokenExpiresAt || !isFutureDate(refreshTokenExpiresAt)) {
    clearCustomerSession()
    throw new ApiError(500, 'سرور توکن نوسازی معتبر برنگرداند.')
  }

  const committedSession: CustomerSession = {
    accessToken,
    accessTokenExpiresAt,
    refreshToken,
    refreshTokenExpiresAt,
  }
  activeSession = committedSession
  storeSession({ refreshToken, refreshTokenExpiresAt })
  return committedSession
}

function withAccessToken(init: RequestInit, accessToken: string) {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  return { ...init, headers }
}

async function authenticateCustomer(
  endpoint: '/api/customer/auth/login' | '/api/customer/auth/register',
  phoneNumber: string,
  password: string,
) {
  const result = await apiRequest<CustomerAuthResult>(endpoint, {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, password }),
  })

  commitAuthResult(result)
  return getCustomerProfile()
}

export function loginCustomer(phoneNumber: string, password: string) {
  return authenticateCustomer('/api/customer/auth/login', phoneNumber, password)
}

export function registerCustomer(phoneNumber: string, password: string) {
  return authenticateCustomer('/api/customer/auth/register', phoneNumber, password)
}

export function refreshCustomerSession() {
  if (refreshRequest) return refreshRequest

  const refreshSession = getRefreshSession()
  if (!refreshSession) {
    clearCustomerSession()
    return Promise.reject(new ApiError(401, 'نشست شما منقضی شده است. دوباره وارد شوید.'))
  }

  refreshRequest = apiRequest<CustomerAuthResult>('/api/customer/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: refreshSession.refreshToken }),
  })
    .then((result) => commitAuthResult(result, refreshSession))
    .catch((error: unknown) => {
      clearCustomerSession()
      throw error
    })
    .finally(() => {
      refreshRequest = undefined
    })

  return refreshRequest
}

async function getAccessToken() {
  if (activeSession && isFutureDate(activeSession.accessTokenExpiresAt, ACCESS_TOKEN_LEEWAY_MS)) {
    return activeSession.accessToken
  }

  return (await refreshCustomerSession()).accessToken
}

export async function authorizedCustomerRequest<T>(path: string, init: RequestInit = {}) {
  const accessToken = await getAccessToken()

  try {
    return await apiRequest<T>(path, withAccessToken(init, accessToken))
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error
  }

  const refreshedSession = await refreshCustomerSession()
  try {
    return await apiRequest<T>(path, withAccessToken(init, refreshedSession.accessToken))
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) clearCustomerSession()
    throw error
  }
}

export function getCustomerProfile() {
  if (cachedProfile) return Promise.resolve(cachedProfile)

  profileRequest ??= authorizedCustomerRequest<CustomerProfile>('/api/customer/account/profile')
    .then((profile) => {
      cachedProfile = profile
      return profile
    })
    .finally(() => {
      profileRequest = undefined
    })

  return profileRequest
}

export async function restoreCustomerSession() {
  if (!activeSession && !readStoredSession()) return null

  try {
    if (!activeSession || !isFutureDate(activeSession.accessTokenExpiresAt, ACCESS_TOKEN_LEEWAY_MS)) {
      await refreshCustomerSession()
    }
    return await getCustomerProfile()
  } catch {
    clearCustomerSession()
    return null
  }
}

export async function logoutCustomer() {
  const accessToken = activeSession?.accessToken
  const refreshSession = getRefreshSession()
  clearCustomerSession()

  if (!accessToken || !refreshSession) return

  try {
    await apiRequest<void>(
      '/api/customer/auth/logout',
      withAccessToken(
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken: refreshSession.refreshToken }),
        },
        accessToken,
      ),
    )
  } catch {
    // Local logout succeeds even if token revocation is temporarily unavailable.
  }
}
