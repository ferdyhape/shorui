export const BASE_URL = import.meta.env.VITE_API_BASE ?? '/api/v1'

export class ApiError extends Error {
  readonly status: number
  readonly code: string | undefined

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export const isAbortError = (e: unknown): boolean =>
  e instanceof DOMException && e.name === 'AbortError'

async function toApiError(res: Response): Promise<ApiError> {
  try {
    const body: unknown = await res.json()
    if (body && typeof body === 'object' && 'detail' in body && typeof body.detail === 'string') {
      const code = 'code' in body && typeof body.code === 'string' ? body.code : undefined
      return new ApiError(body.detail, res.status, code)
    }
  } catch {
    /* non-JSON error body */
  }
  return new ApiError(`Request failed (${res.status})`, res.status)
}

export async function postForm(path: string, body: FormData, signal?: AbortSignal) {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, { method: 'POST', body, signal })
  } catch (e) {
    if (isAbortError(e)) throw e
    throw new ApiError('Cannot reach the server. Is the backend running?', 0)
  }
  if (!res.ok) throw await toApiError(res)
  return res
}
