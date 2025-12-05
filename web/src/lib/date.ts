const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

type TimeUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute'

const intervals: { unit: TimeUnit; ms: number }[] = [
  { unit: 'year', ms: 1000 * 60 * 60 * 24 * 365 },
  { unit: 'month', ms: 1000 * 60 * 60 * 24 * 30 },
  { unit: 'week', ms: 1000 * 60 * 60 * 24 * 7 },
  { unit: 'day', ms: 1000 * 60 * 60 * 24 },
  { unit: 'hour', ms: 1000 * 60 * 60 },
  { unit: 'minute', ms: 1000 * 60 },
]

export function timeAgoFrom(timestamp: string): string {
  const target = new Date(timestamp)
  if (Number.isNaN(target.getTime())) {
    return 'unknown'
  }

  const diff = target.getTime() - Date.now()
  for (const { unit, ms } of intervals) {
    const value = Math.round(diff / ms)
    if (Math.abs(value) >= 1) {
      return formatter.format(value, unit)
    }
  }
  return 'just now'
}

