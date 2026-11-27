import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react'
import { useCategories, useStorefrontSettings } from '../hooks/useCatalog'
import { api, ApiError } from '../lib/api'
import { notify } from '../lib/toast'
import { GROVIA_WHATSAPP_NUMBER, WhatsAppIcon } from './WhatsAppSupport'
import { Logo } from './Logo'

export function Footer() {
  const { data: categories = [] } = useCategories()
  const { data: storefrontSettings } = useStorefrontSettings()
  const brand = storefrontSettings?.siteContent.brand
  const footerLogo = brand?.logoUrl && brand.logoUrl !== '/assets/brand/grovia-logo-light.png'
    ? brand.logoUrl
    : '/assets/brand/logo-dark.png'
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)

  const subscribe = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    try {
      await api.catalog.newsletter(email.trim())
      notify('You are on the list. Fresh updates are on the way.')
      setEmail('')
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) notify('This email is already subscribed.', 'info')
      else notify('We could not subscribe you right now. Please try again.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-brand__lockup">
              <Logo src={footerLogo} brandName={brand?.siteName} tagline={brand?.tagline} />
            </div>
            <p>{brand?.footerDescription ?? 'Fresh groceries, better living. From everyday pantry staples to snacks, sweets and chilled drinks.'}</p>
            <div className="footer-social">
              <a href={`mailto:${brand?.email ?? 'hello@groviamart.pk'}`} aria-label="Email Grovia Mart"><Mail size={16} /></a>
              <a href={`https://wa.me/${GROVIA_WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Grovia Mart"><WhatsAppIcon size={16} /></a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              <li><Link to="/shop">All groceries</Link></li>
              {categories.slice(0, 7).map((category) => (
                <li key={category.slug}>
                  <Link to={`/shop?category=${encodeURIComponent(category.slug)}`}>{category.name}</Link>
                </li>
              ))}
              <li><Link to="/deli">Deli &amp; bakery</Link></li>
              <li><Link to="/shop?discount=true">Offers &amp; deals</Link></li>
              <li><Link to="/wishlist">Saved items</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Grovia</h4>
            <ul>
              <li><Link to="/about">Our story</Link></li>
              <li><Link to="/contact">Contact us</Link></li>
              <li><Link to="/faqs">FAQs</Link></li>
              <li><Link to="/delivery">Delivery &amp; returns</Link></li>
              <li><Link to="/privacy">Privacy policy</Link></li>
              <li><Link to="/terms">Terms of service</Link></li>
            </ul>
          </div>

          <div className="footer-col footer-news">
            <h4>{brand?.newsletterTitle ?? 'The Grovia letter'}</h4>
            <p>{brand?.newsletterCopy ?? 'Seasonal edits, kitchen inspiration and members-only offers — once a week, never more.'}</p>
            <form onSubmit={subscribe}>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Your email address"
                aria-label="Email address for newsletter"
              />
              <button type="submit" disabled={busy} aria-label="Subscribe to newsletter">
                <ArrowRight size={16} />
              </button>
            </form>
            <small>By subscribing you agree to our privacy policy.</small>
            <ul style={{ marginTop: 18 }}>
              <li><a href={`tel:${(brand?.phone ?? '+92 308 792 3041').replace(/[^\d+]/g, '')}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Phone size={13} /> {brand?.phone ?? '+92 308 792 3041'}</a></li>
              <li><a href={`https://wa.me/${GROVIA_WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><WhatsAppIcon size={14} /> WhatsApp +92 308 792 3041</a></li>
              <li><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><MapPin size={13} /> {brand?.address ?? 'Gulberg III, Lahore'}</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 {brand?.siteName ?? 'Grovia Mart'}. All rights reserved.</span>
          <div className="footer-bottom__links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/returns">Returns</Link>
            <Link to="/admin">Operations</Link>
          </div>
          <div className="footer-pay">
            <span>COD</span>
            <span>VISA</span>
            <span>MASTERCARD</span>
            <span>JazzCash</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
