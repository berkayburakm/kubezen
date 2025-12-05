import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PodPhase } from '@/types/kube'

const statusStyles: Record<PodPhase, string> = {
  Running: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border-emerald-500/30',
  Pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-200 border-amber-500/30',
  Failed: 'bg-red-500/15 text-red-700 dark:text-red-200 border-red-500/30',
  Succeeded: 'bg-blue-500/15 text-blue-700 dark:text-blue-200 border-blue-500/30',
  Unknown: 'bg-slate-500/15 text-slate-700 dark:text-slate-200 border-slate-500/30',
}

interface StatusBadgeProps {
  status: PodPhase
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('capitalize', statusStyles[status])}>
      {status}
    </Badge>
  )
}

