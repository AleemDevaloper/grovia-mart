import { ArrowRight, Clock3, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { WhatsAppSupportButton } from './components/WhatsAppSupport'
import { ShoppingAssistant } from './components/ShoppingAssistant'
import { ToastContainer } from './components/ToastContainer'
import { notify } from './lib/toast'
import { api } from './lib/api'
import { handleImageFallback } from './utils/imageFallback'
import { useStore } from './store'

function RouteLoadingBar() {
  const { pathname } = useLocation()
  const [settledPath, setSettledPath] = useState(pathname)

  useEffect(() => {
    const timeout = window.setTimeout(() => setSettledPath(pathname), 620)
    return () => window.clearTimeout(timeout)
  }, [pathname])

  const active = settledPath !== pathname

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="route-loading-bar"
          aria-label="Loading page"
          initial={{ opacity: 1, scaleX: 0.08 }}
          animate={{ scaleX: 0.92 }}
          exit={{ opacity: 0, scaleX: 1 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
    </AnimatePresence>
  )
}

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })))
const ShopPage = lazy(() => import('./pages/ShopPage').then((module) => ({ default: module.ShopPage })))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then((module) => ({ default: module.ProductDetailPage })))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((module) => ({ default: module.CheckoutPage })))
const AuthPage = lazy(() => import('./pages/AuthPage').then((module) => ({ default: module.AuthPage })))
const AdminPage = lazy(() => import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })))
const WishlistPage = lazy(() => import('./pages/WishlistPage').then((module) => ({ default: module.WishlistPage })))
const OrderDetailsPage = lazy(() => import('./pages/OrderDetailsPage').then((module) => ({ default: module.OrderDetailsPage })))
const InfoPage = lazy(() => import('./pages/InfoPage').then((module) => ({ default: module.InfoPage })))

function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQuantity, removeFromCart } = useStore()
  const navigate = useNavigate()
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const { data: zonesData } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: api.delivery.zones,
    staleTime: 5 * 60 * 1000,
  })
  const thresholds = (zonesData?.data ?? [])
    .map((zone) => zone.freeDeliveryThreshold)
    .filter((value) => Number.isFinite(value) && value > 0)
  const threshold = thresholds.length > 0 ? Math.min(...thresholds) : 0
  const remaining = Math.max(0, threshold - subtotal)
  const progress = threshold > 0 ? Math.min(100, Math.round((subtotal / threshold) * 100)) : 0

  return (
    <>
      {cartOpen && <button className="overlay" onClick={() => setCartOpen(false)} aria-label="Close cart" />}
      <motion.aside
        className={`cart-drawer ${cartOpen ? 'open' : ''}`}
        aria-hidden={!cartOpen}
        role="dialog"
        aria-modal={cartOpen || undefined}
        aria-labelledby="cart-title"
        initial={false}
        animate={{ x: cartOpen ? 0 : '100%' }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="cart-drawer__head">
          <div><small>Grovia market</small><h2 id="cart-title">Your basket</h2></div>
          <button className="cart-drawer__close" onClick={() => setCartOpen(false)} aria-label="Close cart"><X size={20} /></button>
        </div>
        {cart.length > 0 && threshold > 0 && (
          <div className="cart-drawer__ship">
            <p>
              {remaining > 0 ? (
                <>Add <strong>Rs. {remaining.toLocaleString('en-PK')}</strong> more for free delivery</>
              ) : (
                <><strong>Free delivery mark reached</strong> — applies to eligible areas</>
              )}
            </p>
            <span className="ship-bar">
              <i className="ship-bar__fill" style={{ width: `${progress}%` }} />
            </span>
          </div>
        )}
        <div className="cart-drawer__items">
          {cart.length === 0 ? (
            <div className="cart-empty"><span className="cart-empty__icon"><ShoppingBag size={28} /></span><h3>Your basket is empty</h3><p>Add fresh groceries to get started.</p></div>
          ) : (
            <AnimatePresence initial={false}>
              {cart.map((item) => (
                <motion.div
                  className="cart-line"
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 28 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="cart-line__img"><img src={item.image} alt="" onError={handleImageFallback} /></div>
                  <div className="cart-line__body">
                    <h4>{item.name}</h4><span>{item.unit}</span>
                    <div className="qty">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`}><Minus size={14} /></button>
                      <b>{item.quantity}</b>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`}><Plus size={14} /></button>
                    </div>
                  </div>
                  <div className="cart-line__end">
                    <strong>Rs. {item.price * item.quantity}</strong>
                    <button
                      onClick={() => { removeFromCart(item.id); notify(`${item.name} removed from cart`) }}
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        {cart.length > 0 && (
          <div className="cart-drawer__foot">
            <div className="cart-drawer__subtotal"><span>Subtotal</span><strong>Rs. {subtotal.toLocaleString('en-PK')}</strong></div>
            <div className="cart-drawer__note"><Clock3 size={14} /> Delivery availability is confirmed at checkout.</div>
            <button className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setCartOpen(false); navigate('/checkout') }}>Proceed to Checkout <ArrowRight size={18} /></button>
          </div>
        )}
      </motion.aside>
    </>
  )
}

export default function App() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return (
    <>
      <RouteLoadingBar />
      {!isAdmin && <Header />}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          className="route-shell"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <Suspense fallback={<main className="route-loading">Loading Grovia…</main>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/account" element={<AuthPage />} />
              <Route path="/account/reset-password" element={<AuthPage />} />
              <Route path="/account/orders/:id" element={<OrderDetailsPage />} />
              <Route path="/admin/*" element={<AdminPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/:slug" element={<InfoPage />} />
              <Route path="*" element={<main className="shop-empty"><h1>Page not found</h1><p>This page may have moved.</p><Link to="/">Return home</Link></main>} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
      {!isAdmin && <Footer />}
      {!isAdmin && <WhatsAppSupportButton />}
      {!isAdmin && <ShoppingAssistant />}
      {!isAdmin && <CartDrawer />}
      <ToastContainer />
    </>
  )
}
