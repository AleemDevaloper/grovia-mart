# Grovia Mart

Grovia Mart is a React storefront and operations dashboard backed by a Laravel REST API.
The current workspace is still under active completion and is not production-ready.

## Design and engineering direction

The local reference folders were reviewed before implementation:


The resulting design target is warm editorial grocery retail: generous cream surfaces,
forest-green anchors, fresh product photography, confident type, crisp merchandising and
short purposeful interactions. A costly-looking experience should come from consistency,
craft and real operational reliability—not decorative effects or copied templates.

## Current implementation status

| Area | Current state |
|---|---|
| React storefront | Editorial homepage and responsive shop, product, account, checkout, order, and information pages use the shared design system and typed API hooks. |
| Laravel | API routes cover catalog, accounts, checkout, delivery, and admin operations. Delivery slot availability, order location pins, order status transitions, and staff access have database-backed feature tests; live provider integrations are not enabled. |
| Admin dashboard | `/admin` has a staff sign-in screen and deep-linked, role-aware pages for overview, searchable/status-filtered orders with delivery/payment context, order detail/tracking history, products, categories with image uploads, customers, reviews, coupons, banners, delivery zones/slots, staff, settings, and audit logs. |
| Homepage carousels | Swiper powers the featured-image hero, department and product rails, and customer-story cards. Controls support touch, keyboard, reduced-motion preferences, and pause-on-hover autoplay. |
| API integration | The typed client targets Laravel at `VITE_API_URL`. Checkout, order lifecycle, staff access, and password reset have database-backed feature tests. |
| Customer catalog | Customer pages read products and departments from Laravel only. All 4,285 imported products are published at the user's direction; 4,284 are out of stock and CHICKEN WINGS MARINTATED 1KG has nonzero Admin-managed stock. Its quantity changed during verification. Source prices need Grovia review. No demo-product fallback is shown. |
| Supabase removal | Complete in the frontend: client, dependency, environment variables, and legacy Supabase schema files have been removed. |
| Database | Duplicate scaffold migrations are compatibility no-ops; the local SQLite schema migrates successfully. Production MySQL migration still requires backup and deployment verification. |
| Testing | The companion Laravel API suite passes 43 tests / 551 assertions. The frontend TypeScript/Vite production build and Oxlint pass. Local browser smoke checks cover the storefront, Shop, Delivery, Account, responsive layouts, navigation, and cart feedback. |
| Payments | Cash on Delivery is the only intended initial payment option; live online gateways require merchant accounts and verified callbacks. |

The application is not production-ready for real customer orders. Reviewed live catalog
items, delivery zones and slots, database credentials, mail, payment credentials, and
deployment settings still require Grovia approval and production setup. Never run `migrate:fresh`
against a database containing data. Configure and back up the target MySQL database before
applying migrations.

The admin product editor supports category, brand/SKU, selling/compare/cost prices, stock,
low-stock threshold, weight, pack-size variants, visibility, merchandising flags,
descriptions, and image uploads. Catalog archive imports run in Laravel and are idempotent
by product slug. The imported catalog is currently active following the user's approval;
review source prices and missing photos, and manage live stock from Admin. Future imported
departments remain subject to Admin visibility controls.

## Start the frontend for visual work

From this directory:

```powershell
npm.cmd install
npm.cmd run dev
```

The Vite development server normally runs at `http://localhost:5173`. API-backed flows
require the Laravel API at the URL configured in `.env.local`.

For Vercel, set the project root to `grovia-mart`, use `npm run build` with output
directory `dist`, and configure `VITE_API_URL` to the HTTPS Laravel API URL ending in
`/api`. Production builds fail if this variable is missing, points to localhost, or does
not end in `/api`. Copy `.env.production.example` as a reference only; do not deploy its
placeholder URL.

## Start the Laravel API

From `backend/`, configure `.env`, install Composer dependencies, and run migrations
against the intended local database:

```powershell
composer install
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

After migrations, create the first staff account through the interactive command. It
prompts for a password and requires at least 12 characters; no default credential is
stored in the project:

```powershell
php artisan grovia:make-admin admin@example.com
```

Open `http://localhost:5173/admin` while the local Vite and Laravel servers are running.
Create a separate administrator with a unique password for production; development
credentials must not be copied to production or committed to source control.

## Intended stack

- **Frontend:** React, TypeScript, Vite, React Router, TanStack Query, Zustand,
  Framer Motion, Swiper and Lucide.
- **Backend:** Laravel REST API, SQLite for local development and MySQL in production.
  The current API uses hashed first-party bearer tokens and a staff-role middleware;
  token lifecycle and granular permissions still need production hardening.
- **Business rules:** server-authoritative prices, stock, order totals and permissions.
- **Market:** Pakistan; PKR; Asia/Karachi display timezone.

## Documentation

- [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) — product scope, design audit,
  architecture, implementation status and complete static asset inventory.
- [ANIMATION_SYSTEM.md](./ANIMATION_SYSTEM.md) — motion and accessibility standards.
- [TESTING.md](./TESTING.md) — automated checks, browser smoke tests, and operational limits.
- [../backend/README.md](../backend/README.md) — Laravel setup, local database, tests, and
  first-administrator provisioning.

## Production prerequisites

Before deployment, reconcile and test Laravel migrations, verify API resources and
authentication, configure CORS/HTTPS/mail/backups/monitoring, replace demo content, and
validate the target cPanel PHP version. Do not enable card, JazzCash or Easypaisa payments
until merchant credentials and signed provider callbacks are tested.

Set Laravel `APP_ENV=production`, `APP_DEBUG=false`, a fresh `APP_KEY`, the production
MySQL connection, mail settings, `APP_URL`, and exact `CORS_ALLOWED_ORIGINS` for the
deployed storefront. On cPanel, point the web root at `backend/public`, create the Laravel
storage link, and keep `.env` outside the public directory. Back up the target MySQL
database and run `php artisan migrate` in staging before production; never use
`migrate:fresh` on a database containing data.
