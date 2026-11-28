import type {
  Address,
  AddressInput,
  AdminLoyaltyCustomer,
  AdminLoyaltyDashboard,
  AdminLoyaltyReferral,
  AdminLoyaltyTransaction,
  AdminCustomer,
  AuditLog,
  Banner,
  Category,
  Coupon,
  CouponValidation,
  DashboardData,
  DeliverySlot,
  DeliveryZone,
  HomePayload,
  LoyaltyCampaign,
  LoyaltyReferralSettings,
  LoyaltyRedemption,
  LoyaltyReferralSummary,
  LoyaltyReward,
  LoyaltyRule,
  LoyaltySummary,
  LoyaltyTier,
  LoyaltyTransaction,
  Order,
  OrderSummary,
  PaginationMeta,
  Product,
  ProductDetailPayload,
  ProductListPayload,
  Review,
  Settings,
  SiteContent,
  StorefrontSettings,
  StaffMember,
  User,
} from '../types'

const configuredApiBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')
const productionApiBase = 'https://gr.asiancon.com/api'
const invalidPlaceholderApi = /^https?:\/\/[^/]+\.invalid(?:\/|$)/i.test(configuredApiBase ?? '')
export const API_BASE = configuredApiBase && !invalidPlaceholderApi
  ? configuredApiBase
  : import.meta.env.PROD
    ? productionApiBase
    : configuredApiBase ?? 'http://127.0.0.1:8000/api'
export const TOKEN_KEY = 'grovia.auth.token'
export const USER_KEY = 'grovia.auth.user'

let token: string | null = typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY)

export function getToken() {
  return token
}

export function setToken(next: string | null) {
  token = next
  if (typeof window === 'undefined') return
  if (next) window.localStorage.setItem(TOKEN_KEY, next)
  else window.localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  errors: Record<string, string[]>

  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }

  fieldError(field: string) {
    return this.errors[field]?.[0] ?? null
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
  auth?: boolean
}

function isFormDataBody(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, auth = true } = options
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined && !isFormDataBody(body)) headers['Content-Type'] = 'application/json'
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormDataBody(body) ? body : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error
    throw new ApiError('The Grovia service is unreachable. Check that the API server is running.', 0)
  }

  if (response.status === 204) return undefined as T

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const errorPayload = payload && typeof payload === 'object'
      ? payload as { message?: string; errors?: Record<string, string[]> }
      : {}
    if (response.status === 401 && auth) {
      setToken(null)
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('grovia:unauthorized'))
    }
    throw new ApiError(
      errorPayload.message ?? 'Something went wrong. Please try again.',
      response.status,
      errorPayload.errors ?? {},
    )
  }
  if (!payload || typeof payload !== 'object') {
    throw new ApiError('The Grovia API returned an unexpected response. Check the API URL and server status.', 502)
  }
  return payload as T
}

function query(params: Record<string, string | number | boolean | null | undefined>) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '' || value === false) return
    search.set(key, typeof value === 'boolean' ? '1' : String(value))
  })
  const result = search.toString()
  return result ? `?${result}` : ''
}

export type ProductQuery = {
  q?: string
  category?: string
  brand?: string
  min_price?: number | string
  max_price?: number | string
  in_stock?: boolean
  organic?: boolean
  discount?: boolean
  sort?: string
  per_page?: number
  page?: number
}

export type AdminPageSize = 10 | 30 | 50 | 100 | 300 | 500 | 'all'

export type OrderPayload = {
  items: { product_id: number; quantity: number }[]
  address_id?: number
  address?: AddressInput
  delivery_location?: { latitude: number; longitude: number }
  delivery_date: string
  delivery_slot: string
  payment_method: 'cod'
  notes?: string
  client_order_id: string
  coupon_code?: string
  reward_claim_code?: string
}

export type ShoppingAssistantMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type ShoppingAssistantSuggestion = {
  name: string
  slug: string
  price: number
  unit: string
  inStock: boolean
}

export type ProductInput = {
  name: string
  slug?: string
  category_id: number | null
  brand?: string | null
  description: string
  short_description?: string | null
  price: number
  compare_price?: number | null
  cost_price?: number | null
  unit: string
  sku?: string | null
  weight_grams?: number | null
  stock_quantity: number
  low_stock_threshold?: number
  sort_order?: number
  is_active?: boolean
  is_featured?: boolean
  is_organic?: boolean
  badge?: string | null
  accent?: string | null
  image: string
  gallery?: string[]
  variants?: ProductVariantInput[]
}

export type ProductVariantInput = {
  label: string
  price: number
  compare_price?: number | null
  stock_quantity?: number
  sku?: string | null
}

export type CategoryInput = {
  name: string
  slug?: string
  description?: string | null
  image?: string | null
  accent?: string | null
  sort_order?: number
  is_active?: boolean
}

export type CouponInput = {
  code: string
  type: Coupon['type']
  value: number
  min_order?: number
  max_discount?: number | null
  starts_at?: string | null
  ends_at?: string | null
  usage_limit?: number | null
  is_active?: boolean
}

export type BannerInput = {
  title: string
  subtitle?: string | null
  image: string
  link?: string | null
  placement?: string
  sort_order?: number
  is_active?: boolean
}

export type DeliveryZoneInput = {
  name: string
  city: string
  areas: string[]
  fee?: number
  free_delivery_threshold?: number
  min_order?: number
  is_active?: boolean
  sort_order?: number
}

export type DeliverySlotInput = {
  label: string
  start_time?: string | null
  end_time?: string | null
  is_all_day?: boolean
  day_offset?: number
  capacity?: number | null
  is_active?: boolean
  sort_order?: number
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ user: User; token: string }>('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
    register: (input: { name: string; email: string; password: string; password_confirmation: string; phone?: string; referral_code?: string }) =>
      request<{ user: User; token: string }>('/auth/register', { method: 'POST', body: input, auth: false }),
    me: () => request<{ user: User }>('/auth/me'),
    logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
    updateProfile: (input: { name: string; phone?: string | null }) =>
      request<{ user: User }>('/auth/profile', { method: 'PUT', body: input }),
    changePassword: (input: { current_password: string; password: string; password_confirmation: string }) =>
      request<{ message: string }>('/auth/password', { method: 'PUT', body: input }),
    forgotPassword: (email: string) =>
      request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),
    resetPassword: (input: { token: string; email: string; password: string; password_confirmation: string }) =>
      request<{ message: string }>('/auth/reset-password', { method: 'POST', body: input, auth: false }),
  },
  catalog: {
    home: (signal?: AbortSignal) => request<HomePayload>('/home', { auth: false, signal }),
    storefrontSettings: () => request<StorefrontSettings>('/site-content', { auth: false }),
    categories: (signal?: AbortSignal) => request<{ data: Category[] }>('/categories', { auth: false, signal }),
    products: (params: ProductQuery = {}, signal?: AbortSignal) =>
      request<ProductListPayload>(`/products${query({ per_page: 12, ...params })}`, { auth: false, signal }),
    product: (slug: string, signal?: AbortSignal) =>
      request<ProductDetailPayload>(`/products/${encodeURIComponent(slug)}`, { auth: false, signal }),
    reviews: (slug: string) => request<{ data: Review[] }>(`/products/${encodeURIComponent(slug)}/reviews`, { auth: false }),
    createReview: (slug: string, input: { rating: number; title?: string; comment: string }) =>
      request<{ review: Review; message?: string }>(`/products/${encodeURIComponent(slug)}/reviews`, { method: 'POST', body: input }),
    validateCoupon: (code: string, subtotal: number) =>
      request<CouponValidation>('/coupons/validate', { method: 'POST', body: { code, subtotal }, auth: false }),
    newsletter: (email: string) =>
      request<{ message: string }>('/newsletter', { method: 'POST', body: { email }, auth: false }),
  },
  shoppingAssistant: {
    reply: (message: string, history: ShoppingAssistantMessage[]) =>
      request<{ reply: string; suggestions: ShoppingAssistantSuggestion[] }>('/chat', {
        method: 'POST',
        body: { message, history },
        auth: false,
      }),
  },
  delivery: {
    zones: () => request<{ data: DeliveryZone[] }>('/delivery/zones', { auth: false }),
    slots: (date: string) => request<{ data: DeliverySlot[] }>(`/delivery/slots${query({ date })}`, { auth: false }),
  },
  wishlist: {
    list: () => request<{ productIds: number[]; products: Product[] }>('/wishlist'),
    add: (productId: number) => request<{ productIds: number[] }>('/wishlist', { method: 'POST', body: { product_id: productId } }),
    remove: (productId: number) => request<{ productIds: number[] }>(`/wishlist/${productId}`, { method: 'DELETE' }),
  },
  addresses: {
    list: () => request<{ data: Address[] }>('/addresses'),
    create: (input: AddressInput) => request<{ address: Address }>('/addresses', { method: 'POST', body: input }),
    update: (id: number, input: AddressInput) => request<{ address: Address }>(`/addresses/${id}`, { method: 'PUT', body: input }),
    remove: (id: number) => request<{ message: string }>(`/addresses/${id}`, { method: 'DELETE' }),
  },
  loyalty: {
    summary: () => request<LoyaltySummary>('/loyalty/summary'),
    rewards: () => request<{ data: LoyaltyReward[] }>('/loyalty/rewards'),
    tiers: () => request<{ data: LoyaltyTier[] }>('/loyalty/tiers'),
    campaigns: () => request<{ data: LoyaltyCampaign[] }>('/loyalty/campaigns'),
    referrals: () => request<LoyaltyReferralSummary>('/loyalty/referrals'),
    transactions: (params: { per_page?: AdminPageSize; page?: number } = {}) =>
      request<{ data: LoyaltyTransaction[]; meta: PaginationMeta }>(`/loyalty/transactions${query(params)}`),
    claims: (params: { per_page?: number; page?: number } = {}) =>
      request<{ data: LoyaltyRedemption[]; meta: PaginationMeta }>(`/loyalty/claims${query(params)}`),
    redeemReward: (rewardId: number) =>
      request<{ redemption: LoyaltyRedemption; account: LoyaltySummary['account'] }>(`/loyalty/rewards/${rewardId}/redeem`, { method: 'POST' }),
  },
  orders: {
    create: (input: OrderPayload) => request<{ order: Order; duplicate?: boolean }>('/orders', { method: 'POST', body: input }),
    list: () => request<{ data: OrderSummary[] }>('/orders'),
    get: (identifier: string | number) => request<{ order: Order }>(`/orders/${identifier}`),
    cancel: (id: number) => request<{ order: Order }>(`/orders/${id}/cancel`, { method: 'POST' }),
  },
  admin: {
    loyaltyDashboard: () => request<AdminLoyaltyDashboard>('/admin/loyalty/dashboard'),
    loyaltyRules: () => request<{ data: LoyaltyRule[] }>('/admin/loyalty/rules'),
    createLoyaltyRule: (input: {
      name: string; points_per_currency: number; min_order_amount?: number; expiry_days?: number | null;
      starts_at?: string | null; ends_at?: string | null; is_active: boolean
    }) => request<{ rule: LoyaltyRule }>('/admin/loyalty/rules', { method: 'POST', body: input }),
    updateLoyaltyRule: (id: number, input: {
      name: string; points_per_currency: number; min_order_amount?: number; expiry_days?: number | null;
      starts_at?: string | null; ends_at?: string | null; is_active: boolean
    }) => request<{ rule: LoyaltyRule }>(`/admin/loyalty/rules/${id}`, { method: 'PUT', body: input }),
    deleteLoyaltyRule: (id: number) => request<{ message: string }>(`/admin/loyalty/rules/${id}`, { method: 'DELETE' }),
    loyaltyRewards: () => request<{ data: LoyaltyReward[] }>('/admin/loyalty/rewards'),
    createLoyaltyReward: (input: {
      title: string; description?: string | null; type: 'discount' | 'free_product'; points_cost: number;
      discount_type?: 'fixed' | 'percentage' | null; discount_value?: number | null; max_discount?: number | null;
      product_id?: number | null; stock?: number | null; per_customer_limit?: number | null;
      starts_at?: string | null; ends_at?: string | null; is_active: boolean
    }) => request<{ reward: LoyaltyReward }>('/admin/loyalty/rewards', { method: 'POST', body: input }),
    updateLoyaltyReward: (id: number, input: {
      title: string; description?: string | null; type: 'discount' | 'free_product'; points_cost: number;
      discount_type?: 'fixed' | 'percentage' | null; discount_value?: number | null; max_discount?: number | null;
      product_id?: number | null; stock?: number | null; per_customer_limit?: number | null;
      starts_at?: string | null; ends_at?: string | null; is_active: boolean
    }) => request<{ reward: LoyaltyReward }>(`/admin/loyalty/rewards/${id}`, { method: 'PUT', body: input }),
    deleteLoyaltyReward: (id: number) => request<{ message: string }>(`/admin/loyalty/rewards/${id}`, { method: 'DELETE' }),
    loyaltyTiers: () => request<{ data: LoyaltyTier[] }>('/admin/loyalty/tiers'),
    createLoyaltyTier: (input: {
      name: string; min_lifetime_points: number; color: string; benefits: string[];
      sort_order: number; is_active: boolean
    }) => request<{ tier: LoyaltyTier }>('/admin/loyalty/tiers', { method: 'POST', body: input }),
    updateLoyaltyTier: (id: number, input: {
      name: string; min_lifetime_points: number; color: string; benefits: string[];
      sort_order: number; is_active: boolean
    }) => request<{ tier: LoyaltyTier }>(`/admin/loyalty/tiers/${id}`, { method: 'PUT', body: input }),
    deleteLoyaltyTier: (id: number) => request<{ message: string }>(`/admin/loyalty/tiers/${id}`, { method: 'DELETE' }),
    loyaltyCampaigns: () => request<{ data: LoyaltyCampaign[] }>('/admin/loyalty/campaigns'),
    createLoyaltyCampaign: (input: {
      name: string; description?: string | null; points_multiplier: number; min_order_amount?: number;
      starts_at?: string | null; ends_at?: string | null; is_active: boolean
    }) => request<{ campaign: LoyaltyCampaign }>('/admin/loyalty/campaigns', { method: 'POST', body: input }),
    updateLoyaltyCampaign: (id: number, input: {
      name: string; description?: string | null; points_multiplier: number; min_order_amount?: number;
      starts_at?: string | null; ends_at?: string | null; is_active: boolean
    }) => request<{ campaign: LoyaltyCampaign }>(`/admin/loyalty/campaigns/${id}`, { method: 'PUT', body: input }),
    deleteLoyaltyCampaign: (id: number) => request<{ message: string }>(`/admin/loyalty/campaigns/${id}`, { method: 'DELETE' }),
    loyaltyReferralSettings: () => request<{ settings: LoyaltyReferralSettings }>('/admin/loyalty/referrals/settings'),
    updateLoyaltyReferralSettings: (input: {
      is_enabled: boolean; referrer_points: number; referred_points: number; min_order_amount?: number
    }) => request<{ settings: LoyaltyReferralSettings }>('/admin/loyalty/referrals/settings', { method: 'PUT', body: input }),
    loyaltyReferrals: (params: { status?: string; per_page?: AdminPageSize; page?: number } = {}) =>
      request<{ data: AdminLoyaltyReferral[]; meta: PaginationMeta }>(`/admin/loyalty/referrals${query(params)}`),
    loyaltyCustomers: (params: { q?: string; per_page?: AdminPageSize; page?: number } = {}) =>
      request<{ data: AdminLoyaltyCustomer[]; meta: PaginationMeta }>(`/admin/loyalty/customers${query(params)}`),
    adjustLoyaltyCustomer: (id: number, input: { points: number; reason: string }) =>
      request<{ transaction: LoyaltyTransaction; account: LoyaltySummary['account'] }>(`/admin/loyalty/customers/${id}/adjustments`, { method: 'POST', body: input }),
    loyaltyTransactions: (params: { q?: string; type?: string; per_page?: AdminPageSize; page?: number } = {}) =>
      request<{ data: AdminLoyaltyTransaction[]; meta: PaginationMeta }>(`/admin/loyalty/transactions${query(params)}`),
    dashboard: (range = '30d') => request<DashboardData>(`/admin/dashboard${query({ range })}`),
    orders: (params: { status?: string; q?: string; per_page?: AdminPageSize; page?: number } = {}) =>
      request<{ data: Order[]; meta: ProductListPayload['meta'] }>(`/admin/orders${query(params)}`),
    order: (id: number) => request<{ order: Order }>(`/admin/orders/${id}`),
    updateOrderStatus: (id: number, status: string, note?: string) =>
      request<{ order: Order }>(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status, note } }),
    products: (params: { q?: string; category?: string; status?: string; stock?: string; per_page?: AdminPageSize; page?: number } = {}) =>
      request<{ data: Product[]; meta: ProductListPayload['meta'] }>(`/admin/products${query(params)}`),
    createProduct: (input: ProductInput) => request<{ product: Product }>('/admin/products', { method: 'POST', body: input }),
    updateProduct: (id: number, input: Partial<ProductInput>) =>
      request<{ product: Product }>(`/admin/products/${id}`, { method: 'PUT', body: input }),
    uploadProductImage: (file: File) => {
      const body = new FormData()
      body.append('image', file)
      return request<{ url: string }>('/admin/product-images', { method: 'POST', body })
    },
    uploadCategoryImage: (file: File) => {
      const body = new FormData()
      body.append('image', file)
      return request<{ url: string }>('/admin/category-images', { method: 'POST', body })
    },
    deleteProduct: (id: number) => request<{ message: string }>(`/admin/products/${id}`, { method: 'DELETE' }),
    categories: () => request<{ data: Category[] }>('/admin/categories'),
    createCategory: (input: CategoryInput) => request<{ category: Category }>('/admin/categories', { method: 'POST', body: input }),
    updateCategory: (id: number, input: Partial<CategoryInput>) =>
      request<{ category: Category }>(`/admin/categories/${id}`, { method: 'PUT', body: input }),
    deleteCategory: (id: number) => request<{ message: string }>(`/admin/categories/${id}`, { method: 'DELETE' }),
    customers: (params: { q?: string; per_page?: AdminPageSize; page?: number } = {}) =>
      request<{ data: AdminCustomer[]; meta: ProductListPayload['meta'] }>(`/admin/customers${query(params)}`),
    toggleCustomer: (id: number, isActive: boolean) =>
      request<{ customer: AdminCustomer }>(`/admin/customers/${id}`, { method: 'PATCH', body: { is_active: isActive } }),
    reviews: (params: { q?: string; status?: string; per_page?: AdminPageSize; page?: number } = {}) =>
      request<{ data: Review[]; meta: ProductListPayload['meta'] }>(`/admin/reviews${query(params)}`),
    approveReview: (id: number, isApproved: boolean) =>
      request<{ review: Review }>(`/admin/reviews/${id}`, { method: 'PATCH', body: { is_approved: isApproved } }),
    coupons: () => request<{ data: Coupon[] }>('/admin/coupons'),
    createCoupon: (input: CouponInput) => request<{ coupon: Coupon }>('/admin/coupons', { method: 'POST', body: input }),
    updateCoupon: (id: number, input: Partial<CouponInput>) =>
      request<{ coupon: Coupon }>(`/admin/coupons/${id}`, { method: 'PUT', body: input }),
    deleteCoupon: (id: number) => request<{ message: string }>(`/admin/coupons/${id}`, { method: 'DELETE' }),
    banners: () => request<{ data: Banner[] }>('/admin/banners'),
    createBanner: (input: BannerInput) => request<{ banner: Banner }>('/admin/banners', { method: 'POST', body: input }),
    updateBanner: (id: number, input: Partial<BannerInput>) =>
      request<{ banner: Banner }>(`/admin/banners/${id}`, { method: 'PUT', body: input }),
    deleteBanner: (id: number) => request<{ message: string }>(`/admin/banners/${id}`, { method: 'DELETE' }),
    deliveryZones: () => request<{ data: DeliveryZone[] }>('/admin/delivery-zones'),
    createZone: (input: DeliveryZoneInput) =>
      request<{ zone: DeliveryZone }>('/admin/delivery-zones', { method: 'POST', body: input }),
    updateZone: (id: number, input: Partial<DeliveryZoneInput>) =>
      request<{ zone: DeliveryZone }>(`/admin/delivery-zones/${id}`, { method: 'PUT', body: input }),
    deleteZone: (id: number) => request<{ message: string }>(`/admin/delivery-zones/${id}`, { method: 'DELETE' }),
    deliverySlots: () => request<{ data: DeliverySlot[] }>('/admin/delivery-slots'),
    createSlot: (input: DeliverySlotInput) =>
      request<{ slot: DeliverySlot }>('/admin/delivery-slots', { method: 'POST', body: input }),
    updateSlot: (id: number, input: Partial<DeliverySlotInput>) =>
      request<{ slot: DeliverySlot }>(`/admin/delivery-slots/${id}`, { method: 'PUT', body: input }),
    deleteSlot: (id: number) => request<{ message: string }>(`/admin/delivery-slots/${id}`, { method: 'DELETE' }),
    staff: () => request<{ data: StaffMember[] }>('/admin/staff'),
    createStaff: (input: { name: string; email: string; password: string; role: string; phone?: string | null; is_active?: boolean }) =>
      request<{ staff: StaffMember }>('/admin/staff', { method: 'POST', body: input }),
    updateStaff: (id: number, input: { role?: string; is_active?: boolean; name?: string; phone?: string | null }) =>
      request<{ staff: StaffMember }>(`/admin/staff/${id}`, { method: 'PUT', body: input }),
    deleteStaff: (id: number) => request<{ message: string }>(`/admin/staff/${id}`, { method: 'DELETE' }),
    settings: () => request<Settings>('/admin/settings'),
    updateSettings: (input: Settings) => request<Settings>('/admin/settings', { method: 'PUT', body: input }),
    siteContent: () => request<SiteContent>('/admin/site-content'),
    updateSiteContent: (input: SiteContent) => request<SiteContent>('/admin/site-content', { method: 'PUT', body: input }),
    auditLogs: (params: { q?: string; per_page?: AdminPageSize; page?: number } = {}) =>
      request<{ data: AuditLog[]; meta: ProductListPayload['meta'] }>(`/admin/audit-logs${query(params)}`),
  },
}
