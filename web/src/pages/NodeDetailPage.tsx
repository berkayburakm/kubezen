import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchNodeDetail } from '@/lib/api/client'
import { timeAgoFrom } from '@/lib/date'
import type { NodeDetail } from '@/types/kube'

export default function NodeDetailPage() {
  const { t } = useTranslation()
  const { name = '' } = useParams<{ name: string }>()
  const [node, setNode] = useState<NodeDetail | null>(null)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    if (!name) return
    void fetchNodeDetail(name)
      .then(setNode)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to load node'))
  }, [name])

  return (
    <div className="space-y-4">
      <PageHeader
        title={node ? node.name : t('nodes.detailTitle', { defaultValue: 'Node Detail' })}
        description={node ? node.status : ''}
      />

      {error ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" aria-hidden />
          {error}
        </div>
      ) : null}

      {node ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('nodes.summary', { defaultValue: 'Summary' })}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2">
              <Detail label="Kubernetes" value={node.version} />
              <Detail label="Status" value={node.status} />
              <Detail label="Pods" value={node.pods} />
              <Detail label="CPU" value={node.cpuCapacity} />
              <Detail label="Memory" value={node.memoryCapacity} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('nodes.conditions', { defaultValue: 'Conditions' })}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {node.conditions.map((cond) => (
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

