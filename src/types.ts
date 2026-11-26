export type Role =
  | 'customer'
  | 'super_admin'
  | 'store_admin'
  | 'product_manager'
  | 'inventory_manager'
  | 'order_manager'
  | 'delivery_manager'
  | 'accountant'
  | 'customer_support'

export type User = {
  id: number
  name: string
  email: string
  phone: string | null
  role: Role
  isActive: boolean
  createdAt: string
}

export type Category = {
  id: number
  name: string
  slug: string
  description?: string | null
  image?: string | null
  accent?: string | null
  productCount?: number
  count?: number
  sortOrder?: number
  isActive?: boolean
}

export type Product = {
  id: number
  name: string
  slug: string
  description: string
  shortDescription: string | null
  brand: string | null
  category: { id: number; name: string; slug: string }
  price: number
  comparePrice: number | null
  costPrice?: number | null
  unit: string
  sku: string | null
  stockQuantity: number
  lowStockThreshold?: number
  weightGrams?: number | null
  sortOrder?: number
  inStock: boolean
  isFeatured: boolean
  isActive?: boolean
  isOrganic: boolean
  badge: string | null
  rating: number
  reviewCount: number
  image: string
  gallery: string[]
  variants?: Variant[]
  accent: string | null
  createdAt: string
}

export type Variant = {
  id?: number
  label: string
  price: number
  comparePrice: number | null
  stockQuantity: number
  sku?: string | null
  sortOrder?: number
}

export type Review = {
  id: number
  rating: number
  title: string | null
  comment: string
  isApproved?: boolean
  createdAt: string
  user?: { name: string } | null
  author?: string | null
  product?: { id: number; name: string; slug: string; image: string } | null
}

export type Banner = {
  id: number
  title: string
  subtitle: string | null
  image: string
  link: string | null
  placement?: string
  sortOrder?: number
  isActive?: boolean
}

export type Testimonial = {
  id?: number
  name: string
  location?: string
  quote: string
  rating?: number
}

export type HomePayload = {
  categories: Category[]
  seasonal: Product[]
  bestsellers: Product[]
  offers: Product[]
  banners: Banner[]
  testimonials: Testimonial[]
  stats: {
    products: number
    categories: number
    reviewCount: number
    averageRating: number
    deliveryPromise: string
  }
  paymentSettings: {
    codMaxOrderAmount: number
  }
  siteContent: SiteContent
}

export type StorefrontSettings = {
  paymentSettings: {
    codMaxOrderAmount: number
  }
  siteContent: SiteContent
}

export type SiteContentSection = {
  id: 'departments' | 'collection' | 'seasonal' | 'values' | 'story' | 'testimonials' | 'newsletter'
  visible: boolean
  sortOrder: number
  eyebrow: string
  title: string
  description: string
}

export type SiteContentPage = {
  eyebrow: string
  title: string
  intro: string
  sections: { title: string; body: string }[]
}

export type SiteContent = {
  brand: {
    siteName: string
    tagline: string
    logoUrl: string
    announcement: string
    phone: string
    email: string
    address: string
    footerDescription: string
    newsletterTitle: string
    newsletterCopy: string
    primaryColor: string
    accentColor: string
  }
  home: {
    hero: {
      announcement: string
      eyebrow: string
      title: string
      highlight: string
      lead: string
      primaryCta: string
      secondaryCta: string
    }
    sections: SiteContentSection[]
    values: { title: string; copy: string }[]
    storyHighlight: string
    storyPoints: string[]
  }
  pages: Record<'about' | 'contact' | 'delivery' | 'faqs' | 'privacy' | 'terms' | 'returns', SiteContentPage>
}

export type PaginationMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type ProductListPayload = {
  data: Product[]
  meta: PaginationMeta
}

export type ProductDetailPayload = {
  product: Product & { variants?: Variant[] }
  related: Product[]
  reviews: Review[]
}

export type Address = {
  id: number
  label: string | null
  recipientName: string
  phone: string
  addressLine: string
  city: string
  area: string
  postalCode: string | null
  isDefault: boolean
}

export type AddressInput = {
  label?: string
  recipient_name: string
  phone: string
  address_line: string
  city: string
  area: string
  postal_code?: string
  is_default?: boolean
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_for_dispatch'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type OrderItem = {
  id: number
  productId: number | null
  productName: string
  unit: string
  quantity: number
  unitPrice: number
  lineTotal: number
  image?: string | null
  slug?: string | null
}

export type OrderStatusEntry = {
  id: number
  status: OrderStatus
  note: string | null
  changedBy?: string | null
  createdAt: string
}

export type OrderSummary = {
  id: number
  orderNumber: string
  status: OrderStatus
  paymentMethod: string
  paymentStatus: string
  total: number
  itemCount?: number
  placedAt: string
  deliveryDate?: string
  deliverySlot?: string
  customer?: { id: number; name: string; email: string; phone?: string | null } | null
}

export type Order = OrderSummary & {
  subtotal: number
  discount: number
  deliveryFee: number
  recipientName: string
  phone: string
  addressLine: string
  city: string
  area: string
  postalCode?: string | null
  deliveryLocation?: { latitude: number; longitude: number } | null
  deliveryDate: string
  deliverySlot: string
  notes: string | null
  cancelledAt?: string | null
  items: OrderItem[]
  statusHistory: OrderStatusEntry[]
  customer?: { id: number; name: string; email: string } | null
  couponCode?: string | null
}

export type Coupon = {
  id: number
  code: string
  type: 'percentage' | 'fixed' | 'free_delivery'
  value: number
  minOrder: number
  maxDiscount: number | null
  startsAt: string | null
  endsAt: string | null
  usageLimit: number | null
  usedCount: number
  isActive: boolean
}

export type CouponValidation = {
  valid: boolean
  code: string
  type: Coupon['type'] | null
  value: number | null
  discount: number
  freeDelivery: boolean
  message: string
}

export type DeliveryZone = {
  id: number
  name: string
  city: string
  areas: string[]
  fee: number
  freeDeliveryThreshold: number
  minOrder: number
  isActive: boolean
  sortOrder?: number
}

export type DeliverySlot = {
  id: number
  label: string
  startTime: string | null
  endTime: string | null
  isAllDay: boolean
  dayOffset: number
  capacity: number | null
  isAvailable?: boolean
  availabilityReason?: 'lead_time' | 'time_passed' | 'full' | 'missing_window' | 'invalid_window' | null
  remainingCapacity?: number | null
  isActive: boolean
  sortOrder?: number
}

export type AdminCustomer = {
  id: number
  name: string
  email: string
  phone: string | null
  role: Role
  isActive: boolean
  ordersCount: number
  totalSpent: number
  lastOrderAt: string | null
  createdAt: string
}

export type StaffMember = {
  id: number
  name: string
  email: string
  phone: string | null
  role: Role
  isActive: boolean
  createdAt: string
}

export type AuditLog = {
  id: number
  action: string
  subjectType: string | null
  subjectId: string | null
  meta: Record<string, unknown> | null
  user: { id: number; name: string } | null
  createdAt: string
}

export type DashboardData = {
  totals: {
    revenue: number
    grossProfit: number | null
    missingCostItemCount: number
    orders: number
    pending: number
    completed: number
    customers: number
    averageOrderValue: number
    lowStockCount: number
    refunds: number
    refundAmount: number
    stockAlerts: Array<{
      id: number
      name: string
      sku: string | null
      stockQuantity: number
      lowStockThreshold: number
    }>
  }
  dailySales: { date: string; total: number; orders: number }[]
  statusDistribution: { status: OrderStatus; count: number }[]
  topProducts: { name: string; qty: number; revenue: number }[]
  revenueByCategory: { name: string; revenue: number }[]
  newCustomers: number
}

export type Settings = Record<string, string | number | null>

export type LoyaltyReward = {
  id: number
  title: string
  description: string | null
  type: string
  pointsCost: number
  discountType: 'fixed' | 'percentage' | null
  discountValue: number | null
  maxDiscount: number | null
  product: { id: number; name: string; image: string | null } | null
  stockRemaining: number | null
  perCustomerLimit: number | null
  startsAt: string | null
  endsAt: string | null
  isActive?: boolean
  claimsCount?: number | null
}

export type LoyaltySummary = {
  account: {
    availablePoints: number
    lifetimeEarnedPoints: number
    redeemedPoints: number
    pendingPoints: number
    expiringPoints: number
    tier: { name: string; color: string | null; benefits: string[] } | null
  }
  nextReward: LoyaltyReward | null
}

export type LoyaltyTransaction = {
  id: number
  type: string
  points: number
  reason: string | null
  referenceType: string | null
  referenceId: string | null
  createdAt: string
}

export type LoyaltyRedemption = {
  id: number
  claimCode: string
  status: string
  pointsCost: number
  expiresAt: string | null
  reward: LoyaltyReward
}

export type LoyaltyTier = {
  id: number
  name: string
  minLifetimePoints: number
  color: string
  benefits: string[]
  sortOrder?: number
  isActive?: boolean
}

export type LoyaltyCampaign = {
  id: number
  name: string
  description: string | null
  pointsMultiplier: number
  minOrderAmount: number
  startsAt: string | null
  endsAt: string | null
  isActive?: boolean
}

export type LoyaltyReferral = {
  id: number
  status: string
  referrerPoints: number
  referredPoints: number
  createdAt: string | null
  qualifiedAt: string | null
  rewardedAt: string | null
}

export type LoyaltyReferralSummary = {
  code: string
  isEnabled: boolean
  rewards: { referrerPoints: number; referredPoints: number; minOrderAmount: number }
  stats: { total: number; rewarded: number }
  referrals: LoyaltyReferral[]
}

export type AdminLoyaltyDashboard = {
  accountsCount: number
  availablePoints: number
  lifetimeEarnedPoints: number
  redeemedPoints: number
  claimedRewards: number
  expiringPoints: number
}

export type LoyaltyRule = {
  id: number
  name: string
  pointsPerCurrency: number
  minOrderAmount: number
  expiryDays: number | null
  startsAt: string | null
  endsAt: string | null
  isActive: boolean
}

export type AdminLoyaltyCustomer = {
  id: number
  name: string
  email: string
  phone: string | null
  account: LoyaltySummary['account'] | null
}

export type AdminLoyaltyTransaction = LoyaltyTransaction & {
  customer: { id: number; name: string; email: string }
}

export type AdminLoyaltyReferral = {
  id: number
  status: string
  referrer: { id: number; name: string; email: string }
  referred: { id: number; name: string; email: string }
  qualifyingOrderId: number | null
  referrerPoints: number
  referredPoints: number
  createdAt: string | null
  rewardedAt: string | null
}

export type LoyaltyReferralSettings = {
  isEnabled: boolean
  referrerPoints: number
  referredPoints: number
  minOrderAmount: number
}
