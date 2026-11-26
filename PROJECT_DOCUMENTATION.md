# Grovia Mart — Master Project Documentation

> **Brand:** Grovia Mart  
> **Tagline:** Freshness at Your Fingertips  
> **Brand subline:** Fresh Groceries · Better Living  
> **Market:** Pakistan · PKR  
> **Status:** Core storefront, Laravel commerce API, and role-aware admin workflows are
> implemented. Fresh SQLite migrations and focused commerce tests pass. Production
> inventory, MySQL deployment, mail/payment credentials, and browser-based API QA remain.

## 0. Reference review and design decisions

The supplied local references were inspected before changing application code:

### Manage Core

- The marketing-site documentation describes shared design tokens and primitives,
  reusable page patterns, and data modules that keep presentation separate from
  content. The React projects also use a small API module rather than placing raw
  network calls throughout page components.
- The Laravel application groups routes by domain and places authentication and
  customer-data isolation in middleware. Those are useful organizational patterns for
  Grovia's API, provided they are implemented with least privilege and tested policies.
- **Applied to Grovia:** keep brand tokens and reusable storefront components central;
  pass typed data into page sections; use one typed API client; separate route handling,
  validation, authorization and transaction-heavy order logic.
- **Not copied:** Manage Core's ERP/CRM workflows, source code, brand styling or content.

### Ghulam Muhayuddin

- The React portfolio uses focused motion utilities for split-word headings, reveals,
  scroll state and counters, and it explicitly opts out of smooth-scroll behavior when
  reduced motion is requested.
- Its layout also handles route changes and mobile-menu focus/keyboard behavior as
  product functionality rather than purely visual polish.
- **Applied to Grovia:** choreographed but brief entrance/reveal motion, reduced-motion
  fallbacks, route-aware state cleanup, and accessible keyboard-operated navigation.
  Grocery browsing keeps native scrolling; no smooth-scroll dependency or custom cursor
  is required.
- **Not copied:** portfolio content, visual assets, code or personal-brand styling.

### Grocery storefront references

- The saved Groceries Mart Shopify storefront and Orfarm pages emphasize rapid category
  discovery, prominent seasonal/promotional merchandising, scannable product cards, and
  direct paths from product discovery to cart and checkout.
- **Applied to Grovia:** design the homepage as a useful storefront (not a generic
  animation landing page), make product information and add-to-cart actions legible, and
  keep category, search, cart and delivery cues easy to find on mobile.
- **Not copied:** competitor HTML/CSS/JavaScript, logos, product copy, hosted imagery or
  other proprietary assets. Use Grovia-owned or licensed assets.

### Main product website assortment review

- The local Sana Pakistan reference was reviewed for grocery assortment breadth. Its
  category structure covers snacks, chocolates, cold drinks, pulses, breakfast, canned
  goods, frozen foods, cooking staples and other everyday departments in addition to
  produce, bakery and dairy.
- **Applied to Grovia:** the Laravel catalog has a repeatable importer for the locally
  mirrored product pages and their locally cached, rights-cleared images. The user
  confirmed that Grovia owns or has licenses for these catalog assets. Imported products
  defaulted to hidden with zero stock. At the user's direction, all 4,285 were subsequently
  published using source-site prices; those prices still need Grovia's independent review.
  Stock was set to zero during publication, then a later Admin edit added inventory to
  CHICKEN WINGS MARINTATED 1KG. Its quantity is Admin-managed and changed during verification.
- **Import boundary:** photos referenced only through Sana's `/api/catalogue-media`
  endpoint are not present in the local archive and are not fetched. The importer reports
  those missing images so they can be supplied through Grovia's licensed asset export or
  the admin image uploader. Sana's branding, storefront code, and visual design are not
  copied.
- **Verified local catalog:** 4,285 products and 58 categories are present in the local
  SQLite database. All products and categories are active. The public API returns all
  4,285 products and 58 categories; 4,284 products have zero stock, while one later
  Admin edit gave CHICKEN WINGS MARINTATED 1KG nonzero inventory.
  There are 1,296 product image records and 1,122 stored image files (~1.09 GB). The
  other 2,989 products use the Grovia placeholder until their licensed photos are supplied.
  One stored JPEG was confirmed to return HTTP 200 from Laravel's public storage route.
  These local database and storage files still need to be transferred and verified for
  production.
- **Public-store analysis:** Sana's live storefront is search-first with popular-search
  shortcuts, category discovery, sorting, a persistent basket, and delivery-coverage/slot
  checks at checkout. The public account page presents WhatsApp support rather than a
  customer sign-in flow; guest checkout and cash on delivery are highlighted. Online
  ordering was temporarily unavailable during review, and private staff/admin workflows
  were not accessed.

### Grovia art direction

The references are guidance, not a template. Grovia's own signature remains an editorial
Pakistani market: warm paper/cream, forest green, restrained citrus accents, authentic
produce photography, confident type, visible freshness/delivery proof, and a compact
motion language. Visual hierarchy and reliable shopping behavior take priority over
parallax, 3D or constant animation.

### Grovia storefront asset inventory

Static app assets are served locally from `grovia-mart/public`; the preview artwork does
not require a remote product-image CDN.

- **Brand mark used in the UI:** `assets/brand/grovia-mark.svg`.
- **Editorial/homepage imagery used:** `assets/editorial/market-basket.jpg`,
  `market-hero.jpg`, `market-tall-1.jpg`, `market-tall-2.jpg`, `market-wide-1.jpg`,
  `market-wide-2.jpg`, and `newsletter.jpg`.
- **Product and department preview imagery used:** `assets/products/asparagus.jpg`,
  `bottled-drink.svg`, `bread.jpg`, `canned-goods.svg`, `capsicum.jpg`, `carrots.jpg`,
  `cauliflower.jpg`, `cherries.jpg`, `chicken.jpg`, `chocolate-bar.svg`, `coconut.jpg`,
  `cookies.jpg`, `coriander.jpg`, `cupcakes.jpg`, `curry-cut.jpg`, `dryfruits.jpg`,
  `eggs.jpg`, `fish.jpg`, `flaxseeds.jpg`, `frozen-food.svg`, `garlic.jpg`,
  `gooseberry.jpg`, `grapes.jpg`, `mushrooms.jpg`, `pantry-bag.svg`, `papaya.jpg`,
  `parsley.jpg`, `peach.jpg`, `pista.jpg`, `pomegranate.jpg`, `potatoes.jpg`,
  `pumpkin.jpg`, `rice.jpg`, `shelf-staples.svg`, `snack-packet.svg`, `strawberries.jpg`,
  `walnuts.jpg`, `watermelon.jpg`, and `zucchini.jpg`.
- **Fallback image:** `/grovia-fresh.svg` is used when a product image is missing or fails
  to load.
- **Bundled but not currently referenced by the UI:** the alternate brand PNGs
  (`grovia-better-living.png`, `grovia-logo-glossy.png`, `grovia-logo-light.png`),
  `assets/editorial/breadcrumb.jpg`, `assets/editorial/market-wide-3.jpg`,
  `/grovia-market.svg`, and `/icons.svg`. The site also includes `/favicon.svg`.
- **Imported catalog photos:** the separate local Sana archive import stores 1,122 files
  under `backend/storage/app/public/products/imported` (~1.09 GB). There are 1,296
  product image records; the 2,989 products without a locally cached source photo use
  the Grovia fallback. These files were copied from the rights-cleared local mirror,
  not fetched from a remote host.

The homepage uses this local artwork for featured-image slides and preview cards. Active
`home_hero` banners managed in Admin replace the fallback slides. Department, product,
and customer-story sections are also responsive touch/keyboard carousels.

---

## 1. Vision

Grovia Mart is a premium Pakistani grocery commerce brand. The website must feel like a
million-dollar retail brand: editorial art direction, flawless typography, fresh produce
photography, calm premium motion and an effortless shopping flow on every device.

The product is two connected applications:

1. **Storefront** — discovery, categories, product detail, wishlist, cart, checkout,
   delivery scheduling, account, orders and content pages.
2. **Operations dashboard** — orders, products, categories, inventory, customers,
   reviews, coupons, banners, delivery zones/slots, staff, settings and audit logs.

The experience target is not "a grocery template". It is a distinctive, warm, modern
market brand: cream paper surfaces, deep forest green, electric lime and citrus orange,
oversized editorial type, generous whitespace and tactile product cards.

---

## 2. Target architecture and current transition state

The selected target is the existing Laravel application in `backend/` as the API and the
React application in `grovia-mart/` as the storefront/admin SPA. The frontend Supabase
runtime has been removed. Core database-backed commerce behavior has focused feature-test
coverage; production MySQL setup and full browser/API integration remain.

```
grovia-mart/ (React 19 + Vite 8 + TypeScript)
        │  fetch (Bearer token)
        ▼
backend/ (Laravel 13 API + SQLite/MySQL)
        │
        └── app/Models, app/Http/Controllers/Api, database/migrations, database/seeders
```

- The frontend has no Supabase client, package, environment variables, or Supabase
  migration files. The React app calls Laravel through the typed API client.
- Current API authentication issues one random bearer token per user and stores only its
  SHA-256 hash. `AuthenticateApi` validates that token; `EnsureStaff` protects admin
  routes and `EnsureSuperAdmin` protects staff-management endpoints. Sanctum and Spatie
  Permission are installed but are not the active auth or permission implementation.
  Token expiry/multi-device sessions and granular staff permissions must be resolved
  before production.
- All money is stored as decimal PKR values and recomputed on the server. The browser
  never decides final prices, discounts or delivery fees.
- Local development may use SQLite; production target is MySQL through backend `.env`.
  Existing overlapping migrations must be reconciled before relying on a fresh install.
- API prefix: `/api`. Frontend env: `VITE_API_URL` (default
  `http://127.0.0.1:8000/api`).

### Repository map (target)

| Area | Path |
|---|---|
| Storefront + admin SPA | `grovia-mart/src` |
| Global design system | `grovia-mart/src/styles/` (tokens, base, components, pages) |
| API client | `grovia-mart/src/lib/api.ts` |
| Auth provider | `grovia-mart/src/auth/` |
| Cart/wishlist/delivery store | `grovia-mart/src/store.ts` |
| Laravel routes | `backend/routes/api.php` |
| Laravel controllers | `backend/app/Http/Controllers/Api` |
| Laravel models | `backend/app/Models` |
| Migrations | `backend/database/migrations` |
| Seeders/factories | `backend/database/seeders`, `backend/database/factories` |
| Brand assets | `grovia-mart/public/assets/brand` |
| Product assets | `grovia-mart/public/assets/products` |

### Current implementation gaps

- The storefront now includes responsive homepage, shop, product detail, wishlist,
  checkout, account, order-detail and information pages. Catalog pages use Laravel data
  only; API failures and empty catalogs show explicit error or empty states.
- Admin can manage the full imported catalog. Customer APIs expose only admin-activated
  products, and public departments require at least one active product. All 4,285
  imported products are currently published at the user's direction with source-site
  prices. Prices need Grovia's review, and 2,989 missing photos still use the Grovia
  placeholder. Inventory remains Admin-managed: 4,284 products are out of stock and the
  later-edited chicken wings product has nonzero stock.
- Homepage social proof now comes only from approved customer reviews. The local preview
  has no fabricated ratings or testimonials, and review counts are not presented as
  verified purchases.
- The Laravel API exposes catalog, auth/password reset, addresses, wishlist, coupons,
  delivery, orders, customer support and role-scoped admin workflows. Core checkout,
  stock, idempotency, role-access and password-reset behavior has focused feature tests.
- Duplicate scaffold migrations have been converted to compatibility no-ops; fresh
  SQLite migrations complete. The current local SQLite schema is migrated. Production
  MySQL still needs backup, environment configuration and deployment verification.
- The operations dashboard includes overview, orders, products, categories, customers,
  reviews, coupons, banners, delivery zones/slots, staff, settings and audit logs. Staff
  sign-in is available directly at `/admin`; each module has a persistent URL.
- Checkout can request a precise device location only after the customer explicitly
  chooses to share it. The optional destination pin is stored on the order; staff can
  open it in a map from the order detail drawer. This is not live courier GPS tracking.
  Delivery slots are recurring daily schedules. Timed slots require a valid Pakistan-time
  window; an all-day slot provides 24/7 availability. Checkout displays all active slots,
  including full or otherwise unavailable slots with reasons, and the customer chooses
  the delivery date. Availability refreshes while checkout is open; order creation
  revalidates it under a slot-row lock. Slot labels are unique, and a slot with upcoming
  orders cannot be renamed, have its window changed, or be deleted; deactivate it and
  create a replacement instead. Cancelled and refunded orders release capacity.
- Active catalog products remain visible to customers when out of stock; product cards
  and detail pages show the stock state and prevent adding unavailable items. Admin
  inventory lists support category, visibility, and stock filters, while the dashboard
  surfaces low-stock and out-of-stock alerts.
- Admin tables support search and independent 10, 30, 50, 100, 300, 500, or All row
  counts. Product search covers name, brand, category, SKU, and descriptions.
- Customer and Admin order details download invoice PDFs containing the order number,
  items, delivery details, and totals. Delivered orders snapshot product cost for finance
  reporting. Revenue counts delivered orders; full refunds are reported and restore the
  order's stock. Gross profit is merchandise revenue after discount less recorded cost
  (excluding delivery fees and operating expenses); it is withheld when costs are missing.
  Partial refunds, tax invoices, and expense-based net profit are not implemented.
- The storefront shopping assistant is powered server-side by OpenRouter and grounded in
  matching active products plus active public delivery zones. It cannot access customer
  accounts, orders, locations or payment details. Chat is not persisted, common private
  identifiers are blocked or excluded from provider history, and the widget warns
  customers not to share sensitive information. This is prompt/context grounding, not
  fine-tuning. The provider key stays in backend `.env`; never use a `VITE_*` key or
  expose provider credentials to React.
- Staff order details include customer contact, address, selected date/slot, items,
  delivery instructions, status history, and customer-visible status notes. Customers
  can open the same status history from the order confirmation link and order account page.
- WhatsApp support links use the supplied Grovia number, `+92 308 792 3041`. Button
  feedback uses brief lift/press motion and visible keyboard focus; global reduced-motion
  rules continue to disable transitions for customers who request it.
- Homepage carousels cover hero imagery, departments, product collections and customer
  stories with touch and keyboard controls. Hero autoplay pauses on hover, stops after
  interaction and is disabled for reduced-motion preferences.
- Laravel feature tests cover assistant provider behavior with HTTP fakes (no live model
  request), catalog grounding/privacy, timed and all-day slots, lead time, same-day cutoff,
  per-date capacity, refund restocking, cost-based profit/refund metrics, stock alerts,
  searchable admin lists, duplicate slot labels, booked-window protection, and
  server-side order revalidation.
  See `TESTING.md` for current run counts and manual smoke checks; live OpenRouter calls
  are not used in automated tests.
- Full authenticated checkout testing requires approved active products plus configured
  delivery zones and slots; the current local database has no active delivery zones/slots.
  Live courier GPS, geocoding, online payment, outbound notifications, and production
  database/deployment checks remain unintegrated.
- Some generated generic API controllers and advanced inventory/payment/notification
  scaffolds remain outside the verified core. Do not advertise purchasing, online
  payments, automated refunds or notifications as complete.

---

## 3. Brand system

### 3.1 Palette (blended from the master brief + logo guide)

| Token | Value | Usage |
|---|---|---|
| `--ink` | `#0A1F15` | Primary text, dark sections |
| `--forest` | `#0B3A27` | Deep brand surface |
| `--green` | `#16834A` | Primary action, links |
| `--green-bright` | `#16A34A` | Hover/positive states |
| `--lime` | `#A5F21B` | Signature highlight, badges, focus |
| `--lime-soft` | `#D7F5A8` | Tinted panels |
| `--orange` | `#FF7900` | "Mart" accent, offers, cart CTA |
| `--cream` | `#F7F4EC` | Page background |
| `--paper` | `#FFFDF8` | Cards, surfaces |
| `--sand` | `#EDE7D9` | Borders, subtle fills |
| `--muted` | `#66756B` | Secondary text |
| `--white` | `#FFFFFF` | High-contrast surfaces |
| `--danger` | `#C43D2E` | Errors, destructive actions |

Derived tints use `color-mix(in srgb, …)` so borders, glows and hover states stay
consistent without hardcoding dozens of colors.

### 3.2 Typography

| Role | Font | Notes |
|---|---|---|
| Display / headings | **Plus Jakarta Sans** (600–800) | Tight negative tracking, editorial scale |
| Body / UI | **Inter** (400–600) | 16px base, comfortable line height |
| Editorial accent | **Instrument Serif** italic | Short emotional lines only |
| Wordmark / labels | **Montserrat** (600–800) | Logo lockup and uppercase micro labels |

Fluid scale:
`--fs-hero: clamp(3rem, 6.2vw, 6.4rem)`, `--fs-h2: clamp(2rem, 3.6vw, 3.5rem)`,
`--fs-h3: clamp(1.25rem, 1.8vw, 1.75rem)`, `--fs-body: 1rem`, `--fs-small: .875rem`,
`--fs-micro: .6875rem`.

### 3.3 Logo

- Primary lockup: leaf/cart monogram + "Grovia" in deep green + "Mart" in orange.
- Provide light (cream/white) and dark (forest) variants as SVG where possible.
- Source PNGs are archived in `grovia-mart/public/assets/brand/`.
- Never stretch, recolor individual letters or place the wordmark on busy photography
  without a scrim.

### 3.4 Voice

- Warm, confident, precise. Short sentences. No discount-store shouting.
- Specific claims only: "Picked this morning", "Delivered in your chosen slot",
  "Free delivery over Rs. 2,500".
- Micro labels use uppercase letter-spaced type: `FARM TO DOOR`, `TODAY'S HARVEST`,
  `ORGANIC / LOT 042`.

---

## 4. Design language

### 4.1 Principles

1. **Editorial first.** Every section has a clear hierarchy: eyebrow, headline, support
   copy, action. Large type, controlled measure, generous spacing.
2. **Fresh, not green-washed.** Cream canvas + forest anchors + lime/citrus accents.
   Green is a brand signal, not a background for everything.
3. **Photography-led.** Real produce imagery, soft neutral backdrops, consistent aspect
   ratios, subtle zoom on hover.
4. **Tactile micro-interactions.** Cards lift, images breathe, hearts pop, buttons sheen.
   Motion is short (180–550 ms) and always purposeful.
5. **Mobile is the primary store.** 2-column product grids, thumb-friendly controls,
   bottom-safe drawers, no hover-only affordances.
6. **Trust is visible.** Delivery promise, freshness standard, secure checkout, easy
   returns and real contact details near every decision point.

### 4.2 Signature moments

- Hero: split-word headline reveal, floating produce art, "harvested today" glass chip,
  subtle parallax and pointer glow.
- Category bento: uneven grid, large produce tiles, hover lift and image zoom.
- Product cards: image-first, badge chips, rating, quick add, wishlist heart, quick view.
- Offers: citrus-orange deal panel with countdown and coupon chip.
- Brand story: asymmetric editorial split with serif accent and process timeline.
- Marquee: `LOCAL · SEASONAL · TRACEABLE · SAME-DAY` between major sections.
- Footer: oversized wordmark with gradient sweep, rich sitemap, newsletter, payment row.

### 4.3 Page composition

**Homepage:** announcement → header → hero → trust strip → category bento →
today's harvest product rail → offers/countdown → brand story → process timeline →
testimonials → journal/recipes → newsletter → footer.

**Shop:** editorial page header → category chips → filter sidebar/drawer →
toolbar (count, sort, view) → product grid → load more → empty/error states.

**Product detail:** breadcrumb → gallery + sticky buy panel → benefits → tabs
(description, nutrition, delivery, reviews) → related products → recently viewed.

**Checkout:** progress rail → contact → delivery address and service-area check →
Pakistan-local date (today to 30 days) and refreshed slot/capacity state → COD review →
order confirmation and tracking.

**Account:** profile, addresses, orders, order detail timeline, wishlist, security.

**Admin:** fixed sidebar with grouped navigation → top bar (search, notifications,
profile) → dashboard KPI cards + charts → resource tables with filters, pagination,
confirmation dialogs and toasts.

---

## 5. Information architecture

| Route | Page |
|---|---|
| `/` | Homepage |
| `/shop` | Shop with filters, search, sort, pagination |
| `/product/:slug` | Product detail |
| `/checkout` | Multi-step checkout |
| `/checkout/success/:orderNumber` | Order confirmation |
| `/account` | Auth or account overview |
| `/account/orders/:id` | Order detail + timeline + cancel |
| `/wishlist` | Wishlist |
| `/about`, `/contact`, `/faqs`, `/privacy`, `/terms`, `/returns` | Content pages |
| `/admin` | Dashboard |
| `/admin/orders` | Order management |
| `/admin/products` | Product management |
| `/admin/categories` | Category management |
| `/admin/customers` | Customer directory |
| `/admin/reviews` | Review moderation |
| `/admin/coupons` | Coupons |
| `/admin/banners` | Banners/promotions |
| `/admin/delivery` | Delivery zones and slots |
| `/admin/staff` | Staff and roles |
| `/admin/settings` | Site settings |
| `*` | 404 |

---

## 6. API contract

Base: `VITE_API_URL`, default `http://127.0.0.1:8000/api`.
Auth: `Authorization: Bearer <token>`; errors return
`{ message, errors?: { field: [messages] } }` with proper HTTP status.

### 6.1 Auth

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/auth/register` | `name, email, password, password_confirmation, phone?` | `{ user, token }` |
| POST | `/auth/login` | `email, password` | `{ user, token }` |
| POST | `/auth/logout` | — | `{ message }` |
| GET | `/auth/me` | — | `{ user }` |
| PUT | `/auth/profile` | `name, phone?` | `{ user }` |
| PUT | `/auth/password` | `current_password, password, password_confirmation` | `{ message }` |
| POST | `/auth/forgot-password` | `email` | `{ message }` |

User shape:
`{ id, name, email, phone, role, isActive, createdAt }`. Roles:
`customer, super_admin, store_admin, product_manager, inventory_manager,
order_manager, delivery_manager, accountant, customer_support`.

### 6.2 Catalog (public)

| Method | Path | Query | Returns |
|---|---|---|---|
| GET | `/home` | — | `{ categories, seasonal, bestsellers, offers, banners, testimonials, stats }` |
| GET | `/categories` | — | `{ data: Category[] }` |
| GET | `/products` | `q, category, brand, min_price, max_price, in_stock, organic, discount, sort, per_page, page` | `{ data: Product[], meta }` |
| GET | `/products/{slug}` | — | `{ product, related, reviews }` |
| GET | `/products/{slug}/reviews` | — | `{ data: Review[] }` |
| POST | `/products/{slug}/reviews` (auth) | `rating, title?, comment` | `{ review }` |
| POST | `/coupons/validate` | `code, subtotal` | `{ valid, code, type, value, discount, message }` |
| POST | `/newsletter` | `email` | `{ message }` |

Product shape:

```json
{
  "id": 1,
  "name": "Sindhri Mangoes",
  "slug": "sindhri-mangoes",
  "description": "…",
  "shortDescription": "…",
  "brand": "Grovia Farms",
  "category": { "id": 2, "name": "Fresh Fruits", "slug": "fresh-fruits" },
  "price": 420,
  "comparePrice": 480,
  "unit": "1 kg",
  "sku": "GRV-FRU-001",
  "stockQuantity": 40,
  "inStock": true,
  "isFeatured": true,
  "isOrganic": true,
  "badge": "20% OFF",
  "rating": 4.8,
  "reviewCount": 24,
  "image": "/assets/products/mango.jpg",
  "gallery": ["/assets/products/mango.jpg"],
  "accent": "#F4E4B8",
  "createdAt": "2026-11-24T…"
}
```

Sort values: `featured, newest, price_asc, price_desc, rating, name_asc`.

### 6.3 Wishlist (auth)

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/wishlist` | — | `{ productIds, products }` |
| POST | `/wishlist` | `product_id` | `{ productIds }` |
| DELETE | `/wishlist/{productId}` | — | `{ productIds }` |

### 6.4 Addresses (auth)

`GET /addresses` · `POST /addresses` · `PUT /addresses/{id}` · `DELETE /addresses/{id}`

Body: `label, recipient_name, phone, address_line, city, area, postal_code?, is_default?`.

### 6.5 Orders (auth)

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/orders` | `items[{product_id, quantity}], address_id? or address{…}, delivery_date, delivery_slot, payment_method:"cod", notes?, client_order_id` | `{ order }` |
| GET | `/orders` | — | `{ data: OrderSummary[] }` |
| GET | `/orders/{id}` | — | `{ order }` |
| POST | `/orders/{id}/cancel` | — | `{ order }` |

Server rules:
- Require authentication.
- Validate 1–50 lines, quantity 1–20, address completeness, delivery date within 30 days,
  valid slot.
- Lock product rows, read current prices, reject inactive/out-of-stock items.
- Decrement stock transactionally.
- Delivery fee: free at subtotal ≥ 2,500 PKR, otherwise 180 PKR.
- Optionally apply a validated coupon.
- Idempotent by `(user_id, client_order_id)`.
- Cancellation allowed for `pending` / `confirmed`; restores stock and writes history.

Order statuses:
`pending → confirmed → processing → ready_for_dispatch → out_for_delivery → delivered`,
plus `cancelled` and `refunded`. In Admin, the delivery steps are labeled **Ready for
delivery**, **Out for delivery**, and **Done**. Staff must advance through the sequence.

### 6.6 Admin (staff roles)

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/dashboard?range=7d` | Delivered revenue, gross profit, refunds, sales series, and stock alerts |
| GET | `/admin/orders` | Searchable, status-filtered/paginated order list (`per_page` 10/30/50/100/300/500/all) |
| PATCH | `/admin/orders/{id}/status` | `{ status, note? }`; supports note-only tracking entries on the current status and restores stock on cancel/refund |
| GET/POST/PUT/DELETE | `/admin/products` | Product CRUD, stock, pricing, pack variants, visibility, featured |
| POST | `/admin/product-images` | Staff-only JPEG, PNG, or WebP upload to Laravel public storage |
| GET/POST/PUT/DELETE | `/admin/categories` | Category CRUD |
| POST | `/admin/category-images` | Staff-only category image upload to Laravel public storage |
| GET | `/admin/customers` | Searchable customer list with delivered-order spend |
| GET/PATCH | `/admin/reviews` | Moderation (`is_approved`) |
| GET/POST/PUT/DELETE | `/admin/coupons` | Coupon CRUD |
| GET/POST/PUT/DELETE | `/admin/banners` | Banner CRUD |
| GET/POST/PUT/DELETE | `/admin/delivery-zones` | Zones, fees, thresholds |
| GET/POST/PUT/DELETE | `/admin/delivery-slots` | Slot definitions |
| GET/POST/PUT/DELETE | `/admin/staff` | Staff roles and status |
| GET/PUT | `/admin/settings` | Site settings key/value |
| GET | `/admin/audit-logs` | Recent staff actions |

Every admin mutation writes an audit log entry.

### 6.7 Response conventions

- Success: `2xx` with `{ data }` or the documented resource.
- Validation: `422` `{ message, errors }`.
- Unauthorized: `401`; forbidden: `403`; missing: `404`.
- Pagination meta: `{ current_page, last_page, per_page, total }`.
- Money is numeric PKR. Dates are ISO 8601 UTC; the UI renders Pakistan time.

---

## 7. Data model

Core tables:

`users` (role, phone, is_active, api_token_hash), `categories`, `brands`, `products`,
`product_images`, `product_variants`, `addresses`, `orders`, `order_items`,
`order_status_history`, `reviews`, `wishlists`, `newsletter_subscribers`, `coupons`,
`coupon_usages`, `banners`, `delivery_zones`, `delivery_slots`, `settings`, `audit_logs`.

Key indexes: products (`slug`, `category_id`, `is_active`, `is_featured`), orders
(`user_id`, `status`, `placed_at`, `client_order_id`), reviews (`product_id`,
`is_approved`), wishlists (`user_id`, `product_id` unique).

---

## 8. Frontend architecture

```
src/
├── auth/            AuthProvider, context, useAuth
├── components/      Header, Footer, ProductCard, ShoppingAssistant, Reveal, Toast,
│                    Modal, StarRating, QuantityStepper, Price, EmptyState, …
├── hooks/           useCatalog, useWishlist, useDebounce, useCountdown, useMediaQuery
├── lib/             api.ts (fetch client), format.ts, constants.ts
├── pages/           HomePage, ShopPage, ProductDetailPage, CheckoutPage, AuthPage,
│                    OrderDetailsPage, WishlistPage, InfoPage, admin/*
├── styles/          tokens.css, base.css, components.css, storefront.css, admin.css
├── store.ts         Zustand: cart, wishlist, delivery, drawer
└── utils/           date.ts, imageFallback.ts
```

- TanStack Query owns server state (catalog, orders, admin lists).
- Zustand owns cart, wishlist IDs, delivery selection and UI drawers, persisted to
  `localStorage`.
- `api.ts` injects the bearer token, normalizes errors and redirects on 401.
- Route-level code splitting for every page; admin is a separate lazy chunk group.
- All images lazy-load below the fold, use `decoding="async"` and fall back to the brand
  produce mark on error.

---

## 9. Motion system (summary)

- Framer Motion for route transitions, split-word hero, scroll reveals, drawer/modal and
  layout transitions.
- CSS for hover, sheen, marquee, badges and ambient art.
- Standard easing `cubic-bezier(.22, 1, .36, 1)`.
- Reveals: `once: true`, stagger 60–80 ms, translate 18–28 px.
- Ambient motion pauses offscreen; hover-only effects disabled on touch.
- `MotionConfig reducedMotion="user"` plus CSS reduced-motion fallbacks.
- No scroll-jacking, no heavy 3D runtime, no animation that blocks checkout.

Full detail in `ANIMATION_SYSTEM.md`.

---

## 10. Build phases & acceptance criteria

**Phase 0 — Foundation (active)**
- Reference review and documentation are updated.
- Laravel API routes are registered; route discovery and baseline tests pass.
- Supabase frontend files/dependency are removed, and the frontend targets Laravel.
- Reconcile duplicate migrations before running any fresh database setup.
- Add database-backed API tests and verify checkout against a safe test database.

**Core phases — implemented; browser verification remains**
- Responsive storefront, account and order workflows with loading/error/empty states.
- API-backed checkout, coupons, delivery availability, customer profiles and order
  cancellation.
- Role-aware admin management for catalog, merchandising, delivery, staff and settings.
- Backend validation, checkout rules and role boundaries covered by focused feature tests.

**Remaining — production hardening and operations**
- Browser-test the storefront/admin against a running API at desktop and mobile sizes.
- Review imported catalog prices, add Grovia's missing licensed product images, set real
  stock/costs, and explicitly publish approved products; no source or demo price should be
  treated as confirmed Grovia inventory.
- Configure and verify MySQL, HTTPS, CORS, mail, backups, monitoring and target cPanel
  PHP compatibility.
- Add merchant integrations only after credentials and signed callbacks are available;
  complete SEO, image optimization, analytics and deployment validation.

Definition of done for any page: responsive, keyboard accessible, real API data, loading
skeleton, empty state, error state, working actions, no console errors, no placeholder
copy, no secrets.

---

## 11. Local development

The frontend can be started with `npm.cmd run dev` from `grovia-mart/`. From `backend/`,
configure `.env`, run `composer install`, then run `php artisan migrate` on the intended
local database and start Laravel with `php artisan serve --host=127.0.0.1 --port=8000`.
The current local SQLite database has been migrated. Do not run `php artisan migrate:fresh`
against a database with data. Set `VITE_API_URL` in `.env.local` to the Laravel API URL.
Create the first staff account using `php artisan grovia:make-admin admin@example.com`;
the interactive command requires a confirmed password of at least 12 characters.

Quality gates:

```powershell
cd backend && vendor\bin\pint --dirty --format agent && php artisan test --compact
cd grovia-mart && npm.cmd run build && npm.cmd run lint
```

---

## 12. Security & operations requirements

- Current implementation uses hashed bearer tokens and staff-role middleware. It is not
  yet production-hardened; define token expiry/revocation and granular staff permissions.
  Never treat client-side role state as authorization.
- Passwords use Laravel's hashed cast; login and password endpoints must be rate limited.
- Admin routes must require narrowly scoped permissions; customers cannot mutate catalog
  or other customers' orders.
- All prices, totals and stock are server-authoritative.
- Validation uses Form Requests; authorization uses middleware/policies.
- CORS limited to configured frontend origins; no wildcard in production.
- Audit logs record staff mutations.
- Secrets stay in `.env`; never in source or the frontend bundle.
- Images are served locally or from an approved CDN; admin uploads are validated.

---

## 13. Verified status after the current implementation pass

| Area | Status |
|---|---|
| Reference analysis | Manage Core, Ghulam Muhayuddin, Groceries Mart and Orfarm inspected; design principles recorded above |
| Documentation | Updated to reflect the selected Laravel architecture and current gaps |
| Laravel API | 70 routes registered; core auth, checkout, stock, order, staff-role, password-reset, and CORS behavior covered by feature tests |
| Database | Duplicate scaffolds are no-op compatibility migrations; fresh SQLite migration and the current local schema both complete |
| Frontend | Editorial storefront and responsive account/checkout/admin pages; production build passes; shop, product, account, checkout-empty and info routes checked at 320px, 390px, 768px and desktop |
| Supabase removal | Frontend dependency, client, environment references, and legacy Supabase SQL files removed |
| Admin | Operations UI covers all registered admin domains, searchable/status-filtered orders with delivery/payment context, category image uploads, searchable tables, product filters, and recurring 24/7 slot setup; production role policy review remains |
| Payments | COD is the intended initial method; online gateways require merchant verification |
| Tests | Laravel: 28 passed, 244 assertions. Production frontend build passes with a configured HTTPS API URL and rejects missing/localhost configuration. Lint reports four pre-existing warnings; full-project `pint --test` reports formatting findings, while changed PHP files pass. Local HTTP smoke checks pass; browser inspection timed out in the latest run. Production MySQL, host-specific environment values, and real checkout remain unverified. |

Last updated: 25 November 2026.
