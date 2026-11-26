import { createContext } from 'react'
import type { User } from '../types'

export type AuthContextValue = {
  user: User | null
  loading: boolean
  isStaff: boolean
  login: (email: string, password: string) => Promise<User>
  register: (input: {
    name: string
    email: string
    password: string
    password_confirmation: string
    phone?: string
    referral_code?: string
  }) => Promise<User>
  logout: () => Promise<void>
  updateProfile: (input: { name: string; phone?: string | null }) => Promise<User>
  changePassword: (input: { current_password: string; password: string; password_confirmation: string }) => Promise<void>
  refresh: () => Promise<void>
}

export const STAFF_ROLES = [
  'super_admin',
  'store_admin',
  'product_manager',
  'inventory_manager',
  'order_manager',
  'delivery_manager',
  'accountant',
  'customer_support',
] as const

export const AuthContext = createContext<AuthContextValue | null>(null)
