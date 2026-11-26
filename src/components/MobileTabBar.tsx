import { Heart, House, Search, ShoppingBag, Store } from 'lucide-react'
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

  const openSearch = () => window.dispatchEvent(new Event('grovia:open-search'))

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
      <button type="button" className="mobile-tabbar__item" onClick={openSearch} aria-label="Search groceries">
        <Search size={19} />
        <span>Search</span>
      </button>
      <Link to="/wishlist" className={`mobile-tabbar__item${pathname === '/wishlist' ? ' is-active' : ''}`} aria-current={pathname === '/wishlist' ? 'page' : undefined} aria-label={`Saved items, ${wishlist.count}`}>
        <span className="mobile-tabbar__icon">
          <Heart size={19} />
          {wishlist.count > 0 && <span className="mobile-tabbar__badge">{wishlist.count > 99 ? '99+' : wishlist.count}</span>}
        </span>
        <span>Saved</span>
      </Link>
      <button type="button" className={`mobile-tabbar__item${cartOpen ? ' is-active' : ''}`} onClick={() => setCartOpen(true)} aria-label={`Basket, ${count} items`} aria-expanded={cartOpen}>
        <span className="mobile-tabbar__icon">
          <ShoppingBag size={19} />
          {count > 0 && <span className="mobile-tabbar__badge">{count > 99 ? '99+' : count}</span>}
        </span>
        <span>Basket</span>
      </button>
    </nav>
  )
}
