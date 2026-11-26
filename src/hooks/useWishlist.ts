import { useCallback, useEffect } from 'react'
import { useAuth } from '../auth/useAuth'
import { api } from '../lib/api'
import { notify } from '../lib/toast'
import { useStore } from '../store'

// Shared across every consumer so a product grid only hydrates the wishlist once.
let loadedFor: number | null = null

export function useWishlist() {
  const ids = useStore((state) => state.wishlist)
  const setWishlist = useStore((state) => state.setWishlist)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      if (loadedFor !== null) {
        loadedFor = null
        useStore.getState().clearWishlist()
      }
      return
    }
    if (loadedFor === user.id) return
    let active = true
    api.wishlist
      .list()
      .then((result) => {
        if (!active) return
        loadedFor = user.id
        setWishlist(result.productIds)
      })
      .catch(() => {
        // Guest wishlist remains available if the sync endpoint is offline.
      })
    return () => {
      active = false
    }
  }, [user, setWishlist])

  const toggle = useCallback(
    async (productId: number) => {
      const current = useStore.getState().wishlist
      const saved = current.includes(productId)
      const optimistic = saved ? current.filter((id) => id !== productId) : [...current, productId]
      setWishlist(optimistic)
      if (!user) {
        notify(saved ? 'Removed from your wishlist' : 'Saved to your wishlist', saved ? 'info' : 'success')
        return
      }
      try {
        const result = saved ? await api.wishlist.remove(productId) : await api.wishlist.add(productId)
        setWishlist(result.productIds)
        notify(saved ? 'Removed from your wishlist' : 'Saved to your wishlist', saved ? 'info' : 'success')
      } catch {
        setWishlist(current)
        notify('We could not update your wishlist. Please try again.', 'error')
      }
    },
    [user, setWishlist],
  )

  return {
    ids,
    count: ids.length,
    isSaved: (id: number) => ids.includes(id),
    toggle,
  }
}
