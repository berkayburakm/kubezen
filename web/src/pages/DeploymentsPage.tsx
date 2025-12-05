import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Layers } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchDeployments } from '@/lib/api/client'
import type { DeploymentSummary } from '@/types/kube'

export default function DeploymentsPage() {
  const { t } = useTranslation()
  const [deployments, setDeployments] = useState<DeploymentSummary[]>([])
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    void fetchDeployments()
      .then((resp) => setDeployments(resp.items))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to load deployments'))
  }, [])

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('deployments.title')}
        description={t('deployments.description')}
      />

      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {deployments.map((deployment) => (
          <Card key={`${deployment.namespace}-${deployment.name}`} className="border border-border/80">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base">
                  <Link
                    to={`/deployments/${deployment.namespace}/${deployment.name}`}
                    className="hover:underline"
                  >
                    {deployment.name}
                  </Link>
                </CardTitle>
                <CardDescription className="capitalize">{deployment.namespace}</CardDescription>
              </div>
              <Layers className="h-5 w-5 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Ready: <span className="font-semibold text-foreground">{deployment.readyReplicas}</span> /{' '}
                <span className="text-foreground">{deployment.replicas}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Updated: <span className="text-foreground">{new Date(deployment.updatedAt).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

