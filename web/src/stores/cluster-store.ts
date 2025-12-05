import { create } from 'zustand'
import { fetchContexts, type ContextInfo } from '@/lib/api/client'

export interface ClusterInfo {
  id: string
  name: string
  cluster: string
  user: string
  namespace?: string
  isCurrent: boolean
}

interface ClusterState {
  contexts: ClusterInfo[]
  currentContext: string | null
  isLoading: boolean
  error?: string
  fetchContexts: () => Promise<void>
  setCurrentContext: (contextName: string) => void
}

export const useClusterStore = create<ClusterState>((set) => ({
  contexts: [],
  currentContext: null,
  isLoading: false,
  error: undefined,
  fetchContexts: async () => {
    set({ isLoading: true, error: undefined })
    try {
      const response = await fetchContexts()
      const contexts: ClusterInfo[] = response.contexts.map((ctx: ContextInfo) => ({
        id: ctx.name,
        name: ctx.name,
        cluster: ctx.cluster,
        user: ctx.user,
        namespace: ctx.namespace,
        isCurrent: ctx.isCurrent,
      }))
      set({
        contexts,
        currentContext: response.currentContext,
        isLoading: false,
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch contexts',
        isLoading: false,
      })
    }
  },
  setCurrentContext: (contextName) => set({ currentContext: contextName }),
}))
