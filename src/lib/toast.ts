import { useSyncExternalStore } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export type ToastItem = {
  id: number
  message: string
  tone: ToastTone
}

let toasts: ToastItem[] = []
let nextId = 1
const listeners = new Set<() => void>()
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function emit() {
  listeners.forEach((listener) => listener())
}

function remove(id: number) {
  toasts = toasts.filter((toast) => toast.id !== id)
  const timer = timers.get(id)
  if (timer) clearTimeout(timer)
  timers.delete(id)
  emit()
}

export function notify(message: string, tone: ToastTone = 'success') {
  const id = nextId++
  toasts = [...toasts, { id, message, tone }]
  emit()
  timers.set(
    id,
    setTimeout(() => remove(id), 4200),
  )
  return id
}

export function dismissToast(id: number) {
  remove(id)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useToasts() {
  return useSyncExternalStore(
    subscribe,
    () => toasts,
    () => toasts,
  )
}
