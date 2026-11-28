import { useCallback, useEffect, useState, useSyncExternalStore, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Leaf,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react'
import { useHome } from '../hooks/useCatalog'
import { useCountdown } from '../hooks/useCountdown'
import { api } from '../lib/api'
import { notify } from '../lib/toast'
import { handleImageFallback } from '../utils/imageFallback'
import { publicAssetUrl } from '../utils/publicAssetUrl'
import { ProductCard } from '../components/ProductCard'
import { Reveal } from '../components/Reveal'
import { StarRating } from '../components/StarRating'
import { Swiper, SwiperSlide } from 'swiper/react'
import { A11y, Autoplay, Keyboard } from 'swiper/modules'
import type { Swiper as SwiperInstance } from 'swiper'
import type { Banner } from '../types'
import 'swiper/css'

const tabs = [
  { key: 'seasonal', label: 'Seasonal' },
  { key: 'bestsellers', label: 'Bestsellers' },
  { key: 'offers', label: 'Offers' },
] as const

const popularSearches = ['Fresh fruit', 'Eggs', 'Chicken', 'Rice']

type TabKey = (typeof tabs)[number]['key']

const values = [
  { n: '01', title: 'Thoughtful grocery choices', copy: 'Explore a considered mix of fresh foods, pantry staples, snacks and everyday essentials.' },
  { n: '02', title: 'Delivery, made clear', copy: 'Available areas and delivery windows are shown at checkout for your address.' },
  { n: '03', title: 'Prices up front', copy: 'Review item prices, discounts and delivery fees before placing an order.' },
  { n: '04', title: 'Support when you need it', copy: 'Contact Grovia customer care if an order does not meet expectations.' },
]

export function HomePage() {
  const { data: home, isLoading, error } = useHome()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabKey>('seasonal')
  const [searchTerm, setSearchTerm] = useState('')
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState('')
  const [subscribeError, setSubscribeError] = useState('')
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [heroSlideIndex, setHeroSlideIndex] = useState(0)
  const [heroSwiper, setHeroSwiper] = useState<SwiperInstance | null>(null)
  const [categorySwiper, setCategorySwiper] = useState<SwiperInstance | null>(null)
  const [productSwiper, setProductSwiper] = useState<SwiperInstance | null>(null)
  const [testimonialSwiper, setTestimonialSwiper] = useState<SwiperInstance | null>(null)
  const countdown = useCountdown()

  const categories = home?.categories ?? []
  const products = home ? (tab === 'offers' ? home.offers : tab === 'bestsellers' ? home.bestsellers : home.seasonal) : []
  const banners = home?.banners ?? []
  const configuredHeroSlides = banners.filter((banner) => banner.placement === 'home_hero' && banner.isActive !== false)
  const heroSlides: Banner[] = configuredHeroSlides.length > 0 ? configuredHeroSlides : [
    { id: -1, title: 'The Grovia market', subtitle: 'Everyday groceries, thoughtfully selected', image: '/assets/editorial/market-hero.jpg', link: '/shop', placement: 'home_hero', isActive: true },
    { id: -2, title: 'Fresh from the market', subtitle: 'Seasonal produce for your table', image: '/assets/editorial/market-wide-1.jpg', link: '/shop', placement: 'home_hero', isActive: true },
    { id: -3, title: 'Good things for every shelf', subtitle: 'Discover the Grovia pantry', image: '/assets/editorial/market-wide-2.jpg', link: '/shop', placement: 'home_hero', isActive: true },
  ]
  const testimonials = home?.testimonials ?? []
  const stats = home?.stats
  const siteHome = home?.siteContent.home
  const siteSection = (id: string) => siteHome?.sections.find((section) => section.id === id)
  const sectionStyle = (id: string, defaultOrder: number) => {
    const section = siteSection(id)
    return {
      order: section?.sortOrder ?? defaultOrder,
      display: section?.visible === false ? 'none' as const : undefined,
    }
  }
  const valueCards = siteHome?.values.map((value, index) => ({
    n: String(index + 1).padStart(2, '0'),
    title: value.title,
    copy: value.copy,
  })) ?? values
  const heroContent = siteHome?.hero
  const primaryHeroCta = heroContent?.primaryCta?.trim()
  const primaryHeroCtaLabel = primaryHeroCta && primaryHeroCta.toLowerCase() !== 'shop the market'
    ? primaryHeroCta
    : 'Shop groceries'

  const searchGrovia = (term: string) => {
    const query = term.trim()
    navigate(query ? `/shop?q=${encodeURIComponent(query)}` : '/shop')
  }

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    searchGrovia(searchTerm)
  }

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(preference.matches)
    preference.addEventListener('change', updatePreference)
    return () => preference.removeEventListener('change', updatePreference)
  }, [])

  const subscribe = async (event: FormEvent) => {
    event.preventDefault()
    setSubscribed('')
    setSubscribeError('')
    try {
      await api.catalog.newsletter(email.trim())
      setSubscribed('You are on the list. Look out for the next Grovia letter.')
      setEmail('')
      notify('Welcome to the Grovia letter.')
    } catch {
      setSubscribeError('We could not add this email right now. Please try again.')
    }
  }

  return (
    <main>
      <section className="hero">
        <div className="container">
          <div className="hero__grid">
            <div className="hero__copy">
              <motion.div
                className="hero__announce"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <b>THE GROVIA MARKET</b> {heroContent?.announcement ?? 'Everyday groceries, thoughtfully selected'}
                <ArrowUpRight size={12} />
              </motion.div>

              <motion.span
                className="eyebrow"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.08 }}
              >
                {heroContent?.eyebrow ?? 'Fresh groceries · better living'}
              </motion.span>

              <motion.h1
                className="hero__title"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
              >
                {heroContent?.title ?? 'Freshness at'}
                <br />
                <em>{heroContent?.highlight ?? 'your fingertips.'}</em>
              </motion.h1>

              <motion.p
                className="hero__lead"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.26 }}
              >
                {heroContent?.lead ?? 'A considered grocery market for modern homes — fresh produce, trusted pantry staples, snacks, sweets and chilled drinks, delivered in the slot you choose.'}
              </motion.p>

              <motion.div
                className="hero-discovery"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.32 }}
              >
                <form className="hero-search" role="search" onSubmit={submitSearch}>
                  <Search className="hero-search__icon" size={19} aria-hidden="true" />
                  <label className="sr-only" htmlFor="homepage-search">Search Grovia groceries</label>
                  <input
                    id="homepage-search"
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search fresh food, pantry and more"
                  />
                  <button type="submit">Search <ArrowRight size={15} /></button>
                </form>
                <div className="hero-search__popular" aria-label="Popular searches">
                  <span>Popular</span>
                  {popularSearches.map((term) => (
                    <button type="button" key={term} onClick={() => searchGrovia(term)}>
                      {term}
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="hero__actions"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.36 }}
              >
                <Link to="/shop" className="btn btn--primary btn--lg">
                  {primaryHeroCtaLabel} <ArrowRight size={17} />
                </Link>
                <Link to="/shop?discount=true" className="btn btn--outline btn--lg">
                  {heroContent?.secondaryCta ?? 'Today’s offers'}
                </Link>
              </motion.div>

              <nav
                className="hero-category-shortcuts"
                aria-label={categories.length > 0 ? 'Shop departments' : 'Quick grocery searches'}
              >
                <span>{categories.length > 0 ? 'Shop a category' : 'Quick shop'}</span>
                {categories.length > 0
                  ? categories.slice(0, 4).map((category) => (
                    <Link key={category.slug} to={`/shop?category=${encodeURIComponent(category.slug)}`}>
                      {category.name}
                    </Link>
                  ))
                  : popularSearches.map((term) => (
                    <Link key={term} to={`/shop?q=${encodeURIComponent(term)}`}>{term}</Link>
                  ))
                }
              </nav>

              <motion.div
                className="hero__proof"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.48 }}
              >
                <span className="hero__proof-mark" aria-hidden="true"><Leaf size={17} /></span>
                <p>
                  {stats?.reviewCount ? (
                    <b>
                      <span className="hero__stars">
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star key={index} size={11} fill={index < Math.round(stats.averageRating) ? 'currentColor' : 'none'} strokeWidth={1.5} />
                        ))}
                      </span>
                      {stats.averageRating.toFixed(1)} from {stats.reviewCount} approved {stats.reviewCount === 1 ? 'review' : 'reviews'}
                    </b>
                  ) : <b>Thoughtfully selected, every day</b>}
                  {stats?.deliveryPromise ?? 'Everyday groceries for your table.'}
                </p>
              </motion.div>
            </div>

            <motion.div
              className="hero__visual"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            >
              <div className="hero__outline" aria-hidden="true" />
              <div className="hero__frame">
                <Swiper
                  key={heroSlides.map((slide) => slide.id).join(':')}
                  className="hero-carousel"
                  modules={[A11y, Autoplay, Keyboard]}
                  slidesPerView={1}
                  loop={heroSlides.length > 1}
                  keyboard={{ enabled: true, onlyInViewport: true }}
                  autoplay={heroSlides.length > 1 && !reducedMotion ? {
                    delay: 5200,
                    disableOnInteraction: true,
                    pauseOnMouseEnter: true,
                  } : false}
                  onSwiper={(swiper) => {
                    setHeroSwiper(swiper)
                    setHeroSlideIndex(0)
                  }}
                  onSlideChange={(swiper) => setHeroSlideIndex(swiper.realIndex)}
                  aria-label="Featured Grovia market images"
                >
                  {heroSlides.map((slide) => (
                    <SwiperSlide key={slide.id}>
                      <img src={publicAssetUrl(slide.image)} alt={slide.title} onError={handleImageFallback} />
                    </SwiperSlide>
                  ))}
                </Swiper>
                {heroSlides.length > 1 && (
                  <div className="hero-carousel-controls">
                    <button type="button" onClick={() => heroSwiper?.slidePrev()} aria-label="Previous featured image"><ArrowLeft size={15} /></button>
                    <span aria-live="polite" aria-atomic="true">{String(heroSlideIndex + 1).padStart(2, '0')} <i>/</i> {String(heroSlides.length).padStart(2, '0')}</span>
                    <button type="button" onClick={() => heroSwiper?.slideNext()} aria-label="Next featured image"><ArrowRight size={15} /></button>
                  </div>
                )}
              </div>
              <div className="hero__seal" aria-hidden="true">
                <strong>100%</strong>
                <span>Fresh promise</span>
                <small>picked daily</small>
              </div>
              <div className="hero__float hero__float--top">
                <span className="hero__float__icon">
                  <Leaf size={16} />
                </span>
                <div>
                  <strong>Everyday essentials</strong>
                  <small>Browse the Grovia market</small>
                </div>
              </div>
              <div className="hero__float hero__float--bottom">
                <span className="hero__float__icon">
                  <Clock3 size={16} />
                </span>
                <div>
                  <strong>Slot delivery</strong>
                  <small>Choose your hour</small>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="hero__trust">
            <div>
              <Truck size={20} />
              <span>
                <strong>Delivery details up front</strong>
                <span>Fees and slots confirmed at checkout</span>
              </span>
            </div>
            <div>
              <Leaf size={20} />
              <span>
                <strong>A wider market</strong>
                <span>Fresh food, pantry staples and snacks</span>
              </span>
            </div>
            <div>
              <ShieldCheck size={20} />
              <span>
                <strong>Secure checkout</strong>
                <span>Cash on delivery available</span>
              </span>
            </div>
            <div>
              <RotateCcw size={20} />
              <span>
                <strong>Customer care</strong>
                <span>Help when an order needs attention</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="home-layout-blocks" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="marquee" aria-hidden="true" style={sectionStyle('ticker', -1)}>
        {[0, 1].map((copy) => (
          <div className="marquee__track" key={copy}>
            <span>Handpicked daily</span>
            <span>Everyday pantry</span>
            <span>Snacks &amp; sweets</span>
            <span>Cold drinks &amp; juices</span>
            <span>Honest pricing</span>
            <span>Lahore · Karachi · Islamabad</span>
          </div>
        ))}
      </div>

      <section className="section" id="departments" style={sectionStyle('departments', 0)}>
        <div className="container">
          <div className="section-head">
            <div className="section-head__copy">
              <span className="eyebrow">{siteSection('departments')?.eyebrow ?? 'Explore the market'}</span>
              <h2 className="section-title">
                {siteSection('departments')?.title ?? 'Shop by department'}
              </h2>
              {siteSection('departments')?.description && <p>{siteSection('departments')?.description}</p>}
            </div>
            <div className="section-head__actions">
              <Link to="/shop" className="section-link">
                View all groceries <ArrowRight size={15} />
              </Link>
              <CarouselArrows swiper={categorySwiper} label="Departments" />
            </div>
          </div>

          <Reveal>
            {isLoading ? (
              <div className="cat-rail cat-rail--loading">
                {Array.from({ length: 7 }, (_, index) => <div className="cat-card" key={index}><div className="skeleton" style={{ aspectRatio: '0.82', borderRadius: 20 }} /><div className="skeleton" style={{ height: 12, width: '70%' }} /></div>)}
              </div>
            ) : categories.length > 0 ? (
              <Swiper
                className="cat-rail"
                modules={[A11y, Keyboard]}
                slidesPerView={2.1}
                spaceBetween={12}
                keyboard={{ enabled: true, onlyInViewport: true }}
                onSwiper={setCategorySwiper}
                breakpoints={{ 560: { slidesPerView: 3.2, spaceBetween: 14 }, 760: { slidesPerView: 4.2, spaceBetween: 14 }, 1024: { slidesPerView: 6, spaceBetween: 14 }, 1320: { slidesPerView: 7, spaceBetween: 14 } }}
                aria-label="Shop departments"
              >
                {categories.map((category, index) => (
                  <SwiperSlide key={category.slug}>
                    <Link to={`/shop?category=${encodeURIComponent(category.slug)}`} className="cat-card" style={{ animationDelay: `${index * 40}ms` }}>
                      <div className="cat-card__media" style={{ background: category.accent ?? undefined }}>
                        <img src={publicAssetUrl(category.image ?? '/assets/editorial/market-basket.jpg')} alt={category.name} loading="lazy" decoding="async" onError={handleImageFallback} />
                        <span className="cat-card__arrow"><ArrowUpRight size={13} /></span>
                      </div>
                      <div><strong>{category.name}</strong><span>{category.productCount ?? category.count ?? 0} products</span></div>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : <div className="empty-state"><p>Departments will appear here as soon as the market is ready.</p></div>}
          </Reveal>
        </div>
      </section>

      <section className="section home-products" id="fresh" style={sectionStyle('collection', 1)}>
        <div className="container">
          <div className="section-head">
            <div className="section-head__copy">
              <span className="eyebrow">{siteSection('collection')?.eyebrow ?? 'This week’s market edit'}</span>
              <h2 className="section-title">
                {siteSection('collection')?.title ?? 'Good things, for every shelf.'}
              </h2>
              {siteSection('collection')?.description && <p>{siteSection('collection')?.description}</p>}
            </div>
            <div className="home-products__controls">
              <div className="tab-switch" role="tablist" aria-label="Product collections">
                {tabs.map((item) => (
                  <button key={item.key} type="button" role="tab" aria-selected={tab === item.key} className={tab === item.key ? 'is-active' : ''} onClick={() => setTab(item.key)}>
                    {item.label}
                  </button>
                ))}
              </div>
              <CarouselArrows swiper={productSwiper} label={`${tab} products`} />
            </div>
          </div>

          {error && !isLoading && (
            <div className="empty-state" style={{ marginBottom: 20 }}>
              <h3>The market is resting</h3>
              <p>We could not load the catalogue. Please refresh in a moment.</p>
            </div>
          )}

          {isLoading ? (
            <div className="product-grid product-grid--loading">
              {Array.from({ length: 8 }, (_, index) => <div className="product-skeleton" key={index}><div className="skeleton" style={{ aspectRatio: '1 / 0.92' }} /><div style={{ padding: 16, display: 'grid', gap: 8 }}><div className="skeleton" style={{ height: 9, width: '40%' }} /><div className="skeleton" style={{ height: 14, width: '75%' }} /><div className="skeleton" style={{ height: 12, width: '50%' }} /></div></div>)}
            </div>
          ) : products.length > 0 ? (
            <Swiper
              key={tab}
              className="product-grid"
              modules={[A11y, Keyboard]}
              slidesPerView={1.55}
              spaceBetween={12}
              keyboard={{ enabled: true, onlyInViewport: true }}
              onSwiper={setProductSwiper}
              breakpoints={{ 440: { slidesPerView: 2.15, spaceBetween: 12 }, 680: { slidesPerView: 3, spaceBetween: 16 }, 1024: { slidesPerView: 4, spaceBetween: 18 } }}
              aria-label={`${tab} grocery products`}
            >
              {products.slice(0, 12).map((product) => <SwiperSlide key={product.id}><ProductCard product={product} /></SwiperSlide>)}
            </Swiper>
          ) : <div className="empty-state"><h3>This collection is being refreshed</h3><p>New products will appear here once they are reviewed and available.</p></div>}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 38 }}>
            <Link to={tab === 'offers' ? '/shop?discount=true' : '/shop'} className="btn btn--outline">
              View all {tab === 'offers' ? 'offers' : 'products'} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section" style={sectionStyle('seasonal', 2)}>
        <div className="container">
          <Reveal>
            <div className="offer-band">
              <div className="offer-band__copy">
                <span className="eyebrow eyebrow--light">{siteSection('seasonal')?.eyebrow ?? 'The seasonal event'}</span>
                <h2>{siteSection('seasonal')?.title ?? 'A pantry worth savouring.'}</h2>
                <p>{siteSection('seasonal')?.description ?? 'Discover a changing edit of seasonal groceries and pantry essentials.'}</p>
                <div className="offer-band__actions">
                  <Link to="/shop?discount=true" className="btn btn--lime">
                    Shop the edit <ArrowRight size={16} />
                  </Link>
                  <div className="countdown" aria-label="Offer countdown">
                    {[
                      ['Hrs', countdown.hours],
                      ['Min', countdown.minutes],
                      ['Sec', countdown.seconds],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <strong>{String(value).padStart(2, '0')}</strong>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="offer-band__media">
                <img src={publicAssetUrl('/assets/editorial/market-tall-1.jpg')} alt="Seasonal pantry produce" loading="lazy" onError={handleImageFallback} />
                <span className="offer-band__tag">Limited time</span>
              </div>
            </div>
          </Reveal>

          {categories.length > 0 && (
            <div className="promo-grid" style={{ marginTop: 22 }}>
              {categories.slice(0, 2).map((category, index) => (
                <Reveal delay={index * 0.08} key={category.id}>
                  <Link
                    to={`/shop?category=${encodeURIComponent(category.slug)}`}
                    className={`promo-card${index === 1 ? ' promo-card--orange' : ''}`}
                  >
                    <div className="promo-card__copy">
                      <span className="eyebrow">{category.productCount ?? 0} published products</span>
                      <h3>{category.name}</h3>
                      <p>{category.description ?? `Discover the current ${category.name.toLowerCase()} selection.`}</p>
                      <span className="promo-card__link">
                        Shop {category.name} <ArrowRight size={14} />
                      </span>
                    </div>
                    <div className="promo-card__media">
                      <img
                        src={publicAssetUrl(category.image || `/assets/editorial/market-wide-${index + 1}.jpg`)}
                        alt={category.name}
                        loading="lazy"
                        onError={handleImageFallback}
                      />
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section" style={{ ...sectionStyle('values', 3), paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div className="section-head__copy">
              <span className="eyebrow">{siteSection('values')?.eyebrow ?? 'The Grovia promise'}</span>
              <h2 className="section-title">{siteSection('values')?.title ?? 'A better everyday shop.'}</h2>
              <p>{siteSection('values')?.description ?? 'Useful choices and clear information at every step.'}</p>
            </div>
          </div>
          <div className="values">
            {valueCards.map((value) => (
              <div className="value" key={value.n}>
                <span className="value__num">{value.n}</span>
                <h3>{value.title}</h3>
                <p>{value.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ ...sectionStyle('story', 4), paddingTop: 0 }}>
        <div className="container">
          <div className="story">
            <Reveal className="story__art">
              <img src={publicAssetUrl('/assets/editorial/market-tall-2.jpg')} alt="A Grovia market grocer arranging produce" loading="lazy" onError={handleImageFallback} />
              <img src={publicAssetUrl('/assets/editorial/market-basket.jpg')} alt="A basket of fresh groceries" loading="lazy" onError={handleImageFallback} />
              <div className="story__stamp">
                <strong>Est. 2026</strong>
                <span>Lahore, Pakistan</span>
              </div>
            </Reveal>
            <Reveal className="story__copy" delay={0.1}>
              <span className="eyebrow">{siteSection('story')?.eyebrow ?? 'Our story'}</span>
              <h2>
                {siteSection('story')?.title ?? 'A market that'}
                <br />
                <em>{siteHome?.storyHighlight ?? 'comes to you.'}</em>
              </h2>
              <p>{siteSection('story')?.description ?? 'Grovia Mart brings together fresh foods, pantry staples, snacks and everyday essentials in one considered market. Browse current availability, see clear pricing and choose delivery options for your address at checkout.'}</p>
              <ul className="story__list">
                {(siteHome?.storyPoints ?? ['Departments for everyday grocery shopping', 'Current product availability in the catalog', 'Delivery details confirmed before ordering']).map((item) => (
                  <li key={item}>
                    <Check size={14} /> {item}
                  </li>
                ))}
              </ul>
              <div>
                <Link to="/about" className="btn btn--primary">
                  Read our story <ArrowRight size={16} />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
      <section className="section home-products" style={{ ...sectionStyle('testimonials', 5), paddingBlock: 64 }}>
        <div className="container">
          <div className="section-head">
            <div className="section-head__copy">
              <span className="eyebrow">{siteSection('testimonials')?.eyebrow ?? 'From our table to yours'}</span>
              <h2 className="section-title">
                {siteSection('testimonials')?.title ?? 'Good food, shared.'}
              </h2>
              {siteSection('testimonials')?.description && <p>{siteSection('testimonials')?.description}</p>}
            </div>
            <div className="section-head__actions">
              {stats && stats.reviewCount > 0 && <StarRating value={stats.averageRating} size={14} showValue />}
              {testimonials.length > 0 && <CarouselArrows swiper={testimonialSwiper} label="Customer stories" />}
            </div>
          </div>
          <Swiper
            className="quotes"
            modules={[A11y, Keyboard]}
            slidesPerView={1.08}
            spaceBetween={12}
            keyboard={{ enabled: true, onlyInViewport: true }}
            onSwiper={setTestimonialSwiper}
            breakpoints={{ 640: { slidesPerView: 2, spaceBetween: 16 }, 1024: { slidesPerView: 3, spaceBetween: 18 } }}
            aria-label="Customer stories"
          >
            {testimonials.slice(0, 9).map((testimonial, index) => (
              <SwiperSlide key={testimonial.id ?? testimonial.name}>
                <Reveal delay={index * 0.04}>
                  <article className="quote-card">
                    <span className="quote-card__mark" aria-hidden="true">&ldquo;</span>
                    <p>{testimonial.quote}</p>
                    <div className="quote-card__foot">
                      <span className="quote-card__avatar">{testimonial.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                      <div><strong>{testimonial.name}</strong><span>{testimonial.location ?? 'Grovia customer'}</span></div>
                      <StarRating value={testimonial.rating ?? 5} size={10} />
                    </div>
                  </article>
                </Reveal>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>
      )}

      <section className="section" style={{ ...sectionStyle('newsletter', 6), paddingTop: 0, paddingBottom: 96 }}>
        <div className="container">
          <Reveal>
            <div className="newsletter-band">
              <div className="newsletter-band__copy">
                <span className="eyebrow eyebrow--light">{siteSection('newsletter')?.eyebrow ?? 'The Grovia letter'}</span>
                <h2>
                  {siteSection('newsletter')?.title ?? 'A fresher week,'}
                  <br />
                  <em>in your inbox.</em>
                </h2>
                <p>{siteSection('newsletter')?.description ?? 'Seasonal edits, kitchen inspiration and members-only offers. One thoughtful email a week.'}</p>
                <form onSubmit={subscribe}>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Your email address"
                    aria-label="Email address"
                  />
                  <button type="submit" className="btn btn--lime">
                    Subscribe <ArrowRight size={15} />
                  </button>
                </form>
                {subscribed && <p className="newsletter-msg">{subscribed}</p>}
                {subscribeError && <p className="newsletter-msg newsletter-msg--error">{subscribeError}</p>}
                <small>No spam. Unsubscribe any time.</small>
              </div>
              <div className="newsletter-band__media">
                <img src={publicAssetUrl('/assets/editorial/newsletter.jpg')} alt="A Grovia grocery still life" loading="lazy" onError={handleImageFallback} />
              </div>
            </div>
          </Reveal>
          <div className="preview-note" style={{ marginTop: 16 }}>
            <Sparkles size={12} /> Freshness at your fingertips — {stats?.products ?? 320}+ products across {stats?.categories ?? 7} departments
          </div>
        </div>
      </section>
      </div>
    </main>
  )
}

function CarouselArrows({ swiper, label }: { swiper: SwiperInstance | null; label: string }) {
  const subscribe = useCallback((onStoreChange: () => void) => {
    if (!swiper) return () => undefined
    swiper.on('slideChange', onStoreChange)
    swiper.on('update', onStoreChange)
    swiper.on('resize', onStoreChange)
    swiper.on('fromEdge', onStoreChange)
    return () => {
      swiper.off('slideChange', onStoreChange)
      swiper.off('update', onStoreChange)
      swiper.off('resize', onStoreChange)
      swiper.off('fromEdge', onStoreChange)
    }
  }, [swiper])
  const getSnapshot = useCallback(() => swiper ? `${swiper.isBeginning}:${swiper.isEnd}` : 'true:true', [swiper])
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => 'true:true')
  const [atBeginning, atEnd] = snapshot.split(':').map((edge) => edge === 'true')

  return (
    <div className="carousel-arrows" aria-label={`${label} carousel controls`}>
      <button type="button" onClick={() => swiper?.slidePrev()} disabled={!swiper || atBeginning} aria-label={`Previous ${label}`}><ArrowLeft size={15} /></button>
      <button type="button" onClick={() => swiper?.slideNext()} disabled={!swiper || atEnd} aria-label={`Next ${label}`}><ArrowRight size={15} /></button>
    </div>
  )
}
