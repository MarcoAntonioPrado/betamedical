import type { ApiEnvelope, AppRecordMap, CloseServiceOrderRequest, CollectionName, CreateUserRequest, InventoryMovementRequest, LoginRequest, SessionPayload } from '@atlasmed/shared'

/**
 * Normaliza VITE_API_URL para evitar URLs malformadas:
 * - remove espaços/quebras de linha
 * - corrige valores colados em duplicidade (ex.: "https://x.comhttps://x.com")
 * - remove barras e "/api" no final (o path já começa com /api)
 */
function normalizeApiUrl(raw: string | undefined): string {
  let url = (raw ?? '').trim()
  if (!url) return ''
  // Se o valor foi colado mais de uma vez, mantém só a primeira ocorrência válida.
  const duplicateMatch = url.match(/^(https?:\/\/[^/]+)(?:https?:\/\/.*)?/i)
  if (duplicateMatch) {
    const secondProtocol = url.indexOf('http', duplicateMatch[1].length)
    if (secondProtocol > 0) url = url.slice(0, secondProtocol)
  }
  url = url.replace(/\/+$/, '') // remove barras finais
  url = url.replace(/\/api$/i, '') // remove /api final (o path já inclui /api)
  return url
}

const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL as string | undefined)

let authToken: string | null = null

export function setApiToken(token: string | null) {
  authToken = token
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as { data?: T; error?: string }
  if (!response.ok) {
    throw new Error(payload.error || 'Não foi possível concluir a operação.')
  }
  return payload.data as T
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  })

  return parseResponse<T>(response)
}

export const api = {
  baseUrl: API_URL,
  async health() {
    return request<ApiEnvelope<{ status: string; mode: string; timestamp: string }>['data']>('/api/health')
  },
  async loginDemo(payload: LoginRequest) {
    return request<SessionPayload>('/api/session/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  async bootstrap() {
    return request<{
      mode: string
      user: SessionPayload['user']
      permissions: SessionPayload['permissions']
      modules: Array<{ id: string; label: string; shortLabel: string; description: string; kind: string; collection?: string }>
      companyProfile: Record<string, unknown>
      demoHints: Array<{ email: string; password: string; role: string; name: string }>
    }>('/api/bootstrap')
  },
  async sessionMe() {
    return request<{ user: SessionPayload['user']; permissions: SessionPayload['permissions'] }>('/api/session/me')
  },
  async listResource<Key extends CollectionName>(collection: Key) {
    return request<AppRecordMap[Key][]>(`/api/resources/${collection}`)
  },
  async createResource<Key extends CollectionName>(collection: Key, payload: Partial<AppRecordMap[Key]>) {
    return request<AppRecordMap[Key]>(`/api/resources/${collection}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  async updateResource<Key extends CollectionName>(collection: Key, id: string, payload: Partial<AppRecordMap[Key]>) {
    return request<AppRecordMap[Key]>(`/api/resources/${collection}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },
  async deleteResource<Key extends CollectionName>(collection: Key, id: string) {
    return request<boolean>(`/api/resources/${collection}/${id}`, {
      method: 'DELETE',
    })
  },
  async moveInventory(collection: 'pecas' | 'acessorios', id: string, payload: InventoryMovementRequest) {
    return request(`/api/inventory/${collection}/${id}/movements`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  async closeServiceOrder(id: string, payload: CloseServiceOrderRequest) {
    return request(`/api/service-orders/${id}/close`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  async createUser(payload: CreateUserRequest) {
    return request<AppRecordMap['users']>('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}