import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Server } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchNodes } from '@/lib/api/client'
import type { NodeSummary } from '@/types/kube'

export default function NodesPage() {
  const { t } = useTranslation()
  const [nodes, setNodes] = useState<NodeSummary[]>([])
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    void fetchNodes()
      .then((resp) => setNodes(resp.items))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to load nodes'))
  }, [])

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('nodes.title')}
        description={t('nodes.description')}
      />

      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {nodes.map((node) => (
          <Card key={node.name} className="border border-border/80">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base">
                  <Link to={`/nodes/${node.name}`} className="hover:underline">
                    {node.name}
                  </Link>
                </CardTitle>
                <CardDescription>Kubernetes {node.version}</CardDescription>
              </div>
              <Server className="h-5 w-5 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Status: <span className="font-medium text-foreground">{node.status}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Pods: <span className="font-medium text-foreground">{node.pods}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Capacity: <span className="font-medium text-foreground">{node.cpuCapacity}</span> CPU ·{' '}
                <span className="font-medium text-foreground">{node.memoryCapacity}</span> memory
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

