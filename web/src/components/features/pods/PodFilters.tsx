import { useTranslation } from 'react-i18next'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PodPhase } from '@/types/kube'

interface PodFiltersProps {
  namespaces: string[]
  status: PodPhase | 'all'
  namespace: string
  query: string
  onChange: (value: { status?: PodPhase | 'all'; namespace?: string; query?: string }) => void
}

const statuses: (PodPhase | 'all')[] = ['all', 'Running', 'Pending', 'Succeeded', 'Failed', 'Unknown']

export function PodFilters({ namespaces, status, namespace, query, onChange }: PodFiltersProps) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr]">
      <div className="space-y-2">
        <Label htmlFor="search">{t('pods.filters.search')}</Label>
        <Input
          id="search"
          placeholder={t('pods.filters.searchPlaceholder')}
          value={query}
          onChange={(event) => onChange({ query: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="namespace">{t('pods.filters.namespace')}</Label>
        <Select
          value={namespace}
          onValueChange={(value: string) => onChange({ namespace: value })}
        >
          <SelectTrigger id="namespace">
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

      <div className="space-y-2">
        <Label htmlFor="status">{t('pods.filters.status')}</Label>
        <Select
          value={status}
          onValueChange={(value: PodPhase | 'all') => onChange({ status: value })}
        >
          <SelectTrigger id="status">
            <SelectValue placeholder={t('pods.filters.allStatuses')} />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((statusOption) => (
              <SelectItem key={statusOption} value={statusOption}>
                {statusOption === 'all' ? t('pods.filters.allStatuses') : statusOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

