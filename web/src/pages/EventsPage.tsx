import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Filter, Radio } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchEvents, fetchNamespaces } from '@/lib/api/client'
import { timeAgoFrom } from '@/lib/date'
import type { EventSummary } from '@/types/kube'

export default function EventsPage() {
  const { t } = useTranslation()
  const [events, setEvents] = useState<EventSummary[]>([])
  const [namespaces, setNamespaces] = useState<string[]>([])
  const [namespace, setNamespace] = useState<string>('all')
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    void fetchNamespaces()
      .then((resp) => setNamespaces(resp.items.map((ns) => ns.name)))
      .catch(() => setNamespaces([]))
  }, [])

  useEffect(() => {
    void fetchEvents(namespace === 'all' ? undefined : namespace)
      .then((resp) => {
        setEvents(resp.items)
        setError(undefined)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to load events'))
  }, [namespace])

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('events.title', { defaultValue: 'Events' })}
        description={t('events.description', { defaultValue: 'Cluster events' })}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" aria-hidden />
            {t('events.filter', { defaultValue: 'Filter' })}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="namespace">{t('pods.filters.namespace')}</Label>
            <Select value={namespace} onValueChange={setNamespace}>
              <SelectTrigger id="namespace" className="w-40">
                <SelectValue placeholder={t('pods.filters.allNamespaces')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('pods.filters.allNamespaces')}</SelectItem>
                {namespaces.map((ns) => (
                  <SelectItem key={ns} value={ns}>
                    {ns}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        {events.map((ev, idx) => (
          <Card key={`${ev.reason}-${idx}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Radio className="h-4 w-4 text-muted-foreground" aria-hidden />
                {ev.reason}
              </div>
              <div className="text-xs text-muted-foreground">{ev.type}</div>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="text-muted-foreground">{ev.message}</div>
              <div className="text-xs text-muted-foreground">
                {ev.count}x · {timeAgoFrom(ev.lastTimestamp)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

