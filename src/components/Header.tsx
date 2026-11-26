import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
  UserRound,
  X,
} from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useCategories, useStorefrontSettings } from '../hooks/useCatalog'
import { useWishlist } from '../hooks/useWishlist'
import { cartCount, useStore } from '../store'
import { handleImageFallback } from '../utils/imageFallback'
import { publicAssetUrl } from '../utils/publicAssetUrl'
import { Logo } from './Logo'

export function Header() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const { data: categories = [] } = useCategories()
  const { data: storefrontSettings } = useStorefrontSettings()
  const brand = storefrontSettings?.siteContent.brand
  const primaryColor = brand?.primaryColor
  const accentColor = brand?.accentColor
  const wishlist = useWishlist()
  const cart = useStore((state) => state.cart)
  const setCartOpen = useStore((state) => state.setCartOpen)
  const count = cartCount(cart)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!primaryColor || !accentColor) return
    const root = document.documentElement
    const previous = {
      forest: root.style.getPropertyValue('--forest'),
      green: root.style.getPropertyValue('--green'),
      lime: root.style.getPropertyValue('--lime'),
      lime2: root.style.getPropertyValue('--lime-2'),
    }
    root.style.setProperty('--forest', primaryColor)
    root.style.setProperty('--green', primaryColor)
    root.style.setProperty('--lime', accentColor)
    root.style.setProperty('--lime-2', accentColor)
    return () => {
      for (const [property, value] of Object.entries({
        '--forest': previous.forest,
        '--green': previous.green,
        '--lime': previous.lime,
        '--lime-2': previous.lime2,
      })) {
        if (value) root.style.setProperty(property, value)
        else root.style.removeProperty(property)
      }
    }
  }, [accentColor, primaryColor])

  useEffect(() => {
    if (!searchOpen && !mobileOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setMobileOpen(false)
      }
    }
    document.body.classList.add('no-scroll')
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('no-scroll')
      window.removeEventListener('keydown', onKey)
    }
  }, [searchOpen, mobileOpen])

  const submitSearch = (event?: FormEvent) => {
    event?.preventDefault()
    const term = query.trim()
    setSearchOpen(false)
    setMobileOpen(false)
    navigate(term ? `/shop?q=${encodeURIComponent(term)}` : '/shop')
  }

  const quickSearch = (term: string) => {
    setQuery('')
    setSearchOpen(false)
    navigate(`/shop?q=${encodeURIComponent(term)}`)
  }

  const isActive = (path: string) => pathname === path

  return (
    <>
      <div className="announcement">
        <div className="container announcement__inner">
          <span className="announcement__message">
            <Truck size={13} /> {brand?.announcement ?? 'Delivery fees and available slots are shown at checkout'}
          </span>
          <div className="announcement__links">
            <span>Pakistan · PKR</span>
            <Link to="/account">Track your order</Link>
            <Link to="/contact">Help &amp; support</Link>
          </div>
        </div>
      </div>

      <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="container header-main">
          <button type="button" className="menu-trigger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>

          <Logo src={brand?.logoUrl} brandName={brand?.siteName} tagline={brand?.tagline} />

          <nav className="primary-nav" aria-label="Primary">
            <div className="nav-item">
              <Link to="/shop" className={`nav-link ${isActive('/shop') ? 'is-active' : ''}`}>
                Shop <ChevronDown size={13} />
              </Link>
              <div className="mega">
                <div className="mega__panel">
                  <div className="mega__intro">
                    <span className="eyebrow">The market</span>
                    <h3>
                      Everything fresh,
                      <br />
                      <span className="serif" style={{ color: 'var(--green)' }}>under one roof.</span>
                    </h3>
                    <p>{categories.length} departments for the everyday shop, delivered in your chosen slot.</p>
                    <Link to="/shop">
                      Browse all groceries <ArrowRight size={13} />
                    </Link>
                  </div>
                  <div className="mega__cats">
                    {categories.slice(0, 9).map((category) => (
                      <Link key={category.slug} className="mega__cat" to={`/shop?category=${encodeURIComponent(category.slug)}`}>
                        <img src={publicAssetUrl(category.image ?? '/assets/editorial/market-basket.jpg')} alt="" onError={handleImageFallback} />
                        <span>
                          <strong>{category.name}</strong>
                          <span>{category.productCount ?? category.count ?? 0} products</span>
                        </span>
                      </Link>
                    ))}
                    {categories[0] && (
                      <div className="mega__feature">
                        <img src={publicAssetUrl(categories[0].image ?? '/assets/editorial/market-tall-2.jpg')} alt={categories[0].name} onError={handleImageFallback} />
                        <div>
                          <strong>{categories[0].name}</strong>
                          <span>{categories[0].productCount ?? 0} published products</span>
                        </div>
                        <Link className="btn btn--sm btn--lime" to={`/shop?category=${encodeURIComponent(categories[0].slug)}`}>
                          Shop category <ArrowRight size={13} />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {categories.slice(0, 3).map((category) => (
              <Link key={category.slug} to={`/shop?category=${encodeURIComponent(category.slug)}`} className="nav-link">
                {category.name}
              </Link>
            ))}
            <Link to="/shop?discount=true" className="nav-link">Offers</Link>
            <Link to="/about" className={`nav-link ${isActive('/about') ? 'is-active' : ''}`}>Our story</Link>
          </nav>

          <div className="header-tools">
            <button type="button" className="tool-btn tool-btn--search" onClick={() => setSearchOpen(true)} aria-label="Search groceries">
              <Search size={19} />
              <span className="tool-btn__label">Search</span>
            </button>
            <Link to="/account" className="tool-btn" aria-label="Account">
              <UserRound size={19} />
              <span className="tool-btn__label">{user ? user.name.split(' ')[0] : 'Account'}</span>
            </Link>
            <Link to="/wishlist" className="tool-btn" aria-label="Wishlist">
              <Heart size={19} />
              <span className="tool-btn__label">Saved</span>
              {wishlist.count > 0 && <span className="tool-btn__count">{wishlist.count}</span>}
            </Link>
            <button type="button" className="tool-btn tool-btn--cart" onClick={() => setCartOpen(true)} aria-label={`Basket, ${count} items`}>
              <ShoppingBag size={18} />
              <span>Basket</span>
              <span className="tool-btn__count">{count}</span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="search-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSearchOpen(false)
            }}
          >
            <motion.div
              className="search-layer__panel"
              initial={{ y: -18, scale: 0.985 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: -12, scale: 0.99 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Search groceries"
            >
              <form className="search-layer__form" onSubmit={submitSearch}>
                <Search size={22} style={{ color: 'var(--green)', flexShrink: 0 }} />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search for mangoes, sourdough, walnuts…"
                  aria-label="Search groceries"
                />
                <button type="button" className="search-layer__close" onClick={() => setSearchOpen(false)} aria-label="Close search">
                  <X size={17} />
                </button>
              </form>
              <div className="search-layer__hint">
                <span>Popular right now</span>
                {['Strawberries', 'Sourdough', 'Farm eggs', 'Dry fruits', 'Chicken'].map((term) => (
                  <button type="button" key={term} onClick={() => quickSearch(term)}>
                    {term}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="mobile-nav" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" className="mobile-nav__backdrop" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
            <motion.aside
              className="mobile-nav__panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mobile-nav__head">
                <Logo src={brand?.logoUrl} brandName={brand?.siteName} tagline={brand?.tagline} />
                <button type="button" className="admin-icon-btn" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <X size={18} />
                </button>
              </div>
              <div className="mobile-nav__links">
                <Link to="/shop" onClick={() => setMobileOpen(false)}>Shop all groceries <ArrowRight size={16} /></Link>
                <Link to="/shop?discount=true" onClick={() => setMobileOpen(false)}>Offers &amp; deals <ArrowRight size={16} /></Link>
                <Link to="/about" onClick={() => setMobileOpen(false)}>Our story <ArrowRight size={16} /></Link>
                <Link to="/account" onClick={() => setMobileOpen(false)}>{user ? 'My account' : 'Sign in'} <ArrowRight size={16} /></Link>
                <Link to="/wishlist" onClick={() => setMobileOpen(false)}>Saved items <ArrowRight size={16} /></Link>
                <Link to="/contact" onClick={() => setMobileOpen(false)}>Contact us <ArrowRight size={16} /></Link>
                {user && user.role !== 'customer' && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)}>Operations dashboard <ArrowRight size={16} /></Link>
                )}
              </div>
              <div>
                <span className="eyebrow" style={{ marginBottom: 10 }}>Departments</span>
                <div className="mobile-nav__cats">
                  {categories.map((category) => (
                    <Link
                      key={category.slug}
                      to={`/shop?category=${encodeURIComponent(category.slug)}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <img src={publicAssetUrl(category.image ?? '/assets/editorial/market-basket.jpg')} alt="" onError={handleImageFallback} />
                      {category.name}
                      <ArrowRight size={13} style={{ marginLeft: 'auto', opacity: 0.35 }} />
                    </Link>
                  ))}
                </div>
              </div>
              <div className="mobile-nav__foot">
                <div className="hero__announce" style={{ width: '100%' }}>
                  <Sparkles size={13} /> Freshness at your fingertips
                </div>
                <button type="button" className="btn btn--primary btn--block" onClick={() => { setMobileOpen(false); setCartOpen(true) }}>
                  View basket {count > 0 ? `(${count})` : ''} <ArrowRight size={15} />
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
