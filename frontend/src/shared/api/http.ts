import { tokenStore } from './tokenStore'

export interface ProblemDetail {
  status: number
  title?: string
  detail?: string
  code?: string
  errors?: Record<string, string>
}

export class ApiError extends Error {
  readonly problem: ProblemDetail

  constructor(problem: ProblemDetail) {
    super(problem.detail ?? problem.title ?? 'Помилка запиту')
    this.name = 'ApiError'
    this.problem = problem
  }
}

const API_PREFIX = '/api'

interface RequestOptions {
  method?: string
  body?: unknown
  skipAuthRetry?: boolean
}

let refreshPromise: Promise<void> | null = null

function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_PREFIX}/auth/refresh`, { method: 'POST', credentials: 'include' })
        .then(async (response) => {
          if (!response.ok) {
            tokenStore.setAccessToken(null)
            throw new Error('refresh failed')
          }
          const data = await response.json()
          tokenStore.setAccessToken(data.accessToken)
        })
        .finally(() => {
          refreshPromise = null
        })
  }
  return refreshPromise
}

export async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, method = 'GET', skipAuthRetry = false } = options
  const token = tokenStore.getAccessToken()
  const isFormData = body instanceof FormData

  const response = await fetch(`${API_PREFIX}${path}`, {
    method,
    credentials: 'include',
    headers: {
      // Для FormData заголовок Content-Type НЕ ставимо самі — його з правильним
      // boundary виставляє сам браузер, як тільки бачить, що тіло є FormData.
      ...(body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
  })

  if ((response.status === 401 || response.status === 403) && !skipAuthRetry) {
    try {
      await refreshAccessToken()
      return http<T>(path, { ...options, skipAuthRetry: true })
    } catch {
      // не вдалось оновити — падаємо в звичайну обробку помилки нижче
    }
  }

  if (!response.ok) {
    const problem = (await response.json().catch(() => ({
      status: response.status,
      title: response.statusText,
    }))) as ProblemDetail
    throw new ApiError(problem)
  }

  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}