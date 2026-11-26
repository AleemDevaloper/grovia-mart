import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowRight, BarChart3, CircleDollarSign, ClipboardList, Clock3, Download, ExternalLink, Eye, Gift, Image, LogOut, MapPin, Menu, Package, Pencil, Plus, Search, Settings as SettingsIcon, ShieldAlert, Star, Tag, TicketPercent, Users, X } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { notify } from '../lib/toast'
import { AdminTablePagination } from '../components/AdminTablePagination'
import { api, type AdminPageSize, type ProductInput } from '../lib/api'
import { formatOrderStatus, ORDER_TRACKING_STEPS } from '../lib/format'
import { downloadOrderInvoicePdf } from '../lib/invoicePdf'
import type { AdminCustomer, Category, Order, OrderStatus, Product, Review, Role, Variant } from '../types'
import { AdminOperations, type AdminOperationsModule } from './AdminOperations'
import { LoyaltyAdmin } from './LoyaltyAdmin'
import { SiteEditor } from './SiteEditor'

type Module = 'Overview' | 'Orders' | 'Products' | 'Customers' | 'Reviews' | 'Loyalty' | 'Site editor' | AdminOperationsModule
const nextOrderStatuses: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['ready_for_dispatch', 'cancelled'],
  ready_for_dispatch: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
}
const orderStatuses: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'ready_for_dispatch',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
]
const moduleSlugs: Record<Module, string> = {
  Overview: 'overview',
  Orders: 'orders',
  Products: 'products',
  Customers: 'customers',
  Reviews: 'reviews',
  Loyalty: 'loyalty',
  'Site editor': 'site-editor',
  Categories: 'categories',
  Coupons: 'coupons',
  Banners: 'banners',
  'Delivery zones': 'delivery-zones',
  'Delivery slots': 'delivery-slots',
  Staff: 'staff',
  Settings: 'settings',
  'Audit logs': 'audit-logs',
}

type VariantDraft = {
  label: string
  price: string
  comparePrice: string
  stock: string
  sku: string
}

const emptyVariantDraft: VariantDraft = {
  label: '',
  price: '',
  comparePrice: '',
  stock: '0',
  sku: '',
}

const navigation = [
  ['Overview', BarChart3],
  ['Orders', ClipboardList],
  ['Products', Package],
  ['Categories', Tag],
  ['Customers', Users],
  ['Reviews', Star],
  ['Loyalty', Gift],
  ['Site editor', Image],
  ['Coupons', TicketPercent],
  ['Banners', Image],
  ['Delivery zones', MapPin],
  ['Delivery slots', Clock3],
  ['Staff', Users],
  ['Settings', SettingsIcon],
  ['Audit logs', ClipboardList],
] as const

const moduleRoles: Record<Module, Role[]> = {
  Overview: ['super_admin', 'store_admin', 'product_manager', 'inventory_manager', 'order_manager', 'delivery_manager', 'accountant', 'customer_support'],
  Orders: ['super_admin', 'store_admin', 'order_manager', 'customer_support'],
  Products: ['super_admin', 'store_admin', 'product_manager', 'inventory_manager'],
  Categories: ['super_admin', 'store_admin', 'product_manager'],
  Customers: ['super_admin', 'store_admin', 'customer_support'],
  Reviews: ['super_admin', 'store_admin', 'customer_support'],
  Loyalty: ['super_admin'],
  'Site editor': ['super_admin', 'store_admin', 'product_manager'],
  Coupons: ['super_admin', 'store_admin', 'accountant'],
  Banners: ['super_admin', 'store_admin', 'product_manager'],
  'Delivery zones': ['super_admin', 'store_admin', 'delivery_manager'],
  'Delivery slots': ['super_admin', 'store_admin', 'delivery_manager'],
  Staff: ['super_admin'],
  Settings: ['super_admin', 'store_admin'],
  'Audit logs': ['super_admin', 'store_admin'],
}
type ProductDraft = {
  name: string
  slug: string
  brand: string
  sku: string
  description: string
  shortDescription: string
  price: string
  comparePrice: string
  costPrice: string
  unit: string
  weightGrams: string
  image: string
  gallery: string[]
  stock: string
  lowStockThreshold: string
  sortOrder: string
  isActive: boolean
  isFeatured: boolean
  isOrganic: boolean
  badge: string
  categoryId: string
  variants: VariantDraft[]
}

const emptyDraft: ProductDraft = {
  name: '',
  slug: '',
  brand: '',
  sku: '',
  description: '',
  shortDescription: '',
  price: '',
  comparePrice: '',
  costPrice: '',
  unit: '1 kg',
  weightGrams: '',
  image: '',
  gallery: [],
  stock: '0',
  lowStockThreshold: '5',
  sortOrder: '0',
  isActive: true,
  isFeatured: false,
  isOrganic: false,
  badge: '',
  categoryId: '',
  variants: [],
}

export function AdminPage() {
  const { user, loading, isStaff, login, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const module = moduleFromPath(location.pathname)
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [productPage, setProductPage] = useState(1)
  const [productPageSize, setProductPageSize] = useState<AdminPageSize>(10)
  const [productFilters, setProductFilters] = useState({ category: 'all', status: 'all', stock: 'all' })
  const [orderPage, setOrderPage] = useState(1)
  const [orderPageSize, setOrderPageSize] = useState<AdminPageSize>(10)
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [customerPage, setCustomerPage] = useState(1)
  const [customerPageSize, setCustomerPageSize] = useState<AdminPageSize>(10)
  const [reviewPage, setReviewPage] = useState(1)
  const [reviewPageSize, setReviewPageSize] = useState<AdminPageSize>(10)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [orderStatusDraft, setOrderStatusDraft] = useState<OrderStatus>('pending')
  const [orderStatusNote, setOrderStatusNote] = useState('')
  const [savingOrderStatus, setSavingOrderStatus] = useState(false)
  const queryClient = useQueryClient()

  const updateSearch = (value: string) => {
    setSearch(value)
    setProductPage(1)
    setOrderPage(1)
    setCustomerPage(1)
    setReviewPage(1)
  }

  const navigateModule = (nextModule: Module) => {
    navigate(nextModule === 'Overview' ? '/admin' : `/admin/${moduleSlugs[nextModule]}`)
    setSidebarOpen(false)
  }

  const submitStaffLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginBusy(true)
    setLoginError('')
    try {
      const signedInUser = await login(loginEmail.trim(), loginPassword)
      if (!moduleRoles.Overview.includes(signedInUser.role) || signedInUser.role === 'customer') {
        await logout()
        throw new Error('This account does not have a staff role.')
      }
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Staff sign-in could not be completed.')
    } finally {
      setLoginBusy(false)
    }
  }

  const dashboardQuery = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.admin.dashboard(),
    enabled: !loading && isStaff && module === 'Overview',
  })
  const ordersQuery = useQuery({
    queryKey: ['admin-orders', search, module === 'Orders' ? orderStatusFilter : 'all', orderPageSize, orderPage],
    queryFn: () => api.admin.orders({
      q: search.trim() || undefined,
      status: module === 'Orders' && orderStatusFilter !== 'all' ? orderStatusFilter : undefined,
      per_page: orderPageSize,
      page: orderPage,
    }),
    enabled: !loading && isStaff && (module === 'Overview' || module === 'Orders'),
  })
  const orderDetailQuery = useQuery({
    queryKey: ['admin-order', selectedOrderId],
    queryFn: () => api.admin.order(selectedOrderId ?? 0),
    enabled: !loading && isStaff && selectedOrderId !== null,
  })
  const productsQuery = useQuery({
    queryKey: ['admin-products', productPage, productPageSize, search, productFilters],
    queryFn: () => api.admin.products({
      per_page: module === 'Products' ? productPageSize : 10,
      page: module === 'Products' ? productPage : 1,
      q: module === 'Products' ? search.trim() || undefined : undefined,
      category: module === 'Products' && productFilters.category !== 'all' ? productFilters.category : undefined,
      status: module === 'Products' && productFilters.status !== 'all' ? productFilters.status : undefined,
      stock: module === 'Products' && productFilters.stock !== 'all' ? productFilters.stock : undefined,
    }),
    enabled: !loading && isStaff && (module === 'Overview' || module === 'Products'),
  })
  const categoriesQuery = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.admin.categories(),
    enabled: !loading && isStaff && (module === 'Products' || module === 'Categories'),
  })
  const customersQuery = useQuery({
    queryKey: ['admin-customers', search, customerPage, customerPageSize],
    queryFn: () => api.admin.customers({
      q: search.trim() || undefined,
      per_page: customerPageSize,
      page: customerPage,
    }),
    enabled: !loading && isStaff && module === 'Customers',
  })
  const reviewsQuery = useQuery({
    queryKey: ['admin-reviews', search, reviewPageSize, reviewPage],
    queryFn: () => api.admin.reviews({
      q: search.trim() || undefined,
      per_page: reviewPageSize,
      page: reviewPage,
    }),
    enabled: !loading && isStaff && module === 'Reviews',
  })
  const visibleNavigation = navigation.filter(([label]) => label === 'Overview' || moduleRoles[label].includes(user?.role ?? 'customer'))

  const orders = ordersQuery.data?.data ?? []
  const products = productsQuery.data?.data ?? []
  const categories = categoriesQuery.data?.data ?? []
  const customers = customersQuery.data?.data ?? []
  const reviews = reviewsQuery.data?.data ?? []

  if (loading) return <main className="admin-loading">Loading your secure workspace…</main>
  if (!user || !isStaff) {
    return (
      user ? (
        <main className="admin-gate">
          <ShieldAlert size={36} />
          <h1>Access restricted</h1>
          <p>This account does not have a staff role. Sign out and use an authorized Grovia team account.</p>
          <div className="admin-gate__actions"><button type="button" onClick={() => void logout()}>Sign out</button><Link to="/">Back to storefront</Link></div>
        </main>
      ) : (
        <main className="admin-login">
          <section className="admin-login__story">
            <Link to="/" className="admin-login__brand"><img src="/assets/brand/grovia-mark.svg" alt="" /><span><strong>Grovia</strong><small>STORE OPERATIONS</small></span></Link>
            <div className="admin-login__story-copy"><span>THE GROVIA MARKET</span><h1>Your store,<br /><em>in good hands.</em></h1><p>A calm, clear workspace for managing products, orders and every detail behind the market.</p></div>
            <small className="admin-login__foot">FRESHNESS AT YOUR FINGERTIPS.</small>
          </section>
          <section className="admin-login__panel">
            <div className="admin-login__form-wrap">
              <span className="admin-login__eyebrow">SECURE TEAM ACCESS</span>
              <h2>Welcome to your market desk.</h2>
              <p>Sign in with an authorized Grovia staff account to continue.</p>
              <form onSubmit={(event) => void submitStaffLogin(event)}>
                <label>Work email<input required type="email" autoComplete="username" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder="name@groviamart.com" /></label>
                <label>Password<input required type="password" autoComplete="current-password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} placeholder="Your secure password" /></label>
                {loginError && <div className="admin-error" role="alert">{loginError}</div>}
                <button type="submit" disabled={loginBusy}>{loginBusy ? 'Signing in…' : 'Sign in to operations'} <ArrowRight size={16} /></button>
              </form>
              <Link to="/" className="admin-login__back">Return to Grovia storefront</Link>
            </div>
          </section>
        </main>
      )
    )
  }

  const queryErrors = [
    dashboardQuery.error,
    ordersQuery.error,
    productsQuery.error,
    categoriesQuery.error,
    module === 'Customers' ? customersQuery.error : null,
    module === 'Reviews' ? reviewsQuery.error : null,
  ].filter(Boolean)

  const updateOrderStatus = async (order: Order, status: string, note?: string) => {
    setActionError('')
    try {
      await api.admin.updateOrderStatus(order.id, status, note)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }),
      ])
      await queryClient.invalidateQueries({ queryKey: ['admin-order', order.id] })
      return true
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Order status could not be updated.')
      return false
    }
  }

  const downloadInvoice = (order: Order) => {
    try {
      downloadOrderInvoicePdf(order)
      notify(`Invoice PDF downloaded for ${order.orderNumber}.`)
    } catch (error) {
      notify(error instanceof Error ? `Invoice could not be created: ${error.message}` : 'Invoice could not be created.')
    }
  }

  const openOrderDetails = (order: Order) => {
    setSelectedOrderId(order.id)
    setOrderStatusDraft(order.status)
    setOrderStatusNote('')
    setActionError('')
  }

  const selectedOrder = orderDetailQuery.data?.order
  const selectedOrderProgress = selectedOrder ? orderProgressIndex(selectedOrder) : -1
  const saveOrderStatus = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedOrder || (orderStatusDraft === selectedOrder.status && !orderStatusNote.trim())) return
    setSavingOrderStatus(true)
    const saved = await updateOrderStatus(selectedOrder, orderStatusDraft, orderStatusNote.trim() || undefined)
    if (saved) {
      setOrderStatusNote('')
      notify('Tracking update saved.')
    }
    setSavingOrderStatus(false)
  }

  const openProductEditor = (product?: Product) => {
    setEditingProduct(product ?? null)
    setSelectedImages([])
    setDraft(product ? {
      name: product.name,
      slug: product.slug,
      brand: product.brand ?? '',
      sku: product.sku ?? '',
      description: product.description,
      shortDescription: product.shortDescription ?? '',
      price: String(product.price),
      comparePrice: product.comparePrice === null ? '' : String(product.comparePrice),
      costPrice: product.costPrice == null ? '' : String(product.costPrice),
      unit: product.unit,
      weightGrams: product.weightGrams == null ? '' : String(product.weightGrams),
      image: product.image,
      gallery: [...product.gallery],
      stock: String(product.stockQuantity),
      lowStockThreshold: String(product.lowStockThreshold ?? 5),
      sortOrder: String(product.sortOrder ?? 0),
      isActive: product.isActive ?? true,
      isFeatured: product.isFeatured,
      isOrganic: product.isOrganic,
      badge: product.badge ?? '',
      categoryId: String(product.category.id),
      variants: (product.variants ?? []).map((variant: Variant) => ({
        label: variant.label,
        price: String(variant.price),
        comparePrice: variant.comparePrice === null ? '' : String(variant.comparePrice),
        stock: String(variant.stockQuantity),
        sku: variant.sku ?? '',
      })),
    } : emptyDraft)
    setActionError('')
    setEditorOpen(true)
  }

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const price = Number(draft.price)
    const stock = Number(draft.stock)
    const comparePrice = draft.comparePrice === '' ? null : Number(draft.comparePrice)
    const costPrice = draft.costPrice === '' ? null : Number(draft.costPrice)
    const weightGrams = draft.weightGrams === '' ? null : Number(draft.weightGrams)
    const lowStockThreshold = Number(draft.lowStockThreshold)
    const sortOrder = Number(draft.sortOrder)
    if (!draft.name.trim() || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) {
      setActionError('Enter a product name, a price above zero and a whole-number stock quantity.')
      return
    }
    if (!draft.categoryId) {
      setActionError('Choose a department for this product before saving.')
      return
    }
    if (comparePrice !== null && (!Number.isFinite(comparePrice) || comparePrice < price)) {
      setActionError('Compare-at price must be greater than or equal to the selling price.')
      return
    }
    if (costPrice !== null && (!Number.isFinite(costPrice) || costPrice < 0)) {
      setActionError('Enter a valid product cost or leave the cost field blank.')
      return
    }
    if (weightGrams !== null && (!Number.isInteger(weightGrams) || weightGrams < 0)) {
      setActionError('Weight must be a whole number of grams or left blank.')
      return
    }
    if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0 || !Number.isInteger(sortOrder)) {
      setActionError('Enter a non-negative low-stock threshold and a whole-number display order.')
      return
    }
    if (draft.variants.some((variant) => {
      const variantPrice = Number(variant.price)
      const variantComparePrice = variant.comparePrice === '' ? null : Number(variant.comparePrice)
      const variantStock = Number(variant.stock)
      return !variant.label.trim()
        || !Number.isFinite(variantPrice)
        || variantPrice < 0
        || (variantComparePrice !== null && (!Number.isFinite(variantComparePrice) || variantComparePrice < variantPrice))
        || !Number.isInteger(variantStock)
        || variantStock < 0
    })) {
      setActionError('Each pack option needs a label, valid price, and whole-number stock. Compare-at price must not be below its price.')
      return
    }
    if (selectedImages.length > 5) {
      setActionError('Upload no more than five product images at a time.')
      return
    }

    setSaving(true)
    setActionError('')
    try {
      const uploadedImages: string[] = []
      for (const file of selectedImages) {
        const uploaded = await api.admin.uploadProductImage(file)
        uploadedImages.push(uploaded.url)
      }

      const image = uploadedImages[0] ?? (draft.image.trim() || draft.gallery[0] || '/grovia-fresh.svg')
      const gallery = [...new Set([...uploadedImages, ...draft.gallery, ...(draft.image.trim() ? [draft.image.trim()] : [])])]
      const input: ProductInput = {
        name: draft.name.trim(),
        slug: draft.slug.trim() || undefined,
        category_id: Number(draft.categoryId),
        brand: draft.brand.trim() || null,
        sku: draft.sku.trim() || null,
        description: draft.description.trim(),
        short_description: draft.shortDescription.trim() || null,
        price,
        compare_price: comparePrice,
        cost_price: costPrice,
        unit: draft.unit.trim(),
        weight_grams: weightGrams,
        stock_quantity: stock,
        low_stock_threshold: lowStockThreshold,
        sort_order: sortOrder,
        is_active: draft.isActive,
        is_featured: draft.isFeatured,
        is_organic: draft.isOrganic,
        badge: draft.badge.trim() || null,
        image,
        gallery,
        variants: draft.variants.map((variant) => ({
          label: variant.label.trim(),
          price: Number(variant.price),
          compare_price: variant.comparePrice === '' ? null : Number(variant.comparePrice),
          stock_quantity: Number(variant.stock),
          sku: variant.sku.trim() || null,
        })),
      }

      if (editingProduct) await api.admin.updateProduct(editingProduct.id, input)
      else await api.admin.createProduct(input)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
      ])
      setEditorOpen(false)
      notify(editingProduct ? 'Product updated.' : 'Product added.')
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The product could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const updateProduct = async (product: Product, patch: { stock_quantity?: number; is_active?: boolean }) => {
    setActionError('')
    try {
      await api.admin.updateProduct(product.id, patch)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
      ])
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The product could not be updated.')
    }
  }

  const moderateReview = async (review: Review, isApproved: boolean) => {
    setActionError('')
    try {
      await api.admin.approveReview(review.id, isApproved)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
      ])
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The review could not be updated.')
    }
  }

  const visibleOrders = orders
  const visibleProducts = products
  const toggleCustomerStatus = async (customer: AdminCustomer) => {
    setActionError('')
    try {
      await api.admin.toggleCustomer(customer.id, !customer.isActive)
      await queryClient.invalidateQueries({ queryKey: ['admin-customers'] })
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Customer access could not be updated.')
    }
  }
  const dashboard = dashboardQuery.data

  return (
    <main className="admin">
      <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar__brand">
          <Link to="/" className="brand"><img src="/assets/brand/grovia-mark.svg" alt="" /><span><strong>Grovia</strong><small>OPERATIONS</small></span></Link>
          <button className="admin-sidebar__close" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close admin menu"><X size={16} /></button>
        </div>
        <nav className="admin-nav" aria-label="Admin sections">
          <span className="admin-nav__label">Store operations</span>
          {visibleNavigation.map(([label, Icon]) => (
            <button className={module === label ? 'is-active' : ''} type="button" key={label} onClick={() => navigateModule(label)} aria-current={module === label ? 'page' : undefined}><Icon size={17} />{label}</button>
          ))}
        </nav>
        <div className="admin-sidebar__foot">
          <div className="admin-sidebar__user"><span className="admin-sidebar__avatar">{user.name.slice(0, 1).toUpperCase()}</span><div><strong>{user.name}</strong><span>{user.role.replaceAll('_', ' ')}</span></div></div>
          <button type="button" onClick={() => void logout()}><LogOut size={15} /> Sign out</button>
        </div>
      </aside>
      {sidebarOpen && <button className="admin-sidebar-backdrop" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close admin menu" />}
      <section className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__title"><button className="admin-menu-btn admin-icon-btn" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open admin menu" aria-expanded={sidebarOpen}><Menu size={17} /></button><div><h1>{module}</h1><p>Grovia store operations</p></div></div>
          {module !== 'Loyalty' && module !== 'Site editor' && <label className="admin-search"><Search size={16} /><input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder={module === 'Overview' ? 'Search orders...' : `Search ${module.toLowerCase()}...`} /></label>}
        </header>
        <div className="admin-content">
        <div className="admin-page-head"><div><span className="admin-page-head__eyebrow">GROVIA OPERATIONS</span><h2>{module}</h2><p>Manage your market with a clear view of today’s operations.</p></div>
          {module === 'Overview' && <div className="admin-page-head__actions"><button type="button" onClick={() => navigateModule('Products')}><Package size={15} /> Manage catalog</button><Link to="/"><ArrowRight size={15} /> View storefront</Link></div>}
        </div>
        {queryErrors.map((error, index) => <div className="admin-error" role="alert" key={index}>{error instanceof Error ? error.message : 'A dashboard section could not be loaded.'}</div>)}
        {actionError && <div className="admin-error" role="alert">{actionError}</div>}

        {module === 'Overview' && <>
          <div className="admin-welcome"><div><span>YOUR STORE AT A GLANCE</span><h2>Good day, team Grovia.</h2><p>Here’s what’s happening with your store.</p></div><div className="admin-welcome-icon"><BarChart3 size={28} /></div></div>
          <div className="admin-stats">
            <article><span><ClipboardList size={18} /></span><small>Total orders</small><strong>{dashboard?.totals.orders ?? '—'}</strong></article>
            <article><span><Package size={18} /></span><small>Catalog products</small><strong>{productsQuery.data?.meta.total ?? '—'}</strong></article>
            <article><span><Users size={18} /></span><small>Customers</small><strong>{dashboard?.totals.customers ?? '—'}</strong></article>
            <article><span><CircleDollarSign size={18} /></span><small>Revenue</small><strong>Rs. {(dashboard?.totals.revenue ?? 0).toLocaleString('en-PK')}</strong></article>
            <article><span><CircleDollarSign size={18} /></span><small>Gross profit</small><strong>{dashboard?.totals.grossProfit === null || dashboard?.totals.grossProfit === undefined ? '—' : `Rs. ${dashboard.totals.grossProfit.toLocaleString('en-PK')}`}</strong><small>{dashboard?.totals.missingCostItemCount ? `Cost missing on ${dashboard.totals.missingCostItemCount} sold item(s)` : 'Before operating expenses'}</small></article>
            <article><span><AlertTriangle size={18} /></span><small>Refunds</small><strong>{dashboard?.totals.refunds ?? '—'}</strong><small>Rs. {(dashboard?.totals.refundAmount ?? 0).toLocaleString('en-PK')}</small></article>
          </div>
          <section className="admin-stock-alerts">
            <div><h2>Stock alerts</h2><p>Out-of-stock and below-threshold products</p></div>
            <button type="button" onClick={() => navigateModule('Products')}>Manage products <ArrowRightIcon /></button>
            {dashboard?.totals.stockAlerts.length
              ? <ul>{dashboard.totals.stockAlerts.map((item) => <li key={item.id}><span><strong>{item.name}</strong><small>{item.sku ?? 'No SKU'}</small></span><b className={item.stockQuantity === 0 ? 'is-out' : 'is-low'}>{item.stockQuantity === 0 ? 'Out of stock' : `${item.stockQuantity} left · alert at ${item.lowStockThreshold}`}</b></li>)}</ul>
              : <p className="admin-stock-clear">All active products are above their stock-alert levels.</p>}
          </section>
          <section className="admin-table-card"><div className="admin-table-title"><div><h2>Recent orders</h2><p>Latest activity from your customers</p></div><button type="button" onClick={() => navigateModule('Orders')}>All orders <ArrowRightIcon /></button></div><OrdersTable orders={orders} onStatusChange={updateOrderStatus} onOpenDetails={openOrderDetails} /><AdminTablePagination totalItems={ordersQuery.data?.meta.total ?? 0} currentPage={orderPage} pageSize={orderPageSize} onPageChange={setOrderPage} onPageSizeChange={(size) => { setOrderPageSize(size); setOrderPage(1) }} /></section>
          <section className="admin-table-card"><div className="admin-table-title"><div><h2>Revenue trend</h2><p>Daily sales over the selected period</p></div></div>
            <div className="admin-sales-chart">{dashboard?.dailySales.map((item) => {
              const max = Math.max(1, ...dashboard.dailySales.map((point) => point.total))
              return <div key={item.date} title={`${item.date}: Rs. ${item.total.toLocaleString('en-PK')}`}><span style={{ height: `${Math.max(4, item.total / max * 100)}%` }} /><small>{new Date(item.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</small></div>
            })}</div>
          </section>
        </>}

        {module === 'Orders' && <section className="admin-table-card">
          <div className="admin-table-title"><div><h2>Orders</h2><p>{ordersQuery.data?.meta.total ?? 0} matching orders · review, track and update deliveries</p></div></div>
          <div className="admin-order-filters"><label htmlFor="admin-order-status-filter">Order status
            <select id="admin-order-status-filter" value={orderStatusFilter} onChange={(event) => {
              const value = event.target.value
              setOrderStatusFilter(value === 'all' ? 'all' : orderStatuses.find((status) => status === value) ?? 'all')
              setOrderPage(1)
            }}>
              <option value="all">All statuses</option>
              {orderStatuses.map((status) => <option value={status} key={status}>{formatOrderStatus(status)}</option>)}
            </select>
          </label></div>
          <OrdersTable orders={visibleOrders} onStatusChange={updateOrderStatus} onOpenDetails={openOrderDetails} />
          <AdminTablePagination totalItems={ordersQuery.data?.meta.total ?? 0} currentPage={orderPage} pageSize={orderPageSize} onPageChange={setOrderPage} onPageSizeChange={(size) => { setOrderPageSize(size); setOrderPage(1) }} />
        </section>}

        {module === 'Products' && <section className="admin-table-card">
          <div className="admin-table-title"><div><h2>Products</h2><p>Inventory and catalog management · {productsQuery.data?.meta.total ?? 0} products</p></div><button className="admin-add-button" type="button" onClick={() => openProductEditor()}><Plus size={15} /> Add product</button></div>
          <label className="admin-products-search"><Search size={15} /><input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Search name, brand, category or SKU..." /></label>
          <div className="admin-product-filters">
            <label>Category<select value={productFilters.category} onChange={(event) => { setProductFilters((current) => ({ ...current, category: event.target.value })); setProductPage(1) }}><option value="all">All categories</option>{categories.map((category) => <option value={category.slug} key={category.id}>{category.name}</option>)}</select></label>
            <label>Visibility<select value={productFilters.status} onChange={(event) => { setProductFilters((current) => ({ ...current, status: event.target.value })); setProductPage(1) }}><option value="all">All products</option><option value="active">Active</option><option value="inactive">Hidden</option></select></label>
            <label>Stock<select value={productFilters.stock} onChange={(event) => { setProductFilters((current) => ({ ...current, stock: event.target.value })); setProductPage(1) }}><option value="all">All stock</option><option value="in_stock">In stock</option><option value="low_stock">Low stock</option><option value="out_of_stock">Out of stock</option></select></label>
          </div>
          <div className="admin-table-scroll"><table><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>{visibleProducts.map((product) => (
            <tr key={product.id}>
              <td><strong>{product.name}</strong><small className="admin-table-subtext">{product.category.name}</small></td>
              <td>Rs. {product.price.toLocaleString('en-PK')}</td>
              <td><input className="stock-input" type="number" min="0" defaultValue={product.stockQuantity} onBlur={(event) => {
                const stock = Number(event.target.value)
                if (Number.isInteger(stock) && stock >= 0 && stock !== product.stockQuantity) void updateProduct(product, { stock_quantity: stock })
                else if (!Number.isInteger(stock) || stock < 0) event.currentTarget.value = String(product.stockQuantity)
              }} aria-label={`Stock for ${product.name}`} /><small className={`admin-stock-status ${product.stockQuantity === 0 ? 'is-out' : product.stockQuantity <= (product.lowStockThreshold ?? 5) ? 'is-low' : 'is-available'}`}>{product.stockQuantity === 0 ? 'Out of stock' : product.stockQuantity <= (product.lowStockThreshold ?? 5) ? 'Low stock' : 'In stock'}</small></td>
              <td><button className={`status-pill ${(product.isActive ?? product.inStock) ? 'delivered' : 'cancelled'} admin-status-button`} type="button" onClick={() => void updateProduct(product, { is_active: !(product.isActive ?? product.inStock) })}>{(product.isActive ?? product.inStock) ? 'Active' : 'Hidden'}</button></td>
              <td><button className="admin-edit-button" type="button" onClick={() => openProductEditor(product)}><Pencil size={14} /> Edit</button></td>
            </tr>
          ))}</tbody></table></div>
          <AdminTablePagination totalItems={productsQuery.data?.meta.total ?? 0} currentPage={productPage} pageSize={productPageSize} onPageChange={setProductPage} onPageSizeChange={(size) => { setProductPageSize(size); setProductPage(1) }} />
        </section>}

        {module === 'Customers' && <section className="admin-table-card"><div className="admin-table-title"><div><h2>Customers</h2><p>Customer accounts and order activity</p></div></div>
          {customersQuery.isLoading ? <p className="admin-empty">Loading customer records…</p> : customers.length === 0 ? <p className="admin-empty">{search ? 'No matching customers found.' : 'No customers found.'}</p> : (
            <div className="admin-table-scroll"><table><thead><tr><th>Customer</th><th>Orders</th><th>Total spent</th><th>Last order</th><th>Access</th></tr></thead><tbody>{customers.map((customer: AdminCustomer) => (
                <tr key={customer.id}><td><strong>{customer.name}</strong><small className="admin-table-subtext">{customer.email} · {customer.phone ?? 'No phone'}</small></td><td>{customer.ordersCount}</td><td>Rs. {customer.totalSpent.toLocaleString('en-PK')}</td><td>{customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString('en-PK') : '—'}</td><td><button className={`status-pill ${customer.isActive ? 'delivered' : 'cancelled'} admin-status-button`} type="button" onClick={() => void toggleCustomerStatus(customer)}>{customer.isActive ? 'Active' : 'Suspended'}</button></td></tr>
            ))}</tbody></table></div>
          )}
          <AdminTablePagination totalItems={customersQuery.data?.meta.total ?? 0} currentPage={customerPage} pageSize={customerPageSize} onPageChange={setCustomerPage} onPageSizeChange={(size) => { setCustomerPageSize(size); setCustomerPage(1) }} />
        </section>}

        {module === 'Reviews' && <section className="admin-table-card">
          <div className="admin-table-title"><div><h2>Review moderation</h2><p>{reviews.filter((review) => !review.isApproved).length} waiting for approval</p></div></div>
          {reviewsQuery.isLoading ? <p className="admin-empty">Loading reviews…</p> : reviews.length === 0 ? <p className="admin-empty">No customer reviews have been submitted.</p> : (
            <div className="admin-review-list">{reviews.map((review) => (
              <article key={review.id}>
                <div className="admin-review-stars">{Array.from({ length: 5 }, (_, index) => <Star size={13} fill={index < review.rating ? 'currentColor' : 'none'} key={index} />)}</div>
                <div className="admin-review-copy"><strong>{review.title || `Product review #${review.id}`}</strong><p>{review.comment}</p><small>{new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium' }).format(new Date(review.createdAt))}</small></div>
                <span className={`status-pill ${review.isApproved ? 'delivered' : 'cancelled'}`}>{review.isApproved ? 'Approved' : 'Pending'}</span>
                <button type="button" onClick={() => void moderateReview(review, !review.isApproved)}>{review.isApproved ? 'Hide' : 'Approve'}</button>
              </article>
            ))}</div>
          )}
          <AdminTablePagination
            totalItems={reviewsQuery.data?.meta.total ?? 0}
            currentPage={reviewPage}
            pageSize={reviewPageSize}
            onPageChange={setReviewPage}
            onPageSizeChange={(size) => { setReviewPageSize(size); setReviewPage(1) }}
          />
        </section>}
        {module === 'Loyalty' && <LoyaltyAdmin />}
        {module === 'Site editor' && <SiteEditor />}
        {isAdminOperationsModule(module) && <AdminOperations module={module} search={search} />}
        </div>
      </section>

      {editorOpen && <div className="admin-drawer-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorOpen(false) }}>
        <form className="admin-drawer admin-drawer--wide" onSubmit={(event) => void saveProduct(event)} role="dialog" aria-modal="true" aria-label={editingProduct ? 'Edit product' : 'Add product'}>
          <div className="admin-editor-head"><div><small>{editingProduct ? 'UPDATE CATALOG' : 'NEW CATALOG ITEM'}</small><h2>{editingProduct ? 'Edit product' : 'Add product'}</h2></div><button type="button" onClick={() => setEditorOpen(false)} aria-label="Close editor"><X size={19} /></button></div>
          <div className="admin-drawer__body admin-editor-grid">
            <label className="full">Product name<input required value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Fresh grocery item" /></label>
            <label>Slug<input value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} placeholder="generated-from-name" /></label>
            <label>Category<select required value={draft.categoryId} onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}><option value="">Choose category</option>{categories.map((category: Category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
            <label>Brand<input value={draft.brand} onChange={(event) => setDraft((current) => ({ ...current, brand: event.target.value }))} placeholder="Brand name" /></label>
            <label>SKU / barcode<input value={draft.sku} onChange={(event) => setDraft((current) => ({ ...current, sku: event.target.value }))} placeholder="Optional unique SKU" /></label>
            <label>Selling price (Rs.)<input required type="number" min="0.01" step="0.01" value={draft.price} onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))} /></label>
            <label>Compare-at price<input type="number" min="0" step="0.01" value={draft.comparePrice} onChange={(event) => setDraft((current) => ({ ...current, comparePrice: event.target.value }))} /></label>
            <label>Cost price (Rs.)<input type="number" min="0" step="0.01" value={draft.costPrice} onChange={(event) => setDraft((current) => ({ ...current, costPrice: event.target.value }))} /></label>
            <label>Unit<input required value={draft.unit} onChange={(event) => setDraft((current) => ({ ...current, unit: event.target.value }))} placeholder="1 kg" /></label>
            <label>Weight (grams)<input type="number" min="0" step="1" value={draft.weightGrams} onChange={(event) => setDraft((current) => ({ ...current, weightGrams: event.target.value }))} placeholder="Optional" /></label>
            <label>Stock quantity<input required type="number" min="0" step="1" value={draft.stock} onChange={(event) => setDraft((current) => ({ ...current, stock: event.target.value }))} /></label>
            <label>Low-stock alert<input required type="number" min="0" step="1" value={draft.lowStockThreshold} onChange={(event) => setDraft((current) => ({ ...current, lowStockThreshold: event.target.value }))} /></label>
            <label>Display order<input required type="number" step="1" value={draft.sortOrder} onChange={(event) => setDraft((current) => ({ ...current, sortOrder: event.target.value }))} /></label>
            <label>Product badge<input value={draft.badge} onChange={(event) => setDraft((current) => ({ ...current, badge: event.target.value }))} placeholder="Optional label" /></label>
            <label className="full">Image URL<input type="url" value={draft.image} onChange={(event) => setDraft((current) => ({ ...current, image: event.target.value }))} placeholder="https://..." /></label>
            <label className="full">Upload product images<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => {
              const files = Array.from(event.target.files ?? [])
              setSelectedImages(files)
              setActionError(files.length > 5 ? 'Select no more than five images.' : '')
            }} /></label>
            <p className="admin-editor-hint full">JPEG, PNG or WebP · up to five images · 5 MB each. Uploaded images are stored by Laravel.</p>
            {selectedImages.length > 0 && <p className="admin-editor-hint full">Selected: {selectedImages.map((file) => file.name).join(', ')}</p>}
            {draft.gallery.length > 0 && <div className="admin-image-gallery full" aria-label="Current product images">
              {draft.gallery.map((url) => <div className="admin-image-gallery__item" key={url}>
                <img src={url} alt="" onError={(event) => { event.currentTarget.hidden = true }} />
                <button type="button" onClick={() => setDraft((current) => {
                  const gallery = current.gallery.filter((imageUrl) => imageUrl !== url)
                  return { ...current, gallery, image: current.image === url ? gallery[0] ?? '' : current.image }
                })} aria-label="Remove product image"><X size={12} /></button>
              </div>)}
            </div>}
            <label className="full">Description<textarea rows={3} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Short customer-facing description" /></label>
            <label className="full">Short description<textarea rows={2} value={draft.shortDescription} onChange={(event) => setDraft((current) => ({ ...current, shortDescription: event.target.value }))} placeholder="Optional short listing copy" /></label>
            <section className="admin-variants full" aria-label="Pack size options">
              <div className="admin-variants__head"><div><strong>Pack sizes / variants</strong><small>Optional options with independent prices and stock.</small></div><button type="button" onClick={() => setDraft((current) => ({ ...current, variants: [...current.variants, { ...emptyVariantDraft }] }))}><Plus size={13} /> Add option</button></div>
              {draft.variants.map((variant, index) => <div className="admin-variant-row" key={`variant-${index}`}>
                <label>Option label<input required value={variant.label} onChange={(event) => setDraft((current) => ({ ...current, variants: current.variants.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item) }))} placeholder="500 g pack" /></label>
                <label>Price (Rs.)<input required type="number" min="0" step="0.01" value={variant.price} onChange={(event) => setDraft((current) => ({ ...current, variants: current.variants.map((item, itemIndex) => itemIndex === index ? { ...item, price: event.target.value } : item) }))} /></label>
                <label>Compare price<input type="number" min="0" step="0.01" value={variant.comparePrice} onChange={(event) => setDraft((current) => ({ ...current, variants: current.variants.map((item, itemIndex) => itemIndex === index ? { ...item, comparePrice: event.target.value } : item) }))} /></label>
                <label>Option stock<input required type="number" min="0" step="1" value={variant.stock} onChange={(event) => setDraft((current) => ({ ...current, variants: current.variants.map((item, itemIndex) => itemIndex === index ? { ...item, stock: event.target.value } : item) }))} /></label>
                <label>Option SKU<input value={variant.sku} onChange={(event) => setDraft((current) => ({ ...current, variants: current.variants.map((item, itemIndex) => itemIndex === index ? { ...item, sku: event.target.value } : item) }))} placeholder="Optional" /></label>
                <button type="button" className="admin-variant-remove" onClick={() => setDraft((current) => ({ ...current, variants: current.variants.filter((_, itemIndex) => itemIndex !== index) }))} aria-label={`Remove option ${index + 1}`}><X size={14} /></button>
              </div>)}
            </section>
            <label className="admin-checkbox"><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))} /> Visible in storefront</label>
            <label className="admin-checkbox"><input type="checkbox" checked={draft.isFeatured} onChange={(event) => setDraft((current) => ({ ...current, isFeatured: event.target.checked }))} /> Featured product</label>
            <label className="admin-checkbox"><input type="checkbox" checked={draft.isOrganic} onChange={(event) => setDraft((current) => ({ ...current, isOrganic: event.target.checked }))} /> Organic product</label>
          </div>
          <div className="admin-drawer__foot"><button type="button" onClick={() => setEditorOpen(false)}>Cancel</button><button type="submit" disabled={saving}>{saving ? 'Uploading and saving…' : editingProduct ? 'Save changes' : 'Add product'}</button></div>
        </form>
      </div>}
      {selectedOrderId !== null && <div className="admin-drawer-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedOrderId(null) }}>
        <form className="admin-drawer admin-drawer--wide" onSubmit={(event) => void saveOrderStatus(event)} role="dialog" aria-modal="true" aria-label="Order tracking details">
          <div className="admin-drawer__head">
            <div><small>ORDER TRACKING</small><h2>{selectedOrder?.orderNumber ?? 'Order details'}</h2><p>Customer, delivery schedule and status history.</p></div>
            <button type="button" className="admin-drawer__close" onClick={() => setSelectedOrderId(null)} aria-label="Close order details"><X size={17} /></button>
          </div>
          {orderDetailQuery.isLoading ? <div className="admin-drawer__body"><p className="admin-empty">Loading order details…</p></div>
            : orderDetailQuery.error ? <div className="admin-drawer__body"><div className="admin-error" role="alert">{orderDetailQuery.error.message}</div></div>
              : selectedOrder && <>
                <div className="admin-drawer__body admin-order-detail">
                  <section className="admin-order-detail__summary">
                    <div><span className={`status-pill ${selectedOrder.status}`}>{formatOrderStatus(selectedOrder.status)}</span><small>Placed {new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(selectedOrder.placedAt))}</small></div>
                    <strong>Rs. {selectedOrder.total.toLocaleString('en-PK')}</strong>
                  </section>
                  <button className="admin-invoice-button" type="button" onClick={() => downloadInvoice(selectedOrder)}><Download size={15} /> Download invoice PDF</button>
                  <section className="admin-order-detail__section">
                    <h3>Customer</h3>
                    <strong>{selectedOrder.recipientName}</strong>
                    <a href={`tel:${selectedOrder.phone}`}>{selectedOrder.phone}</a>
                    {selectedOrder.customer && <small>{selectedOrder.customer.name} · {selectedOrder.customer.email}</small>}
                  </section>
                  <section className="admin-order-detail__section">
                    <h3>Delivery</h3>
                    <p>{selectedOrder.addressLine}<br />{selectedOrder.area}, {selectedOrder.city}{selectedOrder.postalCode ? ` · ${selectedOrder.postalCode}` : ''}</p>
                    <p><Clock3 size={14} /> {new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium' }).format(new Date(`${selectedOrder.deliveryDate}T12:00:00`))} · {selectedOrder.deliverySlot}</p>
                    {selectedOrder.deliveryLocation && <>
                      <a className="admin-order-map-link" href={`https://www.google.com/maps/search/?api=1&query=${selectedOrder.deliveryLocation.latitude},${selectedOrder.deliveryLocation.longitude}`} target="_blank" rel="noopener noreferrer">
                        <MapPin size={14} /> Open customer delivery pin <ExternalLink size={12} />
                      </a>
                      <small>Destination pin only; live courier GPS is not connected.</small>
                    </>}
                    {selectedOrder.notes && <blockquote>{selectedOrder.notes}</blockquote>}
                  </section>
                  <section className="admin-order-detail__section">
                    <h3>Items · {selectedOrder.items.reduce((count, item) => count + item.quantity, 0)}</h3>
                    <ul>{selectedOrder.items.map((item) => <li key={item.id}><span>{item.productName} <small>{item.unit} × {item.quantity}</small></span><strong>Rs. {item.lineTotal.toLocaleString('en-PK')}</strong></li>)}</ul>
                    <div className="admin-order-detail__totals"><span>Subtotal</span><strong>Rs. {selectedOrder.subtotal.toLocaleString('en-PK')}</strong><span>Delivery</span><strong>{selectedOrder.deliveryFee ? `Rs. ${selectedOrder.deliveryFee.toLocaleString('en-PK')}` : 'Free'}</strong></div>
                  </section>
                  <section className="admin-order-detail__section">
                    <h3>Order progress</h3>
                    {(selectedOrder.status === 'cancelled' || selectedOrder.status === 'refunded') && (
                      <p className={`admin-order-progress__terminal ${selectedOrder.status}`} role="status">
                        {selectedOrder.status === 'cancelled' ? 'This order was cancelled.' : 'This order was refunded.'}
                      </p>
                    )}
                    <ol className="admin-order-progress__steps" aria-label="Order progress stages">
                      {ORDER_TRACKING_STEPS.map((status, index) => {
                        const complete = selectedOrderProgress >= index
                        const current = selectedOrder.status === status
                        return <li className={`${complete ? 'is-complete' : ''}${current ? ' is-current' : ''}`} key={status} aria-current={current ? 'step' : undefined}>
                          <span aria-hidden="true">{index + 1}</span>
                          <div><strong>{formatOrderStatus(status)}</strong><small>{current ? 'Current step' : complete ? 'Completed' : 'Upcoming'}</small></div>
                        </li>
                      })}
                    </ol>
                  </section>
                  <section className="admin-order-detail__section">
                    <h3>Status history</h3>
                    {selectedOrder.statusHistory.length === 0 ? <p>No status updates have been recorded.</p> : <ol className="admin-order-timeline">{selectedOrder.statusHistory.map((entry, index) => {
                      const previousEntry = selectedOrder.statusHistory[index - 1]
                      const isNoteUpdate = Boolean(entry.note && previousEntry?.status === entry.status)
                      return <li key={entry.id}>
                        <strong>{isNoteUpdate ? 'Tracking note' : formatOrderStatus(entry.status)}</strong>
                        {isNoteUpdate && <small>{formatOrderStatus(entry.status)}</small>}
                        <time>{new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.createdAt))}</time>
                        {entry.note && <p>{entry.note}</p>}
                      </li>
                    })}</ol>}
                  </section>
                  <section className="admin-order-detail__section admin-order-detail__update">
                    <h3>Add tracking update</h3>
                    <label>Order status<select value={orderStatusDraft} onChange={(event) => setOrderStatusDraft(event.target.value as OrderStatus)}>
                      <option value={selectedOrder.status}>{formatOrderStatus(selectedOrder.status)}</option>
                      {nextOrderStatuses[selectedOrder.status].map((status) => <option value={status} key={status}>{formatOrderStatus(status)}</option>)}
                    </select></label>
                    <p className="admin-order-update-hint">Choose the next status to advance the order, or keep the current status to save a note-only update. Only the next valid status is available.</p>
                    <label>Customer-visible update note<textarea rows={3} maxLength={1000} value={orderStatusNote} onChange={(event) => setOrderStatusNote(event.target.value)} placeholder="For example: Your order has been packed and is ready for dispatch." /></label>
                  </section>
                </div>
                {actionError && <div className="admin-error admin-order-detail__error" role="alert">{actionError}</div>}
                <div className="admin-drawer__foot">
                  <button type="button" onClick={() => setSelectedOrderId(null)}>Close</button>
                  <button type="submit" disabled={savingOrderStatus || (orderStatusDraft === selectedOrder.status && !orderStatusNote.trim())}>{savingOrderStatus ? 'Saving update…' : 'Save tracking update'}</button>
                </div>
              </>}
        </form>
      </div>}
    </main>
  )
}

function isAdminOperationsModule(module: Module): module is AdminOperationsModule {
  return !['Overview', 'Orders', 'Products', 'Customers', 'Reviews', 'Loyalty', 'Site editor'].includes(module)
}

function moduleFromPath(pathname: string): Module {
  const section = pathname.split('/').filter(Boolean)[1]
  if (!section || section === moduleSlugs.Overview) return 'Overview'
  return navigation.find(([label]) => moduleSlugs[label] === section)?.[0] ?? 'Overview'
}

function ArrowRightIcon() {
  return <span aria-hidden="true">→</span>
}

function orderProgressIndex(order: Order): number {
  if (order.status === 'refunded') return ORDER_TRACKING_STEPS.length - 1
  if (order.status !== 'cancelled') {
    return ORDER_TRACKING_STEPS.findIndex((status) => status === order.status)
  }

  return order.statusHistory.reduce((furthestStep, entry) => {
    return Math.max(furthestStep, ORDER_TRACKING_STEPS.findIndex((status) => status === entry.status))
  }, -1)
}

function OrdersTable({ orders, onStatusChange, onOpenDetails }: { orders: Order[]; onStatusChange: (order: Order, status: string) => void; onOpenDetails: (order: Order) => void }) {
  if (!orders.length) return <p className="admin-empty">No orders yet. New customer orders will appear here.</p>
  return (
    <div className="admin-table-scroll"><table><thead><tr><th>Order</th><th>Customer</th><th>Delivery</th><th>Payment</th><th>Total</th><th>Status</th><th>Update status</th><th>Details</th></tr></thead><tbody>
      {orders.map((order) => <tr key={order.id}>
        <td><strong>{order.orderNumber}</strong><small className="admin-table-subtext">{order.itemCount ?? 0} item(s) · {new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium' }).format(new Date(order.placedAt))}</small></td>
        <td><strong>{order.recipientName}</strong><small className="admin-table-subtext">{order.phone}</small></td>
        <td><strong>{order.deliveryDate ? new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium' }).format(new Date(`${order.deliveryDate}T12:00:00`)) : 'Not scheduled'}</strong><small className="admin-table-subtext">{order.deliverySlot || `${order.area}, ${order.city}`}</small></td>
        <td><strong>{order.paymentMethod.replaceAll('_', ' ')}</strong><small className="admin-table-subtext">{order.paymentStatus.replaceAll('_', ' ')}</small></td>
        <td>Rs. {order.total.toLocaleString('en-PK')}</td>
        <td><span className={`status-pill ${order.status}`}>{formatOrderStatus(order.status)}</span></td>
        <td><select value={order.status} onChange={(event) => onStatusChange(order, event.target.value)} aria-label={`Update status for ${order.orderNumber}`}>
          <option value={order.status}>{formatOrderStatus(order.status)}</option>
          {nextOrderStatuses[order.status].map((status) => <option value={status} key={status}>{formatOrderStatus(status)}</option>)}
        </select></td>
        <td><button className="admin-order-view" type="button" onClick={() => onOpenDetails(order)} aria-label={`View tracking details for ${order.orderNumber}`}><Eye size={14} /> Details</button></td>
      </tr>)}
    </tbody></table></div>
  )
}
