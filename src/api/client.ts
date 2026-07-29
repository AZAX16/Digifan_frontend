const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const apiBaseUrl = (configuredApiBaseUrl?.length ? configuredApiBaseUrl : '').replace(/\/+$/, '')
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000
const MAX_ERROR_BODY_LENGTH = 400

interface ProblemDetails {
  title?: string | null
  detail?: string | null
  errors?: Record<string, string[] | undefined>
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function parseJson(value: string) {
  try {
    return JSON.parse(value) as unknown
  } catch {
    return undefined
  }
}

function createRequestSignal(callerSignal: AbortSignal | null | undefined) {
  const controller = new AbortController()
  let didTimeout = false
  const forwardCallerAbort = () => controller.abort(callerSignal?.reason)

  if (callerSignal?.aborted) {
    forwardCallerAbort()
  } else {
    callerSignal?.addEventListener('abort', forwardCallerAbort, { once: true })
  }

  const timeoutId = setTimeout(() => {
    didTimeout = true
    controller.abort()
  }, DEFAULT_REQUEST_TIMEOUT_MS)

  return {
    signal: controller.signal,
    didTimeout: () => didTimeout,
    cleanup: () => {
      clearTimeout(timeoutId)
      callerSignal?.removeEventListener('abort', forwardCallerAbort)
    },
  }
}

function getErrorMessage(status: number, body: string, contentType: string) {
  const fallback = `درخواست با خطای ${status} روبه‌رو شد.`

  if (!body.trim()) return fallback

  if (contentType.includes('json')) {
    const problem = parseJson(body) as ProblemDetails | undefined
    const validationMessage = problem?.errors
      ? Object.values(problem.errors).flatMap((messages) => messages ?? []).find(Boolean)
      : undefined

    const problemMessage = [problem?.detail, validationMessage, problem?.title]
      .find((message) => Boolean(message?.trim()))
      ?.trim()

    return problemMessage ?? fallback
  }

  if (!contentType.includes('text/plain')) return fallback

  const plainMessage = body.trim().replace(/\s+/g, ' ')

  return plainMessage.length > MAX_ERROR_BODY_LENGTH
    ? `${plainMessage.slice(0, MAX_ERROR_BODY_LENGTH)}…`
    : plainMessage
}

export async function apiRequest<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')

  if (init.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  const requestSignal = createRequestSignal(init.signal)
  let response: Response
  let body: string

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers,
      signal: requestSignal.signal,
    })
    body = response.status === 204 ? '' : await response.text()
  } catch (error) {
    if (requestSignal.didTimeout()) {
      throw new ApiError(408, 'زمان انتظار برای پاسخ سرور به پایان رسید. دوباره تلاش کنید.')
    }
    if (init.signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      throw error
    }

    throw new ApiError(
      0,
      'ارتباط با سرور برقرار نشد. اتصال اینترنت یا تنظیمات پراکسی API را بررسی کنید.',
    )
  } finally {
    requestSignal.cleanup()
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (!response.ok) {
    throw new ApiError(response.status, getErrorMessage(response.status, body, contentType))
  }

  if (!body.length) return undefined as T

  if (contentType.includes('json')) {
    const parsedBody = parseJson(body)

    if (parsedBody === undefined) {
      throw new ApiError(502, 'پاسخ JSON سرور معتبر نبود. دوباره تلاش کنید.')
    }

    return parsedBody as T
  }

  return body as T
}
