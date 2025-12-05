import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import DeploymentDetailPage from '@/pages/DeploymentDetailPage'
import DeploymentsPage from '@/pages/DeploymentsPage'
import EventsPage from '@/pages/EventsPage'
import LoginPage from '@/pages/LoginPage'
import NamespacesPage from '@/pages/NamespacesPage'
import NodeDetailPage from '@/pages/NodeDetailPage'
import NodesPage from '@/pages/NodesPage'
import OidcCallbackPage from '@/pages/OidcCallbackPage'
import PodDetailPage from '@/pages/PodDetailPage'
import PodsPage from '@/pages/PodsPage'
import SetupPage from '@/pages/SetupPage'
import { useAuthStore } from '@/stores/auth-store'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<OidcCallbackPage />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/pods" replace />} />
          <Route path="/pods" element={<PodsPage />} />
          <Route path="/pods/:namespace/:name" element={<PodDetailPage />} />
          <Route path="/nodes" element={<NodesPage />} />
          <Route path="/nodes/:name" element={<NodeDetailPage />} />
          <Route path="/deployments" element={<DeploymentsPage />} />
          <Route path="/deployments/:namespace/:name" element={<DeploymentDetailPage />} />
          <Route path="/namespaces" element={<NamespacesPage />} />
          <Route path="/events" element={<EventsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((s) => s.session)
  const isLoading = useAuthStore((s) => s.isLoading)
  const loadSession = useAuthStore((s) => s.loadSession)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!session) {
      void loadSession()
    }
  }, [session, loadSession])

  useEffect(() => {
    if (!isLoading && !session) {
      navigate('/login', { replace: true, state: { from: location } })
    }
  }, [isLoading, session, navigate, location])

  if (isLoading && !session) {
    return <div className="p-6 text-sm text-muted-foreground">Checking session...</div>
  }

  if (!session) {
    return null
  }

  return <>{children}</>
}

export default App
