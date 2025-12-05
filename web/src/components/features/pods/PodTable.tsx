import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { StatusBadge } from '@/components/features/StatusBadge'
import { VirtualTable } from '@/components/features/virtualization/VirtualTable'
import { cn } from '@/lib/utils'
import { timeAgoFrom } from '@/lib/date'
import type { Pod } from '@/types/kube'

interface PodTableProps {
  pods: Pod[]
}

const columnLayout =
  'grid grid-cols-[1.6fr_1fr_0.8fr_0.6fr_0.8fr_1fr] items-center gap-3 md:gap-4'

export function PodTable({ pods }: PodTableProps) {
  const { t } = useTranslation()

  return (
    <VirtualTable
      data={pods}
      itemHeight={72}
      itemKey={(index, items) => items[index]?.id ?? index}
      header={
        <div className={cn(columnLayout, 'px-4 text-[11px] font-semibold uppercase text-muted-foreground')}>
          <span>{t('pods.table.name')}</span>
          <span>{t('pods.table.namespace')}</span>
          <span>{t('pods.table.status')}</span>
          <span>{t('pods.table.restarts')}</span>
          <span>{t('pods.table.age')}</span>
          <span>{t('pods.table.node')}</span>
        </div>
      }
      renderRow={(pod) => (
        <div className="flex h-full items-center">
          <div className={cn(columnLayout, 'w-full rounded-md border bg-card px-4 py-3 shadow-sm')}>
            <div className="truncate">
              <Link to={`/pods/${pod.namespace}/${pod.name}`} className="truncate text-sm font-semibold text-foreground hover:underline">
                {pod.name}
              </Link>
              <div className="truncate text-xs text-muted-foreground">{pod.labels.app}</div>
            </div>
            <div className="truncate text-sm text-muted-foreground">{pod.namespace}</div>
            <div className="flex items-center gap-2">
              <StatusBadge status={pod.status} />
            </div>
            <div className="text-sm">{pod.restarts}</div>
            <div className="text-sm text-muted-foreground">{timeAgoFrom(pod.creationTimestamp)}</div>
            <div className="truncate text-sm text-muted-foreground">{pod.nodeName}</div>
          </div>
        </div>
      )}
    />
  )
}

