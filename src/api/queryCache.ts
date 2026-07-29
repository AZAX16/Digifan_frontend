interface CachedQueryOptions<T> {
  key: string
  staleTimeMs: number
  signal?: AbortSignal
  queryFn: (signal: AbortSignal) => Promise<T>
}

interface QueryCacheEntry<T> {
  controller: AbortController
  expiresAt: number
  hasValue: boolean
  promise: Promise<T>
  value?: T
}

const MAX_CACHE_ENTRIES = 100
const queryCache = new Map<string, QueryCacheEntry<unknown>>()

function getAbortError(signal: AbortSignal) {
  return signal.reason instanceof DOMException
    ? signal.reason
    : new DOMException('The operation was aborted.', 'AbortError')
}

function getQueryError(error: unknown) {
  if (error instanceof Error) return error

  return new Error('The cached query failed with an unknown error.')
}

function followCallerSignal<T>(promise: Promise<T>, signal?: AbortSignal) {
  if (!signal) return promise
  if (signal.aborted) return Promise.reject<T>(getAbortError(signal))

  return new Promise<T>((resolve, reject) => {
    const handleAbort = () => {
      signal.removeEventListener('abort', handleAbort)
      reject(getAbortError(signal))
    }
    const cleanup = () => signal.removeEventListener('abort', handleAbort)

    signal.addEventListener('abort', handleAbort, { once: true })
    promise.then(
      (value) => {
        cleanup()
        resolve(value)
      },
      (error: unknown) => {
        cleanup()
        reject(getQueryError(error))
      },
    )
  })
}

function removeEntry(key: string, entry: QueryCacheEntry<unknown>) {
  if (queryCache.get(key) !== entry) return

  queryCache.delete(key)
  entry.controller.abort()
}

function trimCache() {
  while (queryCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = queryCache.keys().next().value
    if (oldestKey === undefined) return

    const oldestEntry = queryCache.get(oldestKey)
    if (oldestEntry) removeEntry(oldestKey, oldestEntry)
  }
}

export function cachedQuery<T>({
  key,
  staleTimeMs,
  signal,
  queryFn,
}: CachedQueryOptions<T>) {
  if (signal?.aborted) return Promise.reject<T>(getAbortError(signal))

  const existingEntry = queryCache.get(key) as QueryCacheEntry<T> | undefined

  if (existingEntry?.hasValue && existingEntry.expiresAt > Date.now()) {
    queryCache.delete(key)
    queryCache.set(key, existingEntry)
    return followCallerSignal(Promise.resolve(existingEntry.value as T), signal)
  }

  if (existingEntry && !existingEntry.hasValue) {
    return followCallerSignal(existingEntry.promise, signal)
  }

  if (existingEntry) removeEntry(key, existingEntry)

  const controller = new AbortController()
  const entry: QueryCacheEntry<T> = {
    controller,
    expiresAt: 0,
    hasValue: false,
    promise: Promise.resolve().then(() => queryFn(controller.signal)),
  }
  entry.promise = entry.promise
    .then((value) => {
      if (queryCache.get(key) === entry) {
        entry.value = value
        entry.hasValue = true
        entry.expiresAt = Date.now() + Math.max(0, staleTimeMs)
      }

      return value
    })
    .catch((error: unknown) => {
      if (queryCache.get(key) === entry) queryCache.delete(key)
      throw error
    })

  queryCache.set(key, entry)
  trimCache()

  return followCallerSignal(entry.promise, signal)
}

export function invalidateQueryPrefix(prefix: string) {
  for (const [key, entry] of queryCache) {
    if (key.startsWith(prefix)) removeEntry(key, entry)
  }
}

export function clearQueryCache() {
  for (const [key, entry] of queryCache) removeEntry(key, entry)
}
