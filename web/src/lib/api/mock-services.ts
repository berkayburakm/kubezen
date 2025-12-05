import {
  mockDeployments,
  mockNamespaces,
  mockNodes,
  createMockPods,
} from '@/lib/api/mock-data'
import type { DeploymentSummary, NamespaceSummary, NodeSummary, Pod } from '@/types/kube'

const podCache = createMockPods(1200)

export async function fetchMockPods(): Promise<Pod[]> {
  return new Promise((resolve) => setTimeout(() => resolve(podCache), 80))
}

export async function fetchMockNodes(): Promise<NodeSummary[]> {
  return new Promise((resolve) => setTimeout(() => resolve(mockNodes), 40))
}

export async function fetchMockDeployments(): Promise<DeploymentSummary[]> {
  return new Promise((resolve) => setTimeout(() => resolve(mockDeployments), 40))
}

export async function fetchMockNamespaces(): Promise<NamespaceSummary[]> {
  return new Promise((resolve) => setTimeout(() => resolve(mockNamespaces), 30))
}

