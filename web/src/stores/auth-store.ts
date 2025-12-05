import { create } from 'zustand'

import {
  completeOIDC,
  fetchSession,
  logout as apiLogout,
  startOIDC,
  type SessionInfo,
} from '@/lib/api/client'
import { ApiError } from '@/lib/api/client'

interface AuthState {
  session?: SessionInfo
  isLoading: boolean
  error?: string
  loadSession: () => Promise<void>
  startOidc: () => Promise<void>
  completeOidc: (code: string, state: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: undefined,
  isLoading: false,
  error: undefined,
  clearError: () => set({ error: undefined }),
  loadSession: async () => {
    set({ isLoading: true, error: undefined })
    try {
      const session = await fetchSession()
      set({ session, isLoading: false, error: undefined })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        set({ session: undefined, isLoading: false, error: undefined })
      } else {
        const message = err instanceof Error ? err.message : 'Unable to load session'
        set({ session: undefined, isLoading: false, error: message })
      }
    }
  },
  startOidc: async () => {
    set({ isLoading: true, error: undefined })
    try {
      const { url } = await startOIDC()
      window.location.href = url
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to start login'
      set({ isLoading: false, error: message })
    }
  },
  completeOidc: async (code: string, state: string) => {
    set({ isLoading: true, error: undefined })
    try {
      await completeOIDC(code, state)
      const session = await fetchSession()
      set({ session, isLoading: false, error: undefined })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to complete login'
      set({ session: undefined, isLoading: false, error: message })
    }
  },
  logout: async () => {
    set({ isLoading: true })
    try {
      await apiLogout()
    } finally {
      set({ session: undefined, isLoading: false })
    }
  },
}))

