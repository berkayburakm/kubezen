import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchPodDetail } from '@/lib/api/client'
import { timeAgoFrom } from '@/lib/date'
import type { PodDetail } from '@/types/kube'

export default function PodDetailPage() {
  const { t } = useTranslation()
  const { namespace = '', name = '' } = useParams<{ namespace: string; name: string }>()
  const [pod, setPod] = useState<PodDetail | null>(null)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    if (!namespace || !name) return
    void fetchPodDetail(namespace, name)
      .then(setPod)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to load pod'))
  }, [namespace, name])

  return (
    <div className="space-y-4">
      <PageHeader
        title={pod ? pod.name : t('pods.detailTitle', { defaultValue: 'Pod Detail' })}
        description={pod ? `${pod.namespace}` : `${namespace}/${name}`}
      />

      {error ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" aria-hidden />
          {error}
        </div>
      ) : null}

      {pod ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('pods.summary', { defaultValue: 'Summary' })}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <DetailRow label="Status" value={pod.status} />
              <DetailRow label="Restarts" value={pod.restarts} />
              <DetailRow label="Node" value={pod.nodeName} />
              <DetailRow label="Pod IP" value={pod.podIP} />
              <DetailRow label="Node IP" value={pod.nodeIP} />
              <DetailRow label="Age" value={timeAgoFrom(pod.creationTimestamp)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('pods.containers', { defaultValue: 'Containers' })}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pod.containers.map((c) => (
                <div key={c.name} className="rounded-md border p-3">
                  <div className="flex items-center justify-between text-sm font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.image}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.state} · restarts: {c.restartCount}
                  </div>
                  {c.reason ? <div className="text-xs text-muted-foreground">Reason: {c.reason}</div> : null}
                  {c.message ? <div className="text-xs text-muted-foreground">Message: {c.message}</div> : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('pods.conditions', { defaultValue: 'Conditions' })}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pod.conditions.map((cond) => (
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

          {pod.events && pod.events.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('pods.events', { defaultValue: 'Events' })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pod.events.map((ev, idx) => (
                  <div key={`${ev.reason}-${idx}`} className="rounded-md border p-3 text-sm">
                    <div className="font-semibold">{ev.reason}</div>
                    <div className="text-xs text-muted-foreground">
                      {ev.type} · {ev.count}x · {timeAgoFrom(ev.lastTimestamp)}
                    </div>
                    <div className="text-xs text-muted-foreground">{ev.message}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null) return null
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}

