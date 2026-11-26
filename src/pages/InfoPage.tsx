import { ArrowRight, HelpCircle, ShieldCheck, Truck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useStorefrontSettings } from '../hooks/useCatalog'
import type { SiteContentPage } from '../types'

const pages: Record<string, { eyebrow: string; title: string; intro: string; sections: { title: string; body: string }[] }> = {
  'about': {
    eyebrow: 'OUR STORY',
    title: 'Fresh groceries, thoughtfully delivered.',
    intro: 'Grovia Mart brings carefully selected groceries to modern Pakistani homes with a focus on freshness, clear pricing and dependable service.',
    sections: [
      { title: 'Freshness first', body: 'We prioritize quality checks and careful packing across fresh produce, dairy, bakery and pantry essentials.' },
      { title: 'Built around Lahore', body: 'Delivery planning and customer support are designed around local routes, communities and same-day needs.' },
      { title: 'Clear and dependable', body: 'Our goal is simple: useful product information, honest availability and a checkout experience customers can trust.' },
    ],
  },
  'contact': {
    eyebrow: 'CUSTOMER CARE',
    title: 'How can we help?',
    intro: 'For order questions, delivery support or product information, our customer care team is ready to help.',
    sections: [
      { title: 'Order support', body: 'Use your account order details to review status and delivery information. Include your order number when contacting support.' },
      { title: 'Delivery support', body: 'For same-day delivery or address changes, contact support before the order enters processing.' },
      { title: 'Business inquiries', body: 'Supplier, partnership and bulk-order inquiries can be routed through the Grovia Mart customer care team.' },
    ],
  },
  'faqs': {
    eyebrow: 'HELP CENTRE',
    title: 'Frequently asked questions.',
    intro: 'Answers to the most common questions about shopping, delivery and orders.',
    sections: [
      { title: 'Do you offer same-day delivery?', body: 'Delivery availability depends on your area and the active slots shown during checkout.' },
      { title: 'How do I pay?', body: 'Cash on Delivery is currently available. Additional payment methods appear when their verified merchant integrations are activated.' },
      { title: 'Can I cancel an order?', body: 'Pending or confirmed orders can be cancelled from the order-details page. Processing and dispatched orders require support.' },
      { title: 'How is delivery charged?', body: 'Delivery is free for eligible qualifying baskets. The exact fee is calculated and verified by the server at checkout.' },
    ],
  },
  'privacy': {
    eyebrow: 'LEGAL',
    title: 'Privacy policy.',
    intro: 'This page describes how Grovia Mart collects, uses and protects customer information.',
    sections: [
      { title: 'Information collected', body: 'We collect account, delivery, order, payment-status and customer-support information necessary to operate the service.' },
      { title: 'How information is used', body: 'Information is used for order fulfilment, account access, fraud prevention, support, delivery and relevant service communications.' },
      { title: 'Data protection', body: 'Sensitive operations use authenticated access, server-side authorization and carefully scoped permissions. Secrets remain on the Laravel server, never in the browser.' },
    ],
  },
  'terms': {
    eyebrow: 'LEGAL',
    title: 'Terms and conditions.',
    intro: 'These terms govern use of Grovia Mart, account access, ordering and delivery services.',
    sections: [
      { title: 'Orders and availability', body: 'Products remain subject to stock and area availability. Verified server-side totals take precedence over unsubmitted browser totals.' },
      { title: 'Account responsibility', body: 'Customers are responsible for accurate account, contact and delivery details and for securing their login credentials.' },
      { title: 'Service changes', body: 'Grovia Mart may update product availability, delivery areas, payment methods and policy terms as operations develop.' },
    ],
  },
  'returns': {
    eyebrow: 'OUR PROMISE',
    title: 'Returns and refunds.',
    intro: 'Grovia Mart handles freshness concerns and incorrect or damaged items with a careful support process.',
    sections: [
      { title: 'Report an issue promptly', body: 'Contact support with the order number and relevant item details. Keep the package and receipt available.' },
      { title: 'Eligible replacements or refunds', body: 'Eligibility depends on product condition, delivery evidence and the applicable freshness or damage policy.' },
      { title: 'Payment refunds', body: 'Approved refunds are processed according to the original payment method and provider rules. Cash refunds follow store policy.' },
    ],
  },
}

export function InfoPage() {
  const { slug = 'about' } = useParams()
  const { data: storefrontSettings } = useStorefrontSettings()
  const page = storefrontSettings?.siteContent.pages[slug as keyof typeof storefrontSettings.siteContent.pages] as SiteContentPage | undefined
    ?? pages[slug]
    ?? pages.about
  return (
    <main className="info-page">
      <header><span>{page.eyebrow}</span><h1>{page.title}</h1><p>{page.intro}</p></header>
      <section className="info-sections">
        {page.sections.map((section) => <article key={section.title}><ShieldCheck size={18} /><div><h2>{section.title}</h2><p>{section.body}</p></div></article>)}
      </section>
      <aside>
        <div><Truck size={20} /><span><strong>Need delivery help?</strong><small>Review your latest order or account.</small></span></div>
        <Link to="/account">Visit your account <ArrowRight size={15} /></Link>
      </aside>
      {slug === 'faqs' && <Link className="info-help-link" to="/contact"><HelpCircle size={16} /> Contact customer care</Link>}
    </main>
  )
}
