import type {
  DeploymentDetail,
  DeploymentSummary,
  EventSummary,
  ListResponse,
  NamespaceSummary,
  NodeDetail,
  NodeSummary,
  Pod,
  PodDetail,
  PodFilter,
} from '@/types/kube'

const apiBaseEnv: unknown = import.meta.env.VITE_API_BASE
const API_BASE = typeof apiBaseEnv === 'string' && apiBaseEnv.length > 0 ? apiBaseEnv : '/api'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text()
    throw new ApiError(response.status, message || 'Request failed')
  }
  const contentType = response.headers.get('Content-Type') ?? ''
  if (contentType.includes('application/json')) {
    return (await response.json()) as T
  }
  return {} as T
}

const buildUrl = (path: string) => {
  if (path.startsWith('http')) return path
  if (path.startsWith('/')) return `${API_BASE}${path}`
  return `${API_BASE}/${path}`
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  return handleResponse<T>(response)
}

export const apiGet = <T>(path: string, init?: RequestInit) =>
  apiRequest<T>(path, { ...init, method: 'GET' })
export const apiPost = <T>(path: string, body?: unknown, init?: RequestInit) =>
  apiRequest<T>(path, { ...init, method: 'POST', body: body ? JSON.stringify(body) : undefined })
export const apiDelete = <T>(path: string, init?: RequestInit) =>
  apiRequest<T>(path, { ...init, method: 'DELETE' })

export interface SessionInfo {
  subject: string
  source: string
  context?: string
  hasRefresh?: boolean
  expiresAt?: string
}

const toQueryString = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '' || value === null) return
    searchParams.set(key, String(value))
  })
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ''
}

// Kube API wrappers ---------------------------------------------------------
export async function fetchPods(filters: PodFilter): Promise<ListResponse<Pod>> {
  const query = toQueryString({
    namespace: filters.namespace === 'all' ? undefined : filters.namespace,
    status: filters.status === 'all' ? undefined : filters.status,
    q: filters.query,
    limit: filters.limit,
    offset: filters.offset,
  })
  return apiGet<ListResponse<Pod>>(`/v1/pods${query}`)
}

export const fetchPodDetail = (namespace: string, name: string) =>
  apiGet<PodDetail>(`/v1/pods/${namespace}/${name}`)

export const fetchNodes = () => apiGet<ListResponse<NodeSummary>>('/v1/nodes')
export const fetchNodeDetail = (name: string) => apiGet<NodeDetail>(`/v1/nodes/${name}`)

export const fetchDeployments = (namespace?: string) =>
  apiGet<ListResponse<DeploymentSummary>>(
    `/v1/deployments${toQueryString({ namespace: namespace && namespace !== 'all' ? namespace : undefined })}`,
  )

export const fetchDeploymentDetail = (namespace: string, name: string) =>
  apiGet<DeploymentDetail>(`/v1/deployments/${namespace}/${name}`)

export const fetchNamespaces = () => apiGet<ListResponse<NamespaceSummary>>('/v1/namespaces')
export const createNamespace = (name: string) => apiPost<void>('/v1/namespaces', { name })
export const deleteNamespace = (name: string) => apiDelete<void>(`/v1/namespaces/${name}`)

export const fetchEvents = (namespace?: string) =>
  apiGet<ListResponse<EventSummary>>(`/v1/events${toQueryString({ namespace })}`)

// Contexts API
export interface ContextInfo {
  name: string
  cluster: string
  user: string
  namespace?: string
  isCurrent: boolean
}

export interface ContextsResponse {
  contexts: ContextInfo[]
  currentContext: string
}

export const fetchContexts = () => apiGet<ContextsResponse>('/v1/contexts')

// Auth endpoints
export interface AuthStatus {
  needsSetup: boolean
  authMethods: ('local' | 'oidc')[]
}

export const fetchAuthStatus = () => apiGet<AuthStatus>('/auth/status')
export const setupAdmin = (username: string, password: string) =>
  apiPost<SessionInfo>('/auth/setup', { username, password })
export const localLogin = (username: string, password: string) =>
  apiPost<SessionInfo>('/auth/login', { username, password })
export const fetchSession = () => apiGet<SessionInfo>('/auth/session')
export const startOIDC = () => apiGet<{ url: string; state: string }>('/auth/oidc/start')
export const completeOIDC = (code: string, state: string) =>
  apiGet<SessionInfo>(
    `/auth/oidc/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
  )
export const logout = () => apiPost<void>('/auth/logout')
export const loginWithKubeconfig = (kubeconfig: string, context?: string, user?: string) =>
  apiPost<SessionInfo>('/auth/kubeconfig', { kubeconfig, context, user })
