import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutList } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchNamespaces } from '@/lib/api/client'
import type { NamespaceSummary } from '@/types/kube'

export default function NamespacesPage() {
  const { t } = useTranslation()
  const [namespaces, setNamespaces] = useState<NamespaceSummary[]>([])
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    void fetchNamespaces()
      .then((resp) => setNamespaces(resp.items))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to load namespaces'))
  }, [])

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('namespaces.title')}
        description={t('namespaces.description')}
      />

      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {namespaces.map((ns) => (
          <Card key={ns.name} className="border border-border/80">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base">{ns.name}</CardTitle>
                <CardDescription>{ns.status}</CardDescription>
              </div>
              <LayoutList className="h-5 w-5 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Age: <span className="text-foreground">{ns.age}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

