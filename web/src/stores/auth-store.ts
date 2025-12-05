import { create } from 'zustand'

import {
  completeOIDC,
  fetchAuthStatus,
  fetchSession,
  localLogin as apiLocalLogin,
  logout as apiLogout,
  setupAdmin as apiSetupAdmin,
  startOIDC,
  type AuthStatus,
  type SessionInfo,
} from '@/lib/api/client'
import { ApiError } from '@/lib/api/client'
import { useClusterStore } from './cluster-store'

interface AuthState {
  session?: SessionInfo
  authStatus?: AuthStatus
  isLoading: boolean
  error?: string
  checkSetup: () => Promise<AuthStatus>
  setupAdmin: (username: string, password: string) => Promise<void>
  localLogin: (username: string, password: string) => Promise<void>
  loadSession: () => Promise<void>
  startOidc: () => Promise<void>
  completeOidc: (code: string, state: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: undefined,
  authStatus: undefined,
  isLoading: false,
  error: undefined,
  clearError: () => set({ error: undefined }),
  checkSetup: async () => {
    set({ isLoading: true, error: undefined })
    try {
      const status = await fetchAuthStatus()
      set({ authStatus: status, isLoading: false })
      return status
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to check setup status'
      set({ isLoading: false, error: message })
      throw err
    }
  },
  setupAdmin: async (username: string, password: string) => {
    set({ isLoading: true, error: undefined })
    try {
      const session = await apiSetupAdmin(username, password)
      set({ session, isLoading: false, error: undefined })
      void useClusterStore.getState().fetchContexts()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create admin account'
      set({ isLoading: false, error: message })
      throw err
    }
  },
  localLogin: async (username: string, password: string) => {
    set({ isLoading: true, error: undefined })
    try {
      const session = await apiLocalLogin(username, password)
      set({ session, isLoading: false, error: undefined })
      void useClusterStore.getState().fetchContexts()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid username or password'
      set({ isLoading: false, error: message })
      throw err
    }
  },
  loadSession: async () => {
    set({ isLoading: true, error: undefined })
    try {
      const session = await fetchSession()
      set({ session, isLoading: false, error: undefined })
      void useClusterStore.getState().fetchContexts()
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
