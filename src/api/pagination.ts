const DEFAULT_PAGE_CONCURRENCY = 4

export async function fetchRemainingPages<T>(
  totalPages: number,
  fetchPage: (page: number) => Promise<T>,
  concurrency = DEFAULT_PAGE_CONCURRENCY,
) {
  const pageNumbers = Array.from(
    { length: Math.max(0, totalPages - 1) },
    (_, index) => index + 2,
  )
  const results = new Array<T>(pageNumbers.length)
  let nextIndex = 0

  const runWorker = async () => {
    while (nextIndex < pageNumbers.length) {
      const resultIndex = nextIndex
      const page = pageNumbers[resultIndex]
      nextIndex += 1

      results[resultIndex] = await fetchPage(page)
    }
  }

  const workerCount = Math.min(
    pageNumbers.length,
    Math.max(1, Math.floor(concurrency)),
  )

  await Promise.all(Array.from({ length: workerCount }, runWorker))
  return results
}
