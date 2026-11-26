import type { OrderStatus } from '../types'

const currency = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
})

export const ORDER_TRACKING_STEPS = [
  'pending',
  'confirmed',
  'processing',
  'ready_for_dispatch',
  'out_for_delivery',
  'delivered',
] as const satisfies readonly OrderStatus[]

export function money(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'Rs. 0'
  return currency.format(Number(value)).replace('PKR', 'Rs.')
}

export function compactMoney(value: number) {
  if (value >= 1_000_000) return `Rs. ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `Rs. ${Math.round(value / 1_000)}k`
  return money(value)
}

export function numeric(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export function shortDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value),
  )
}

export function dateTime(value: string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function dayLabel(value: string) {
  return new Intl.DateTimeFormat('en-PK', { weekday: 'short' }).format(new Date(value))
}

export function monthDay(value: string) {
  return new Intl.DateTimeFormat('en-PK', { day: 'numeric', month: 'short' }).format(new Date(value))
}

export function titleCase(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function formatOrderStatus(status: string) {
  const labels: Record<string, string> = {
    pending: 'Order received',
    confirmed: 'Confirmed',
    processing: 'Being prepared',
    ready_for_dispatch: 'Ready for delivery',
    out_for_delivery: 'Out for delivery',
    delivered: 'Done',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  }

  return labels[status] ?? status.replaceAll('_', ' ')
}

export function initials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function discountPercent(price: number, comparePrice: number | null) {
  if (!comparePrice || comparePrice <= price) return null
  return Math.round(((comparePrice - price) / comparePrice) * 100)
}

export function todayISO() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

export function addDaysISO(days: number) {
  const now = new Date()
  now.setDate(now.getDate() + days)
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

export function friendlyDate(isoDate: string) {
  if (isoDate === todayISO()) return 'Today'
  return new Intl.DateTimeFormat('en-PK', { weekday: 'short', day: 'numeric', month: 'short' }).format(
    new Date(`${isoDate}T12:00:00`),
  )
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function orderStatusTone(status: string) {
  if (['delivered', 'confirmed', 'processing', 'ready_for_dispatch', 'out_for_delivery'].includes(status)) return 'positive'
  if (['cancelled', 'refunded'].includes(status)) return 'negative'
  return 'neutral'
}
