import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchDeploymentDetail } from '@/lib/api/client'
import { timeAgoFrom } from '@/lib/date'
import type { DeploymentDetail } from '@/types/kube'

export default function DeploymentDetailPage() {
  const { t } = useTranslation()
  const { namespace = '', name = '' } = useParams<{ namespace: string; name: string }>()
  const [deployment, setDeployment] = useState<DeploymentDetail | null>(null)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    if (!namespace || !name) return
    void fetchDeploymentDetail(namespace, name)
      .then(setDeployment)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to load deployment'))
  }, [namespace, name])

  return (
    <div className="space-y-4">
      <PageHeader
        title={deployment ? deployment.name : t('deployments.detailTitle', { defaultValue: 'Deployment Detail' })}
        description={deployment ? deployment.namespace : `${namespace}/${name}`}
      />

      {error ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" aria-hidden />
          {error}
        </div>
      ) : null}

      {deployment ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('deployments.summary', { defaultValue: 'Summary' })}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2">
              <Detail label="Namespace" value={deployment.namespace} />
              <Detail label="Ready" value={`${deployment.readyReplicas}/${deployment.replicas}`} />
              <Detail label="Updated" value={timeAgoFrom(deployment.updatedAt)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('deployments.conditions', { defaultValue: 'Conditions' })}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {deployment.conditions.map((cond) => (
                <div key={cond.type} className="rounded-md border p-3 text-sm">
                  <div className="font-semibold">{cond.type}</div>
                  <div className="text-xs text-muted-foreground">
                    {cond.status} · {cond.reason ?? ''}
                  </div>
                  <div className="text-xs text-muted-foreground">Updated {timeAgoFrom(cond.lastTransitionTime)}</div>
                  {cond.message ? <div className="text-xs text-muted-foreground">{cond.message}</div> : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}

function Detail({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined) return null
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}

