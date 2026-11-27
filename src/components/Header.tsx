import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  ChevronDown,
  Download,
  Heart,
  MapPin,
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
  const deliveryPin = useStore((state) => state.deliveryPin)
  const setDeliveryPin = useStore((state) => state.setDeliveryPin)
  const count = cartCount(cart)
  const [searchOpen, setSearchOpen] = useState(false)
  const [installGuideOpen, setInstallGuideOpen] = useState(false)
  const [locationGuideOpen, setLocationGuideOpen] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [appInstalled, setAppInstalled] = useState(false)
  const [installError, setInstallError] = useState('')
  const [locationError, setLocationError] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const openSearch = () => setSearchOpen(true)
    window.addEventListener('grovia:open-search', openSearch)
    return () => window.removeEventListener('grovia:open-search', openSearch)
  }, [])

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)')
    const updateInstalled = () => {
      setAppInstalled(displayMode.matches || ('standalone' in navigator && navigator.standalone === true))
    }
    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setAppInstalled(true)
      setInstallPrompt(null)
      setInstallGuideOpen(false)
    }

    updateInstalled()
    displayMode.addEventListener('change', updateInstalled)
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      displayMode.removeEventListener('change', updateInstalled)
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
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
    if (!searchOpen && !mobileOpen && !installGuideOpen && !locationGuideOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setMobileOpen(false)
        setInstallGuideOpen(false)
        setLocationGuideOpen(false)
      }
    }
    document.body.classList.add('no-scroll')
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('no-scroll')
      window.removeEventListener('keydown', onKey)
    }
  }, [searchOpen, mobileOpen, installGuideOpen, locationGuideOpen])

  const installApp = async () => {
    if (!installPrompt) return
    setInstallError('')
    try {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice
      setInstallPrompt(null)
      if (choice.outcome === 'accepted') {
        setAppInstalled(true)
        setInstallGuideOpen(false)
      }
    } catch {
      setInstallPrompt(null)
      setInstallError('Your browser could not open the install prompt. Use the browser menu instructions below instead.')
    }
  }

  const openInstallGuide = () => {
    setInstallError('')
    setMobileOpen(false)
    setInstallGuideOpen(true)
  }

  const openLocationGuide = () => {
    setLocationError('')
    setMobileOpen(false)
    setLocationGuideOpen(true)
  }

  const requestCurrentLocation = () => {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('Location sharing is not available in this browser. You can still enter your address at checkout.')
      return
    }

    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setDeliveryPin({ latitude: coords.latitude, longitude: coords.longitude })
        setLocationLoading(false)
      },
      (error) => {
        setLocationLoading(false)
        setLocationError(error.code === error.PERMISSION_DENIED
          ? 'Location permission was not granted. You can still enter your address at checkout.'
          : 'We could not get your location. Check your device settings and try again.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  const isAppleMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/i.test(navigator.userAgent)
  const installInstructions = isAppleMobile
    ? 'Open this page in Safari, tap Share, then choose Add to Home Screen.'
    : isAndroid
      ? 'Open your browser menu and tap Install app or Add to Home screen.'
      : 'Use the install icon in your browser’s address bar, or choose Install Grovia Mart from the browser menu.'

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
            <button type="button" className="announcement__location" onClick={openLocationGuide} aria-haspopup="dialog">
              <MapPin size={13} /> {deliveryPin ? 'Location ready' : 'Set delivery location'}
            </button>
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
            <Link to="/delivery" className={`nav-link ${isActive('/delivery') ? 'is-active' : ''}`}>Delivery</Link>
            <Link to="/about" className={`nav-link ${isActive('/about') ? 'is-active' : ''}`}>Our story</Link>
          </nav>

          <div className="header-tools">
            <button type="button" className="tool-btn tool-btn--search" onClick={() => setSearchOpen(true)} aria-label="Search groceries">
              <Search size={19} />
              <span className="tool-btn__label">Search</span>
            </button>
            {!appInstalled && (
              <button type="button" className="tool-btn tool-btn--install" onClick={openInstallGuide} aria-label="Install Grovia Mart" aria-haspopup="dialog">
                <Download size={18} />
                <span className="tool-btn__label">Install</span>
              </button>
            )}
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
        {installGuideOpen && (
          <motion.div
            className="install-guide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setInstallGuideOpen(false)
            }}
          >
            <motion.section
              className="install-guide__panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="install-guide-title"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
            >
              <div className="install-guide__head">
                <span className="install-guide__icon"><Download size={20} /></span>
                <button type="button" className="search-layer__close" onClick={() => setInstallGuideOpen(false)} aria-label="Close install instructions">
                  <X size={17} />
                </button>
              </div>
              <span className="eyebrow">Grovia, wherever you shop</span>
              <h2 id="install-guide-title">Add Grovia to your home screen.</h2>
              <p>{installPrompt ? 'Install Grovia for quick access to your market, basket and orders.' : installInstructions}</p>
              {installError && <p className="install-guide__error" role="alert">{installError}</p>}
              {installPrompt ? (
                <button type="button" className="btn btn--primary btn--block" onClick={() => void installApp()}>
                  <Download size={16} /> Install Grovia app
                </button>
              ) : (
                <button type="button" className="btn btn--primary btn--block" onClick={() => setInstallGuideOpen(false)}>Got it</button>
              )}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {locationGuideOpen && (
          <motion.div
            className="install-guide location-guide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setLocationGuideOpen(false)
            }}
          >
            <motion.section
              className="install-guide__panel location-guide__panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="location-guide-title"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
            >
              <div className="install-guide__head">
                <span className="install-guide__icon"><MapPin size={20} /></span>
                <button type="button" className="search-layer__close" onClick={() => setLocationGuideOpen(false)} aria-label="Close location dialog">
                  <X size={17} />
                </button>
              </div>
              <span className="eyebrow">Your Grovia delivery</span>
              <h2 id="location-guide-title">Set your delivery location.</h2>
              <p>Share your current location to add an optional delivery pin at checkout. Grovia keeps it only for this visit; you can also enter your address manually.</p>
              {deliveryPin && (
                <p className="location-guide__status" role="status">
                  Your location pin is ready for checkout.
                </p>
              )}
              {locationError && <p className="install-guide__error" role="alert">{locationError}</p>}
              <div className="location-guide__actions">
                <button type="button" className="btn btn--primary btn--block" onClick={requestCurrentLocation} disabled={locationLoading}>
                  <MapPin size={16} /> {locationLoading ? 'Finding your location…' : deliveryPin ? 'Update current location' : 'Use my current location'}
                </button>
                {deliveryPin && (
                  <button type="button" className="location-guide__clear" onClick={() => setDeliveryPin(null)}>
                    Remove location pin
                  </button>
                )}
              </div>
            </motion.section>
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
                <Link to="/delivery" onClick={() => setMobileOpen(false)}>Delivery coverage <ArrowRight size={16} /></Link>
                <Link to="/about" onClick={() => setMobileOpen(false)}>Our story <ArrowRight size={16} /></Link>
                <Link to="/account" onClick={() => setMobileOpen(false)}>{user ? 'My account' : 'Sign in'} <ArrowRight size={16} /></Link>
                <Link to="/wishlist" onClick={() => setMobileOpen(false)}>Saved items <ArrowRight size={16} /></Link>
                <button type="button" className="mobile-location-link" onClick={openLocationGuide}>
                  <span><MapPin size={16} /> Delivery location</span><ArrowRight size={16} />
                </button>
                <Link to="/contact" onClick={() => setMobileOpen(false)}>Contact us <ArrowRight size={16} /></Link>
                {!appInstalled && (
                  <button type="button" className="mobile-install-link" onClick={openInstallGuide}>
                    <span><Download size={16} /> Install Grovia app</span><ArrowRight size={16} />
                  </button>
                )}
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

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}
