import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Package, RefreshCw } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { PodFilters } from '@/components/features/pods/PodFilters'
import { PodTable } from '@/components/features/pods/PodTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { usePodStore } from '@/stores/pod-store'

export default function PodsPage() {
  const { t } = useTranslation()
  const loadPods = usePodStore((state) => state.loadPods)
  const pods = usePodStore((state) => state.pods)
  const namespaces = usePodStore((state) => state.namespaces)
  const filters = usePodStore((state) => state.filters)
  const setFilters = usePodStore((state) => state.setFilters)
  const isLoading = usePodStore((state) => state.isLoading)
  const error = usePodStore((state) => state.error)

  useEffect(() => {
    void loadPods()
  }, [loadPods])

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('pods.title')}
        description={t('pods.description')}
        actions={
          <Button variant="outline" size="sm" onClick={() => void loadPods()} className="gap-2">
            <RefreshCw className="h-4 w-4" aria-hidden />
            {t('pods.refresh')}
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <PodFilters
            namespaces={namespaces}
            status={filters.status}
            namespace={filters.namespace}
            query={filters.query}
            onChange={setFilters}
          />

          {error ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <RefreshCw className="h-5 w-5" aria-hidden />
                </EmptyMedia>
                <EmptyTitle>{t('pods.unableToLoad')}</EmptyTitle>
                <EmptyDescription>{error}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button className="gap-2" size="sm" onClick={() => void loadPods()}>
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  {t('common.retry')}
                </Button>
              </EmptyContent>
            </Empty>
          ) : isLoading ? (
            <div className="flex h-96 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
              {t('pods.loading')}
            </div>
          ) : pods.length > 0 ? (
            <PodTable pods={pods} />
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Package className="h-5 w-5" aria-hidden />
                </EmptyMedia>
                <EmptyTitle>{t('common.noData')}</EmptyTitle>
                <EmptyDescription>{t('common.noData')}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

