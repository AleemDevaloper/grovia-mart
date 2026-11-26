import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/useAuth'
import { api } from '../lib/api'

export function useAddresses() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['addresses', user?.id],
    enabled: Boolean(user),
    queryFn: async () => (await api.addresses.list()).data,
  })
}

export function useOrders() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['orders', user?.id],
    enabled: Boolean(user),
    queryFn: async () => (await api.orders.list()).data,
  })
}

export function useOrder(identifier: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['order', identifier, user?.id],
    enabled: Boolean(user && identifier),
    queryFn: async () => (await api.orders.get(identifier!)).order,
  })
}
