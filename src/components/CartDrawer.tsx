import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Clock3, ShoppingBag, Trash2, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { cartSubtotal, useStore } from '../store'
import { money } from '../lib/format'
import { notify } from '../lib/toast'
import { handleImageFallback } from '../utils/imageFallback'
import { QuantityStepper } from './QuantityStepper'

export function CartDrawer() {
  const navigate = useNavigate()
  const cart = useStore((state) => state.cart)
  const open = useStore((state) => state.cartOpen)
  const setCartOpen = useStore((state) => state.setCartOpen)
  const updateQuantity = useStore((state) => state.updateQuantity)
  const removeFromCart = useStore((state) => state.removeFromCart)
  const subtotal = cartSubtotal(cart)

  useEffect(() => {
    if (!open) return
    document.body.classList.add('no-scroll')
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCartOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('no-scroll')
      window.removeEventListener('keydown', onKey)
    }
  }, [open, setCartOpen])

  const checkout = () => {
    setCartOpen(false)
    navigate('/checkout')
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="overlay"
            onClick={() => setCartOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-label="Close basket"
          />
          <motion.aside
            className="cart-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping basket"
          >
            <div className="cart-drawer__head">
              <div>
                <small>Your basket</small>
                <h2>{cart.length === 0 ? 'Your basket' : `${cart.length} ${cart.length === 1 ? 'item' : 'items'} selected`}</h2>
              </div>
              <button type="button" className="cart-drawer__close" onClick={() => setCartOpen(false)} aria-label="Close basket">
                <X size={18} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <span className="cart-empty__icon">
                  <ShoppingBag size={30} />
                </span>
                <h3>Your basket is empty</h3>
                <p>Explore fresh foods, pantry staples, snacks and everyday essentials.</p>
                <Link to="/shop" className="btn btn--primary" onClick={() => setCartOpen(false)}>
                  Explore the market <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <>
                <div className="cart-drawer__items">
                  {cart.map((item) => (
                    <div className="cart-line" key={item.id}>
                      <Link to={`/product/${item.slug}`} className="cart-line__img" onClick={() => setCartOpen(false)}>
                        <img src={item.image} alt={item.name} onError={handleImageFallback} />
                      </Link>
                      <div className="cart-line__body">
                        <h4>
                          <Link to={`/product/${item.slug}`} onClick={() => setCartOpen(false)}>
                            {item.name}
                          </Link>
                        </h4>
                        <span>{item.unit} · {money(item.price)}</span>
                        <QuantityStepper value={item.quantity} onChange={(quantity) => updateQuantity(item.id, quantity)} max={Math.max(1, item.stockQuantity)} />
                      </div>
                      <div className="cart-line__end">
                        <strong>{money(item.price * item.quantity)}</strong>
                        <button
                          type="button"
                          onClick={() => {
                            removeFromCart(item.id)
                            notify(`${item.name} removed from your basket`, 'info')
                          }}
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-drawer__foot">
                  <div className="cart-drawer__subtotal">
                    <span>Subtotal</span>
                    <strong>{money(subtotal)}</strong>
                  </div>
                  <p className="cart-drawer__note"><Clock3 size={13} /> Delivery cost and available slots are confirmed at checkout.</p>
                  <button type="button" className="btn btn--primary btn--block btn--lg" onClick={checkout}>
                    Proceed to checkout <ArrowRight size={17} />
                  </button>
                  <button type="button" className="btn btn--ghost btn--block btn--sm" onClick={() => { setCartOpen(false); navigate('/shop') }}>
                    Continue shopping
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
