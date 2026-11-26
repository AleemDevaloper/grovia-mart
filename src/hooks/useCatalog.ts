import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, type ProductQuery } from '../lib/api'
import type { Category, HomePayload, ProductDetailPayload, ProductListPayload, StorefrontSettings } from '../types'

export function useHome() {
  return useQuery<HomePayload>({
    queryKey: ['home', 'admin-managed'],
    queryFn: ({ signal }) => api.catalog.home(signal),
    staleTime: 1000 * 60 * 5,
  })
}

export function useStorefrontSettings() {
  return useQuery<StorefrontSettings>({
    queryKey: ['storefront-settings'],
    queryFn: api.catalog.storefrontSettings,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories', 'admin-managed'],
    queryFn: async ({ signal }) => (await api.catalog.categories(signal)).data,
    staleTime: 1000 * 60 * 10,
  })
}

export function useProducts(query: ProductQuery) {
  return useQuery<ProductListPayload>({
    queryKey: ['products', 'admin-managed', query],
    queryFn: ({ signal }) => api.catalog.products(query, signal),
    staleTime: 1000 * 60 * 3,
  })
}

export function useProduct(slug: string) {
  return useQuery<ProductDetailPayload>({
    queryKey: ['product', slug, 'admin-managed'],
    enabled: Boolean(slug),
    queryFn: ({ signal }) => api.catalog.product(slug, signal),
    staleTime: 1000 * 60 * 3,
  })
}

export function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState<T>(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}
