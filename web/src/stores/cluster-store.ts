import { create } from 'zustand'

interface ClusterInfo {
  id: string
  name: string
  endpoint: string
  status: 'connected' | 'disconnected'
}

interface ClusterState {
  clusters: ClusterInfo[]
  activeClusterId: string
  setActiveCluster: (clusterId: string) => void
}

const defaultClusters: ClusterInfo[] = [
  { id: 'production', name: 'production', endpoint: 'https://k8s-prod.local', status: 'connected' },
  { id: 'staging', name: 'staging', endpoint: 'https://k8s-stg.local', status: 'connected' },
  { id: 'dev', name: 'dev', endpoint: 'https://k8s-dev.local', status: 'disconnected' },
]

export const useClusterStore = create<ClusterState>((set) => ({
  clusters: defaultClusters,
  activeClusterId: defaultClusters[0]?.id ?? '',
  setActiveCluster: (clusterId) => set({ activeClusterId: clusterId }),
}))

