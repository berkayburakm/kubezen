import type { ReactNode } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

interface VirtualTableProps<T> {
  data: T[]
  itemHeight: number
  renderRow: (item: T, index: number) => ReactNode
  header?: ReactNode
  className?: string
  empty?: ReactNode
  itemKey?: (index: number, items: T[]) => string | number
}

export function VirtualTable<T>({
  data,
  itemHeight,
  renderRow,
  header,
  className,
  empty,
  itemKey,
}: VirtualTableProps<T>) {
  const { t } = useTranslation()

  return (
    <div className={cn('flex h-full min-h-[480px] flex-col overflow-hidden rounded-lg border bg-card', className)}>
      {header ? <div className="border-b bg-muted/60 px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">{header}</div> : null}
      <div className="flex-1">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {empty ?? t('common.noData')}
          </div>
        ) : (
          <AutoSizer>
            {({ height, width }) => (
              <FixedSizeList
                height={height}
                width={width}
                itemCount={data.length}
                itemSize={itemHeight}
                itemKey={(index) => (itemKey ? itemKey(index, data) : index)}
              >
                {({ index, style }) => (
                  <div style={style} className="px-2">
                    {renderRow(data[index], index)}
                  </div>
                )}
              </FixedSizeList>
            )}
          </AutoSizer>
        )}
      </div>
    </div>
  )
}

