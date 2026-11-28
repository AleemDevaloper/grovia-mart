import { Heart, House, ShoppingBag, Store, UserRound } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cartCount, useStore } from '../store'
import { useWishlist } from '../hooks/useWishlist'

export function MobileTabBar() {
  const { pathname } = useLocation()
  const cart = useStore((state) => state.cart)
  const cartOpen = useStore((state) => state.cartOpen)
  const setCartOpen = useStore((state) => state.setCartOpen)
  const wishlist = useWishlist()
  const count = cartCount(cart)
  const accountActive = pathname === '/account' || pathname.startsWith('/account/')

  return (
    <nav className="mobile-tabbar" aria-label="Quick navigation">
      <Link to="/" className={`mobile-tabbar__item${pathname === '/' ? ' is-active' : ''}`} aria-current={pathname === '/' ? 'page' : undefined}>
        <House size={19} />
        <span>Home</span>
      </Link>
      <Link to="/shop" className={`mobile-tabbar__item${pathname.startsWith('/shop') ? ' is-active' : ''}`} aria-current={pathname.startsWith('/shop') ? 'page' : undefined}>
        <Store size={19} />
        <span>Shop</span>
      </Link>
      <button type="button" className={`mobile-tabbar__item mobile-tabbar__item--featured${cartOpen ? ' is-active' : ''}`} onClick={() => setCartOpen(true)} aria-label={`Basket, ${count} items`} aria-expanded={cartOpen}>
        <span className="mobile-tabbar__featured-icon">
          <ShoppingBag size={21} />
          {count > 0 && <span key={count} className="mobile-tabbar__badge mobile-tabbar__badge--basket">{count > 99 ? '99+' : count}</span>}
        </span>
        <span className="mobile-tabbar__label">Basket</span>
      </button>
      <Link to="/wishlist" className={`mobile-tabbar__item${pathname === '/wishlist' ? ' is-active' : ''}`} aria-current={pathname === '/wishlist' ? 'page' : undefined} aria-label={`Saved items, ${wishlist.count}`}>
        <span className="mobile-tabbar__icon">
          <Heart size={19} />
          {wishlist.count > 0 && <span className="mobile-tabbar__badge">{wishlist.count > 99 ? '99+' : wishlist.count}</span>}
        </span>
        <span>Saved</span>
      </Link>
      <Link to="/account" className={`mobile-tabbar__item${accountActive ? ' is-active' : ''}`} aria-current={accountActive ? 'page' : undefined}>
        <UserRound size={19} />
        <span>Account</span>
      </Link>
    </nav>
  )
}
