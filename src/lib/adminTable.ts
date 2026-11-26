import type { AdminPageSize } from './api'

export function pageItems<T>(items: T[], page: number, pageSize: AdminPageSize): T[] {
  if (pageSize === 'all') return items
  const start = (page - 1) * pageSize
  return items.slice(start, start + pageSize)
}
