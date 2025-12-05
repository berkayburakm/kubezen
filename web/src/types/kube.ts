export type PodPhase = 'Running' | 'Pending' | 'Failed' | 'Succeeded' | 'Unknown'

export interface Pod {
  id: string
  name: string
  namespace: string
  status: PodPhase
  restarts: number
  nodeName: string
  creationTimestamp: string
  labels: Record<string, string>
}

export interface PodFilter {
  namespace: string
  status: PodPhase | 'all'
  query: string
  limit?: number
  offset?: number
}

export interface NodeSummary {
  name: string
  status: 'Ready' | 'NotReady'
  version: string
  pods: number
  cpuCapacity: string
  memoryCapacity: string
}

export interface DeploymentSummary {
  name: string
  namespace: string
  readyReplicas: number
  replicas: number
  updatedAt: string
}

export interface NamespaceSummary {
  name: string
  status: 'Active' | 'Terminating'
  age: string
}

export interface ContainerStatus {
  name: string
  image: string
  ready: boolean
  restartCount: number
  state: string
  reason?: string
  message?: string
}

export interface PodCondition {
  type: string
  status: string
  reason?: string
  message?: string
  lastTransitionTime: string
}

export interface EventSummary {
  type: string
  reason: string
  message: string
  count: number
  firstTimestamp: string
  lastTimestamp: string
}

export interface PodDetail extends Pod {
  containers: ContainerStatus[]
  conditions: PodCondition[]
  events?: EventSummary[]
  nodeIP?: string
  podIP?: string
}

export interface NodeCondition {
  type: string
  status: string
  reason?: string
  message?: string
  lastTransitionTime: string
}

export interface NodeDetail extends NodeSummary {
  conditions: NodeCondition[]
  capacity: Record<string, string>
  allocatable: Record<string, string>
}

export interface DeploymentCondition {
  type: string
  status: string
  reason?: string
  message?: string
  lastTransitionTime: string
}

export interface DeploymentDetail extends DeploymentSummary {
  conditions: DeploymentCondition[]
}

export interface ListResponse<T> {
  items: T[]
  count: number
}

