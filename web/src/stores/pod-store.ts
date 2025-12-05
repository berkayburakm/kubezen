import { create } from 'zustand'

import { fetchNamespaces, fetchPods } from '@/lib/api/client'
import type { Pod, PodFilter } from '@/types/kube'

interface PodState {
  pods: Pod[]
  total: number
  namespaces: string[]
  filters: PodFilter
  isLoading: boolean
  error?: string
  loadPods: () => Promise<void>
  setFilters: (filters: Partial<PodFilter>) => void
}

const defaultFilters: PodFilter = {
  namespace: 'all',
  status: 'all',
  query: '',
  limit: 200,
  offset: 0,
}

export const usePodStore = create<PodState>((set, get) => ({
  pods: [],
  total: 0,
  namespaces: [],
  filters: defaultFilters,
  isLoading: false,
  loadPods: async () => {
    set({ isLoading: true, error: undefined })
    try {
      const filters = get().filters
      const [podsResponse, namespacesResponse] = await Promise.all([fetchPods(filters), fetchNamespaces()])
      set({
        pods: podsResponse.items,
        total: podsResponse.count,
        namespaces: namespacesResponse.items.map((ns) => ns.name),
        isLoading: false,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load pods'
      set({ error: message, isLoading: false })
    }
  },
  setFilters: (updates) => {
    const filters = { ...get().filters, ...updates }
    set({ filters })
    void get().loadPods()
  },
}))

