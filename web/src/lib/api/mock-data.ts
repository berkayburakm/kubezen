import {
  type DeploymentSummary,
  type NamespaceSummary,
  type NodeSummary,
  type Pod,
  type PodPhase,
} from '@/types/kube'

const namespaces = ['default', 'kube-system', 'prod', 'staging', 'dev']
const statusPool: PodPhase[] = ['Running', 'Running', 'Running', 'Pending', 'Succeeded', 'Failed']
const nodes = ['worker-a', 'worker-b', 'worker-c', 'edge-1']
const apps = ['api', 'web', 'db', 'cache', 'worker', 'gateway', 'ingress']

const randomFrom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)]

const randomLabels = () => ({
  app: randomFrom(apps),
  tier: randomFrom(['frontend', 'backend', 'system']),
})

export function createMockPods(count = 600): Pod[] {
  return Array.from({ length: count }).map((_, index) => {
    const namespace = randomFrom(namespaces)
    const status = randomFrom(statusPool)
    const createdAt = Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)

    return {
      id: `pod-${index}`,
      name: `${randomFrom(apps)}-${index.toString().padStart(3, '0')}`,
      namespace,
      status,
      restarts: status === 'Running' ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 6),
      nodeName: randomFrom(nodes),
      creationTimestamp: new Date(createdAt).toISOString(),
      labels: randomLabels(),
    }
  })
}

export const mockNodes: NodeSummary[] = nodes.map((name, idx) => ({
  name,
  status: idx % 3 === 0 ? 'NotReady' : 'Ready',
  version: 'v1.30.3',
  pods: 100 + idx * 10,
  cpuCapacity: '32',
  memoryCapacity: '128Gi',
}))

export const mockDeployments: DeploymentSummary[] = [
  { name: 'api', namespace: 'prod', readyReplicas: 5, replicas: 6, updatedAt: new Date().toISOString() },
  { name: 'web', namespace: 'prod', readyReplicas: 4, replicas: 4, updatedAt: new Date().toISOString() },
  { name: 'worker', namespace: 'staging', readyReplicas: 3, replicas: 3, updatedAt: new Date().toISOString() },
]

export const mockNamespaces: NamespaceSummary[] = namespaces.map((name) => ({
  name,
  status: 'Active',
  age: '7d',
}))

