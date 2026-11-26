import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from './types'
import { todayISO } from './lib/format'

export type CartItem = Product & { quantity: number }

export type AppliedCoupon = {
  code: string
  discount: number
  freeDelivery: boolean
  label: string
}

type Store = {
  cart: CartItem[]
  wishlist: number[]
  cartOpen: boolean
  deliveryDate: string
  deliverySlot: string
  deliveryAddress: string
  deliveryCity: string
  coupon: AppliedCoupon | null
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  setCartOpen: (open: boolean) => void
  toggleWishlist: (id: number) => void
  setWishlist: (ids: number[]) => void
  clearWishlist: () => void
  setDelivery: (input: { date?: string; slot?: string; address?: string; city?: string }) => void
  setCoupon: (coupon: AppliedCoupon | null) => void
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      cartOpen: false,
      deliveryDate: todayISO(),
      deliverySlot: 'Within 60 minutes',
      deliveryAddress: 'Gulberg III, Lahore',
      deliveryCity: 'Lahore',
      coupon: null,
      addToCart: (product, quantity = 1) =>
        set((state) => {
          const existing = state.cart.find((item) => item.id === product.id)
          if (existing) {
            return {
              cart: state.cart.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: Math.min(item.quantity + quantity, Math.max(1, product.stockQuantity)) }
                  : item,
              ),
            }
          }
          return { cart: [...state.cart, { ...product, quantity }] }
        }),
      removeFromCart: (id) => set((state) => ({ cart: state.cart.filter((item) => item.id !== id) })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          cart:
            quantity <= 0
              ? state.cart.filter((item) => item.id !== id)
              : state.cart.map((item) =>
                  item.id === id
                    ? { ...item, quantity: Math.min(quantity, Math.max(1, item.stockQuantity)) }
                    : item,
                ),
        })),
      clearCart: () => set({ cart: [], coupon: null }),
      setCartOpen: (open) => set({ cartOpen: open }),
      toggleWishlist: (id) =>
        set((state) => ({
          wishlist: state.wishlist.includes(id)
            ? state.wishlist.filter((item) => item !== id)
            : [...state.wishlist, id],
        })),
      setWishlist: (ids) => set({ wishlist: ids }),
      clearWishlist: () => set({ wishlist: [] }),
      setDelivery: (input) =>
        set((state) => ({
          deliveryDate: input.date ?? state.deliveryDate,
          deliverySlot: input.slot ?? state.deliverySlot,
          deliveryAddress: input.address ?? state.deliveryAddress,
          deliveryCity: input.city ?? state.deliveryCity,
        })),
      setCoupon: (coupon) => set({ coupon }),
    }),
    {
      name: 'grovia.store',
      partialize: (state) => ({
        cart: state.cart,
        wishlist: state.wishlist,
        deliveryDate: state.deliveryDate,
        deliverySlot: state.deliverySlot,
        deliveryAddress: state.deliveryAddress,
        deliveryCity: state.deliveryCity,
        coupon: state.coupon,
      }),
    },
  ),
)

export const cartSubtotal = (cart: CartItem[]) =>
  cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

export const cartCount = (cart: CartItem[]) => cart.reduce((sum, item) => sum + item.quantity, 0)
