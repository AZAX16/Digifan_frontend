# DigiFan Project Handoff

> Last updated: 2026-07-30  
> Purpose: this is the authoritative handoff for developers and coding agents. Read it before changing the project and update it whenever routes, API contracts, mock/real boundaries, deployment behavior, or major TODOs change.

## Current snapshot

- Repository: `https://github.com/AZAX16/Digifan_frontend`
- Production frontend: `https://digifan-frontend.vercel.app`
- Backend: `https://digifan-api.onrender.com`
- Working branch: `feat/category-products`
- Base commit before the current uncommitted storefront work: `75620b0` (`feat(admin): migrate auth to phone and add inventory controls`)
- Both Git remotes, `origin` and `Digifan`, currently point to the same repository.
- The working tree intentionally contains the uncommitted category storefront changes described below.
- Suggested commit message for the current work: `feat(storefront): add category product pages`

The latest supplied OpenAPI document is:

```text
C:\Users\ToosArax\.codex\attachments\9ce5672a-ed7b-4247-8bf5-0b91a0654d77\pasted-text.txt
```

It describes OpenAPI 3.0.1, `DigiFan.Backend.API` version `1.0`. Treat it as the current contract unless the user provides a newer document.

## Product and architecture

DigiFan is an RTL Persian SPA with an authenticated administration area, a public UI-kit showcase, and two public Figma-derived category storefront pages.

Technology:

- React 19
- TypeScript 6
- Vite 8
- Tailwind CSS 4 through `@tailwindcss/vite`
- Vazirmatn variable font
- Lucide React icons
- No React Router; routing is a small manual hash router in `src/App.tsx`
- No global state/query dependency; state is React-local plus module-level auth/profile/query caches
- No automated unit, integration, or E2E test framework yet

Entry flow:

```text
src/main.tsx
  -> src/App.tsx
      -> AuthProvider
      -> public UI Kit, public category storefront, or protected admin page
      -> lazy-loaded route chunks
```

Important directories:

```text
src/api                 HTTP clients, auth/session logic, resource models
src/components/auth     Shared account/profile UI and auth context
src/components/ui       Reusable UI kit
src/pages/admin         Dashboard, moderation, account, support, shell
src/pages/auth          Admin login and conditional 2FA
src/pages/categories    Category manager
src/pages/storefront    Reusable public category storefront and page configuration
src/pages/TestUIKit.tsx Living UI-kit showcase
src/styles/index.css    Tailwind import, tokens, global RTL-friendly styles
src/utils               Class names, Persian digits, phone normalization
src/assets              Persisted Figma-derived assets
public                  Favicon and robots.txt
```

## Routes and access

| Hash route | Access | Implementation state |
|---|---|---|
| `#/admin` | Authenticated | Real API-backed dashboard counts; several visual/business metrics remain derived or placeholder |
| `#/admin/products` | Authenticated | Real product CRUD, filters, moderation, stock controls, and pagination |
| `#/categories` | Authenticated | Real category CRUD and hierarchy filtering |
| `#/admin/support` | Authenticated | Polished but entirely mock/local |
| `#/admin/account` | Authenticated | Real profile, phone change, password change, and logout |
| `#/ui-kit` | Public | Living component showcase; intentionally backend-free |
| `#/category/water-pumps` | Public | Responsive water-pump storefront; public products API with labeled mock fallbacks |
| `#/category/accessories` | Public | Responsive accessories storefront; public products API with labeled mock fallbacks |
| Empty or unknown hash | Protected | Resolves to the admin dashboard/login |

The app uses hash fragments, so Vercel only sees `/`; it cannot distinguish admin and UI-kit routes for server metadata.

## Authentication and account behavior

The latest API migrated admin identity from email to phone number.

Implemented contract:

- `POST /api/auth/admin/login`
  - Body: `{ phoneNumber, password }`
  - Login UI accepts Persian digits, strips common separators, and sends Western digits.
- `POST /api/auth/admin/2fa/request`
  - Body: `{ twoFactorToken }`
- `POST /api/auth/admin/2fa/verify`
  - Body: `{ twoFactorToken, code }`
- `POST /api/auth/admin/refresh`
  - Body: `{ refreshToken }`
- `POST /api/auth/admin/logout`
  - Body: `{ refreshToken }`
- `GET /api/admin/account/profile`
  - Response: `{ id, phoneNumber, isActive }`
- `POST /api/admin/account/change-phone-number`
  - Body: `{ newPhoneNumber }`
- `POST /api/admin/account/change-password`
  - Body: `{ currentPassword, newPassword }`

The removed `/api/admin/account/change-email` endpoint is no longer referenced.

Session design:

- Access token is memory-only.
- Refresh token and refresh expiry are stored in `sessionStorage`.
- Access tokens refresh shortly before expiry.
- An authorized request retries once after a 401 and successful refresh.
- Refresh/profile requests are deduplicated.
- The admin profile is cached and shared through listeners between `AdminShell` and `AdminAccountPanel`.
- Logout clears local auth/profile/query state first, then attempts server revocation.
- Conditional 2FA must remain: the current OpenAPI still contains both 2FA endpoints and `requiresTwoFactor`.

Phone-number behavior:

- `src/utils/phoneNumber.ts` converts Persian/Arabic digits to Western digits for requests.
- It removes spaces, hyphens, and parentheses.
- Current client validation accepts an optional leading `+` and 7–15 digits.
- The backend contract does not document whether canonical values must be `09...`, `+989...`, or something else; backend documentation is still needed.

Admin creation/signup is not available. An administrator must already exist in the backend.

## API coverage

### Shared transport

`src/api/client.ts` provides:

- Same-origin `/api` calls by default
- Optional `VITE_API_BASE_URL`
- JSON request/response handling
- 30-second timeout
- Caller abort forwarding
- Bounded, user-friendly API errors
- HTML/error-body protection

### Categories

`src/api/categories.ts` supports:

- `GET /api/admin/Categories`
- `GET /api/admin/Categories/{id}`
- `POST /api/admin/Categories`
- `PUT /api/admin/Categories/{id}`
- `DELETE /api/admin/Categories/{id}`

Notes:

- The new contract returns the complete category array; it does not provide pagination or a count endpoint.
- Category models now include the backend-generated optional `slug`.
- Lists/details are cached for 60 seconds and invalidated after mutations/logout.
- Category UI supports create, edit, delete, parent filtering, “no parent,” 20-card client pagination, and prevents choosing self/descendants as a parent.

### Brands

`src/api/brands.ts` supports list/detail/create/update/delete helpers.

Notes:

- The OpenAPI still omits the successful response schema for `GET /api/admin/Brands`.
- The client deliberately accepts either an array or a paginated result.
- There is no brand-management page yet; brands are only consumed by product forms/filters and dashboard counts.

### Admin products

`src/api/products.ts` supports:

- `GET /api/admin/products`
- `GET /api/admin/products/{id}`
- `POST /api/admin/products`
- `PUT /api/admin/products/{id}`
- `DELETE /api/admin/products/{id}`
- `POST /api/admin/products/{id}/publish`
- `POST /api/admin/products/{id}/unpublish`
- `POST /api/admin/products/{id}/archive`
- `POST /api/admin/products/{id}/discontinue`
- `POST /api/admin/products/{id}/out-of-stock`
- `PUT /api/admin/products/{id}/inventory`
- `POST /api/admin/products/{id}/duplicate`

Current product statuses:

```text
draft
active
inactive
outOfStock
discontinued
archived
```

The product DTO and create/update bodies now include:

```text
stockQuantity: int32
reorderPoint: int32
```

The moderation page now:

- Displays stock and reorder point
- Highlights stock at/below the reorder point
- Includes quick inventory editing
- Can mark a product out of stock
- Can discontinue production
- Supports list/search/pagination/category/brand/status/sort filters
- Supports create/edit/delete/duplicate/publish/unpublish/archive
- Refetches after mutations so filtered lists and totals remain consistent

The product editor sends inventory values during create/update. Inventory inputs require non-negative int32 values.

### Public storefront products

`src/api/storefrontProducts.ts` is consumed by both category storefront routes:

- `GET /api/storefront/products`
- `GET /api/storefront/products/{slug}`

Supported list query fields:

```text
Page
PageSize
Search
CategorySlug
BrandSlug
MinPrice
MaxPrice
Sort
```

Documented storefront sort values:

```text
NameAscending
NameDescending
PriceAscending
PriceDescending
Newest
Oldest
```

Do not assume the same enum is valid for the admin product endpoint: its `Sort` parameter remains an unconstrained string in OpenAPI.

The pages use the API for product names, summaries, prices, currency, category/brand fields, search, category/brand slug filtering, price filtering, supported sorting, and pagination. Default category slugs are `water-pump` and `accessories`; a test slug can be supplied as `?categorySlug=...` on either hash route.

The live backend check on 2026-07-30 returned one public product under category slug `electronics` and no products for either design slug. Empty/error results therefore render clearly labeled mock cards so the complete Figma layout remains testable without misrepresenting their source.

## Page maturity: real, partial, and mock

### Real

- Phone-based admin login
- Optional 2FA flow
- Session refresh/logout
- Profile retrieval
- Phone-number change
- Password change
- Product listing/filtering/pagination
- Product create/edit/delete/duplicate
- Product publication/status actions
- Product inventory and reorder point editing
- Category CRUD and hierarchy management
- UI-kit components and showcase
- Public storefront product search/filter/supported sort/pagination when matching backend products exist

### Partial or locally derived

- Dashboard product/category/brand totals are real.
- Dashboard chart is derived from product-status totals, not sales history.
- Dashboard notices are local text, not notifications from the backend.
- “مدیریت موجودی” and “کنترل قیمت” navigation both lead to the products screen.
- Inventory has usable per-product controls, but no stock history, adjustment ledger, or bulk workflow.
- Price editing works per product, but there is no dedicated price-control, history, or bulk-pricing page.
- Brand API helpers exist without a brand-management page.
- Storefront category pages are real API-backed for fields/endpoints the contract exposes and fall back to explicitly labeled demo cards when a category is empty or unavailable.
- Storefront brand choices are derived from the current API page because no public brand-list endpoint exists.
- `Popular` sorting is intentionally marked demo-only because the backend exposes no popularity/rating sort.

### Mock

- Support ticket data, search, filters, selection, and replies
- Dashboard sales/revenue/orders/support/announcement business data
- Notification bell (disabled)
- Storefront hero copy/images, subcategory taxonomy, product imagery, ratings, new/discount badges, cart actions, technical filters, promotional banner, brand artwork, service claims, and footer contact content

## UI kit and design rules

The UI was derived from the DigiFan Figma file:

```text
https://www.figma.com/design/BBn6YkaR7hyifBC1dqrmrO/DigiFan
```

Relevant admin reference previously used: node `214-960`.

Rules for future UI work:

- Use Vazirmatn throughout.
- Preserve `dir="rtl"` and Persian copy.
- Reuse `src/components/ui` before introducing one-off controls.
- Export reusable components through `src/components/ui/index.ts`.
- Demonstrate material new component variants on `src/pages/TestUIKit.tsx`.
- Inputs normalize compatible typed digits to Persian by default.
- Convert numeric/phone request values back to Western digits before API calls.
- Keep desktop sidebar and mobile bottom navigation behavior.
- Maintain visible keyboard focus and reduced-motion support.

Current UI components include:

```text
Alert, Badge, Button, Checkbox, Chevron, Chip, Countdown,
DiscountProductCard, Dropdown, Field/Input/Textarea/Select,
FilterAccordion, Footer, Icon, IconButton, Pagination,
PriceRange, ProductCard, Rating, Skeleton, SortBar, Surface, Switch
```

## Performance safeguards

- Admin pages and UI Kit are lazy-loaded as separate route chunks.
- Only the requested protected route is prefetched during session restoration.
- Eager login/app imports avoid pulling UI-kit-only components into the entry bundle.
- Category and brand requests use short-lived in-memory caching and request deduplication.
- Shared cache entries are bounded, abort-aware, invalidated after mutations, and cleared on logout.
- Multi-page brand fetching is limited to four concurrent requests.
- Category cards use client pagination to reduce DOM work.
- Dropdown menus have a bounded, scrollable height.
- Dashboard uses `Promise.allSettled` so partial data can render when one request fails.
- Product lists use server pagination.
- The public category route is lazy-loaded as its own chunk.
- Storefront images use lazy decoding/loading except the LCP hero image.
- Generated transparent hero assets are resized alpha WebP files: water pump ~160 kB and pressure tank ~41 kB.
- Storefront API requests are abortable and stale requests are cancelled when filters change.
- Vite’s content-hashed assets receive one-year immutable caching on Vercel.
- Authenticated `/api` responses are configured as private/no-store.

Latest verified production build after the category storefront work:

```text
entry JS:                 214.15 kB raw / 68.22 kB gzip
CSS:                       63.97 kB raw / 12.46 kB gzip
category storefront:      32.17 kB raw / 10.11 kB gzip
water-pump hero asset:   159.91 kB
pressure-tank asset:      41.30 kB
```

Remaining performance bottlenecks:

- Dashboard requires six API requests because no aggregate endpoint exists.
- Category count requires downloading the complete category list.
- Very large category sets are still kept fully in memory for hierarchy editing.
- Backend cold starts/network failures have historically produced slow responses and 502 errors.

## SEO and indexing

The current deployment is an authenticated admin SPA plus UI Kit, so the entire origin is intentionally non-indexable:

- HTML meta robots: `noindex, nofollow, noarchive, nosnippet`
- Vercel `X-Robots-Tag` catch-all with the same policy
- `robots.txt` disallows `/api/` but does not block the HTML from being crawled and observing `noindex`
- Browser titles change per hash route
- Persian `lang`, `dir`, description, theme metadata, and favicon are present

When a real public storefront is added:

1. Do not use hash routes for indexable products/categories.
2. Use real paths such as `/products/{slug}` and `/categories/{slug}`.
3. Prefer SSR, SSG, or prerendering for public pages.
4. Narrow the catch-all `noindex` to only admin/login/UI-kit pages.
5. Add public canonical metadata, sitemap, crawlable links, JSON-LD, and real 404 responses.

## Local development and deployment

Install and validate:

```bash
npm install
npm run dev
npm run lint
npm run lint:fix
npm run typecheck
npm run build
npm run check
npm run preview
```

`npm run check` runs ESLint, both TypeScript projects, and the Vite production build.

Environment template:

```text
.env.example
```

Variables:

```text
VITE_API_BASE_URL
VITE_DEV_API_PROXY_TARGET
VITE_DEV_API_PROXY_USE_ENV
HTTP_PROXY
HTTPS_PROXY
NO_PROXY
```

Behavior:

- Empty `VITE_API_BASE_URL` uses same-origin `/api`.
- Local Vite proxies `/api` to `https://digifan-api.onrender.com`.
- `VITE_DEV_API_PROXY_TARGET` overrides the local target.
- If direct Render access fails locally, the existing `.env.example` suggests using `https://digifan-frontend.vercel.app` so local requests pass through the working production rewrite.
- Vercel rewrites `/api/:path*` to Render.
- Never commit `.env.local` or `.env.development.local`; they may contain machine-specific proxy settings.

Vercel headers:

- `/assets/*`: `public, max-age=31536000, immutable`
- `/api/*`: `private, no-store, max-age=0`
- Site-wide: noindex, `nosniff`, strict-origin referrer policy, and disabled camera/microphone/geolocation

## Validation status

Verified on 2026-07-30 after the category storefront implementation:

```text
npm run check: PASS
ESLint:        PASS
TypeScript:    PASS
Vite build:    PASS
```

The public storefront endpoint was also verified through the local Vite proxy. It returned HTTP success and one `electronics` product. Headless Edge visual QA passed at 1440px and a DevTools-emulated 390px viewport; the 390px document measured exactly 390px wide with no horizontal overflow. Authenticated mutations still require a real admin session.

Before merging/deploying, manually verify in a browser:

1. Login with a real phone number/password.
2. Conditional 2FA, if the backend returns `requiresTwoFactor`.
3. Profile phone display and phone change.
4. Password change and logout.
5. Product create/edit with inventory fields.
6. Quick inventory update.
7. Out-of-stock and discontinue status actions.
8. Category list/create/edit/delete.
9. Production Vercel `/api` rewrite.
10. Both category routes and the Products dropdown.
11. A real category slug using `?categorySlug=...` after water-pump/accessory products are published.

There is currently no automated test suite. Adding unit tests for phone normalization, query caching, and product payloads plus an authenticated E2E smoke suite is a high-value next step.

## Backend work still needed

Each item is intentionally one line:

- **Dashboard aggregate:** Add `GET /api/admin/dashboard/stats` to return all dashboard totals and real business metrics in one response.
- **Category pagination/count:** Add server pagination and `totalCount` so the frontend does not download every category to show a count.
- **Brand response schema:** Document the successful `GET /api/admin/Brands` response shape in OpenAPI.
- **Admin product sort enum:** Publish and consistently implement the accepted admin `Sort` values.
- **Phone format:** Document and validate the canonical admin phone-number format with examples.
- **Support APIs:** Add ticket list/detail/search/reply/assignment/status endpoints to replace the mock support page.
- **Notification APIs:** Add notification list/read-state endpoints for the disabled bell and dashboard notices.
- **Pricing APIs:** Add bulk price updates and price-history endpoints for a dedicated price-control workflow.
- **Inventory history:** Add stock adjustments, reasons, audit history, and bulk inventory endpoints beyond absolute quantity updates.
- **Dashboard business data:** Add sales, orders, revenue trend, announcements, and support-summary endpoints.
- **Admin provisioning:** Add a controlled admin invitation/creation flow if administrators should not be seeded manually.
- **Problem Details:** Return consistent RFC 7807 errors with validation details and a trace ID.
- **Auth OpenAPI security:** Mark login, 2FA, and refresh operations with `security: []` if they are public instead of inheriting global Bearer security.
- **Reliability:** Reduce cold starts, tune database connections/timeouts, and monitor upstream failures that surface as 502 responses.
- **CORS:** Explicitly allow the production Vercel origin and required local development origins.
- **Storefront media:** Add product images/gallery, availability, discounts, and rating data required by the existing commerce UI.

## Frontend work still needed

- Build the public product-detail page using `getStorefrontProduct`.
- Replace storefront mock sections as media, rating, availability, taxonomy, cart, technical-attribute, brand-list, and CMS endpoints become available.
- Move public storefront pages to real server-visible URLs and SSR/SSG before enabling indexing.
- Create a dedicated brand-management page if brand CRUD should be available to admins.
- Replace the support mock with backend data when endpoints exist.
- Replace dashboard placeholder/derived business metrics with aggregate APIs.
- Build dedicated price-control and inventory-history workflows after backend support exists.
- Confirm the admin sort strings against backend behavior; remove or map unsupported values.
- Add automated tests.
- Update the stale root `README.md`, which still says the UI Kit renders at the root.
- Remove or rationalize the duplicate `origin`/`Digifan` remotes and correct local `master` tracking when convenient.

## Known contract and implementation cautions

- OpenAPI component schemas contain no `required` arrays even where backend values are non-nullable; validate important fields client-side.
- `GET /api/admin/Brands` has no documented 200 response schema.
- Admin product `Sort` is an unconstrained string; storefront sort is the only documented enum.
- Category GET returns a complete array with no pagination.
- 2FA still exists in the newest contract; do not remove it based on older API versions.
- The top-level Bearer security definition appears to apply to auth endpoints unless overridden.
- Storefront product DTOs currently lack media, ratings, discounts, and stock/availability.
- `noindex` is site-wide and must be narrowed before public storefront deployment.
- Hash routing is unsuitable for public SEO and maps unknown hashes to the dashboard.
- UI Kit is publicly reachable even though it is noindexed.
- Frontend auth guards are not security boundaries; the backend must authorize every admin endpoint.

## Current uncommitted change set

At the time this handoff was written, the current migration changes:

```text
src/App.tsx
src/assets/storefront/pressure-tank.webp
src/assets/storefront/water-pump.webp
src/pages/storefront/CategoryProductsPage.tsx
src/pages/storefront/categoryProductsData.ts
AGENTS.md
```

Do not discard unrelated existing changes. After committing, update this section with the new commit hash and change the working-tree note near the top.
