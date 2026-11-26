# Grovia Mart testing guide

This guide covers the Laravel API, React storefront, admin order tracking, delivery
scheduling, and the limits of the current local preview.

## Automated checks

Run from the project directories:

```powershell
cd backend
php artisan test

cd ..\grovia-mart
$env:VITE_API_URL = 'https://api.example.com/api' # replace with the real production API URL
npm.cmd run build
npm.cmd run lint
```

Production builds require `VITE_API_URL` to be set to the real HTTPS Laravel API URL,
ending in `/api`. The build deliberately fails rather than ship a bundle that points
customers' browsers at localhost.

The Laravel feature suite covers order pricing, cost snapshots, stock and refund returns,
idempotency, configurable COD limits, editable site content and validation, delivery-zone
validation, recurring all-day and timed slots, lead time, same-day cutoffs, capacity, slot
administration, finance metrics, searchable admin lists, delivery-location validation,
assistant privacy/provider failures, staff permissions, and catalog behavior. The frontend
build runs TypeScript checks before Vite.

Latest verification:

- **Laravel:** 43 tests / 551 assertions pass, including the complete loyalty workflow,
  checkout claims, configurable COD enforcement, site-content validation, refund/reversal
  and later-point-lot consistency, referral rewards, expiration, and Admin authorization.
- **Frontend:** the production build passes when `VITE_API_URL` is set to an HTTPS API
  ending in `/api`; the build without it fails intentionally. `npm.cmd run lint` completes
  with four existing warnings in `App.tsx`, `ShopPage.tsx`, `Toast.tsx`, and
  `MotionReveal.tsx`.
- **Formatting:** Pint passes for the changed storefront-settings controller, API routes,
  and commerce workflow tests.
- **Build output:** the ignored local `dist` bundle was built with the placeholder
  `https://example.com/api` for validation. Do not deploy it; regenerate with the real
  production `VITE_API_URL`.
- **HTTP smoke checks:** the public products, categories, homepage, storefront settings
  (`/api/site-content`), product detail/reviews, and delivery endpoints respond
  successfully; unauthenticated profile/admin endpoints correctly return 401. Frontend
  routes return the SPA document. These checks do not exercise React rendering or
  authenticated Admin interactions.
- **Browser:** the storefront loaded with the supplied Grovia wordmark, the `/delivery`
  page rendered its editable delivery information, and the authenticated Admin site editor
  loaded its homepage/brand/page tabs. Editing a headline updated the unsaved draft preview;
  the page was reloaded without publishing, so no store content was changed. The mobile
  editor tabs scroll independently. Checkout threshold behavior and invoice wording are
  covered by the feature test/source checks; an authenticated customer checkout was not
  completed in the browser.
- **Local data snapshot (25 November 2026):** 4,285 products and 58 categories are
  published. One active delivery zone and one timed slot are configured; the slot was
  available for November 28 through December 1 during the check. Local inventory changed
  during verification, so re-check availability before placing a real order. The database
  contains a local order; invoice download was not exercised.

The customer storefront reads only the Laravel catalog and does not substitute a preview
catalog.

## Local browser smoke test

Start the API and frontend using the setup commands in [README.md](./README.md). Open
`http://localhost:5173/admin` directly and sign in with a staff account provisioned in the
local workspace database. Local demo credentials are intentionally not included in this
guide or source control. For a fresh database, create a staff account with
`php artisan grovia:make-admin admin@example.com`; choose a unique password and never
reuse development credentials in production.

When there is approved active catalog and delivery configuration:

1. As staff, create an active product with a cost price, stock quantity, and low-stock
   threshold. Configure a serviceable delivery zone and add a recurring 24/7 all-day slot.
   No date is configured in Admin; customer dates are selected at checkout. Also test a
   timed slot with a 0–7 day lead time and optional per-date capacity.
2. In Admin → Products, search by name, brand, category, or SKU and filter by category,
   visibility, and stock state. Change the row count to 10, 30, 50, 100, 300, 500, and
   All. Verify out-of-stock items have a visible stock label.
   In Admin → Categories, create a category with a JPG, PNG, or WebP image and verify its
   preview and table thumbnail. Edit it without selecting a replacement to confirm the
   saved image remains; invalid files should show a validation error.
3. As a customer, use the storefront search for a product name, brand, category, or SKU.
   Confirm out-of-stock products remain visible by default, are labeled unavailable, and
   cannot be added to the basket. In Shop filters, toggle **In stock**, **On offer**, and
   **Organic** individually and together; verify each control updates the results and URL,
   the active count/reset control stays in sync, and changing filters returns to page 1.
4. Choose a serviceable address and a date within the next 30 days. Confirm checkout shows
   every active slot, including unavailable/full slots with the reason, and that the
   all-day slot is selectable at any time subject to lead time and capacity.
5. Fill a capacity-limited slot, confirm it becomes unavailable, cancel/refund an order,
   then confirm capacity is released. Submit an order after a slot fills in another
   session and verify the server rejects it.
6. Try to create a duplicate slot label and to rename or delete a slot with an upcoming
   order. Confirm Admin rejects these changes; deactivate the old slot and create a new
   one if its delivery window must change.
7. Optionally select **Share my current location** and grant browser permission. Verify
   the pin is attached to the order and visible in order details; manual address entry
   must still work when location permission is denied.
8. Place an order below the configured COD limit, download its invoice PDF from customer
   order details, and verify its items, totals, delivery details, order number, and the full
   payment label **Cash on Delivery**.
9. In Admin → Orders, filter by status and open tracking details. Verify the numbered
   progress steps read Order received, Confirmed, Being prepared, Ready for delivery,
   Out for delivery, and Done, with no number repeated in a label. Advance the order
   through valid transitions, save a customer-visible note without changing the current
   status, and mark it Done (delivered). Verify the customer sees the update and Done,
   and Admin can download the same invoice.
   Check Overview revenue, gross profit, refunds, and stock alerts against the test data.
10. In Admin → Loyalty (super admin only), create and edit earning rules, rewards, tiers,
    and campaigns. Confirm inactive, scheduled, and out-of-stock rewards are unavailable
    to customers. Adjust a customer’s balance with a required reason and verify the
    transaction appears in the loyalty ledger.
11. As a customer, verify delivered orders earn points once, redeem a discount and a free
    product, then apply each claim at checkout. Confirm claim ownership, coupon
    exclusivity, free-product stock, and the final total are verified by the server.
    Register a second customer with a referral code, complete a qualifying delivered
    order, and confirm both accounts receive the configured points. Refund the order and
    verify only unspent points from that order/referral are reversed, later-earned points
    remain spendable, and repeated status updates do not duplicate ledger entries.
12. Search in every Admin list, including Reviews, and verify its independent row-count
    selector offers 10, 30, 50, 100, 300, 500, and All. Changing the size should return
    to page 1; All should show every matching row, and review search should include rows
    beyond the first page.
13. Open **Ask Grovia**, test product and delivery questions, verify product suggestions
    link to the catalog, and confirm the privacy notice is visible. Do not send real
    customer details during manual tests.
14. Check the footer phone link and WhatsApp support link use `+92 308 792 3041`.
15. Check storefront and Admin at mobile, tablet, and desktop widths; test keyboard focus
    and reduced-motion preferences.
16. In Admin → Site editor, edit homepage copy, toggle section visibility, reorder sections,
    change brand colors/logo path and edit an information page. Confirm the draft preview
    updates before publishing and the saved content appears on the storefront afterward.
17. In Admin → Settings, change the maximum COD order total. Confirm checkout displays the
    current cap, blocks an estimated over-limit basket when no reward can lower it, and the
    Laravel API rejects a final server-calculated total above the cap. No online payment
    provider is available as a fallback.

## Shopping assistant and provider privacy

- The backend reads `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, and
  `OPENROUTER_DEFAULT_MODEL` from `backend/.env`. The current model is configured from
  the local Manage Core environment. Keep the key server-side; never add it to a `VITE_*`
  variable, frontend source, logs, or documentation.
- Automated tests use `Http::fake()` and make no provider calls. A single generic,
  privacy-safe local smoke test returned HTTP 503. Recent server logs show OpenRouter 429
  rate-limit responses and provider connection failures; the Laravel endpoint now reports
  rate-limit failures explicitly without returning a fake assistant reply. Review provider
  quota/model availability and network access before treating live AI as production-ready.
- The widget does not persist conversations. It sends the current question and a small,
  in-memory conversation window to Laravel; obvious order/contact/address identifiers
  are blocked or excluded before the provider request. Customers are told not to share
  phone numbers, order references, exact addresses, or payment details. Replies are
  prompt/context grounded, not fine-tuned model training.

## Location, tracking, and privacy boundaries

- Device location is requested only after an explicit customer click. The customer may
  continue with a typed street address if they decline or the browser cannot provide GPS.
- Coordinates are saved on the order as a destination pin and are visible only through
  authenticated order access. Opening the map link sends the coordinates to the selected
  external map provider.
- Order tracking is the persisted order-status timeline maintained by authorized staff.
  **Live courier GPS tracking is not implemented** because no courier app or location
  feed is connected.
- Delivery slots are public-date availability estimates, refreshed during checkout. The
  server rechecks lead time, configured window, and capacity inside the order transaction;
  that final check is authoritative. Admin schedules recur every day and can include a
  24/7 all-day slot; customers still choose the delivery date. Checkout displays all
  active slots, including unavailable ones and their reasons.
- Delivered orders record product cost at sale time. Revenue counts delivered orders;
  full refunds are reported separately and restock the returned order items. Gross profit
  is product revenue after order discounts less recorded product costs; it excludes
  delivery fees and operating expenses. It is withheld when sold items lack cost snapshots.
- Customer and Admin order details can download an invoice PDF. Partial refunds, payment
  gateway settlement, tax invoices, and expense-based net profit are not implemented.
- The frontend and Laravel support COD only. Online payment gateways, automated SMS/email
  delivery notices, and reverse geocoding require provider setup and integration.

## Current local-preview limitations

The imported catalog is published at the user's direction; source prices still need Grovia
review and products without cached photos use a placeholder. Local delivery and inventory
are managed data and can change. A successful real checkout was not attempted during this
verification to avoid creating or consuming a live local order/slot; the automated suite
uses isolated test databases to verify order creation and tracking.

Before deploying the new nullable delivery-coordinate columns, back up the target MySQL
database and run the normal `php artisan migrate` flow in a staging environment first.
Never use `migrate:fresh` on a database containing data.
