import { useMemo } from 'react'
import { LogOut, Sparkles, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useClusterStore } from '@/stores/cluster-store'
import { useAuthStore } from '@/stores/auth-store'

export function Topbar() {
  const { t } = useTranslation()
  const clusters = useClusterStore((state) => state.clusters)
  const activeClusterId = useClusterStore((state) => state.activeClusterId)
  const setActiveCluster = useClusterStore((state) => state.setActiveCluster)
  const session = useAuthStore((s) => s.session)
  const logout = useAuthStore((s) => s.logout)

  const activeCluster = useMemo(
    () => clusters.find((cluster) => cluster.id === activeClusterId),
    [activeClusterId, clusters],
  )

  return (
    <header className="flex items-center justify-between border-b bg-card/70 px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <Label htmlFor="cluster" className="text-xs uppercase text-muted-foreground">
          {t('app.cluster')}
        </Label>
        <Select
          value={activeClusterId ?? undefined}
          onValueChange={(value: string) => setActiveCluster(value)}
        >
          <SelectTrigger id="cluster" className="w-48">
            <SelectValue placeholder={t('app.cluster')} />
          </SelectTrigger>
          <SelectContent>
            {clusters.map((cluster) => (
              <SelectItem key={cluster.id} value={cluster.id}>
                {cluster.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activeCluster ? (
          <span className="text-xs text-muted-foreground">
            {activeCluster.endpoint} ·{' '}
            {activeCluster.status === 'connected' ? t('app.connected') : t('app.offline')}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {session ? (
          <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-xs">
            <User className="h-4 w-4 text-muted-foreground" aria-hidden />
            <div className="leading-tight">
              <div className="font-semibold text-foreground">{session.subject}</div>
              <div className="text-muted-foreground">{session.source}</div>
            </div>
          </div>
        ) : null}
        <Button variant="outline" size="sm" className="gap-2" onClick={() => void logout()}>
          <LogOut className="h-4 w-4" aria-hidden />
          {t('auth.logout', { defaultValue: 'Logout' })}
        </Button>
        <Button variant="default" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" aria-hidden />
          {t('app.newAction')}
        </Button>
      </div>
    </header>
  )
}

