/**
 * Cliente HTTP centralizado.
 * Em produção (Tauri) usa a URL relativa "/api" via proxy do Vite.
 * Em modo standalone (sem Vite) usa VITE_API_URL.
 */
const API_BASE = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new ApiError(response.status, body.message ?? 'Request failed')
  }

  // 204 No Content — sem corpo
  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}

export const api = {
  get:    <T>(endpoint: string)                     => request<T>(endpoint),
  post:   <T>(endpoint: string, body: unknown)      => request<T>(endpoint, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(endpoint: string, body: unknown)      => request<T>(endpoint, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  <T>(endpoint: string, body: unknown)      => request<T>(endpoint, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: <T>(endpoint: string)                     => request<T>(endpoint, { method: 'DELETE' }),
}
