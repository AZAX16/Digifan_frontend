const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const apiBaseUrl = (configuredApiBaseUrl?.length ? configuredApiBaseUrl : '').replace(/\/+$/, '')

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

  return body.trim()
}

export async function apiRequest<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')

  if (init.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error

    throw new ApiError(
      0,
      'ارتباط با سرور برقرار نشد. اتصال اینترنت یا تنظیمات پراکسی API را بررسی کنید.',
    )
  }

  const body = response.status === 204 ? '' : await response.text()
  const contentType = response.headers.get('content-type') ?? ''

  if (!response.ok) {
    throw new ApiError(response.status, getErrorMessage(response.status, body, contentType))
  }

  if (!body.length) return undefined as T

  if (contentType.includes('json')) {
    const parsedBody = parseJson(body)

    if (parsedBody !== undefined) return parsedBody as T
  }

  return body as T
}
