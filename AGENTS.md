# DigiFan Project Handoff

> Last updated: 2026-08-06
> Purpose: this is the authoritative handoff for developers and coding agents. Read it before changing the project and update it whenever routes, API contracts, mock/real boundaries, deployment behavior, or major TODOs change.

## Current snapshot

- Repository: `https://github.com/AZAX16/Digifan_frontend`
- Production frontend: `https://digifan-frontend.vercel.app`
- Backend: `https://digifan-api.onrender.com`
- Working branch: `feat/admin-page`
- Base commit before the current uncommitted Excel-import refinement: `fb18943` (`feat: added excel file support for moderation page`)
- Both Git remotes, `origin` and `Digifan`, currently point to the same repository.
- The working tree intentionally contains the uncommitted Excel/manual product-import refinements described below.
- Suggested commit message for the current work: `fix(admin): refine product import workflow`

The latest supplied OpenAPI document is:

```text
C:\Users\ToosArax\.codex\attachments\1f104277-844b-4ee7-8c8d-f57a8388556a\pasted-text.txt
```

It describes OpenAPI 3.0.1, `DigiFan.Backend.API` version `1.0`. Treat it as the current contract unless the user provides a newer document.

## Product and architecture

DigiFan is an RTL Persian SPA with an authenticated administration area, a public UI-kit showcase, a public Fanino landing page, and four public Figma-derived category storefront pages.

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
| `#/admin/products` | `catalog.products.manage` | Real product CRUD, filters, moderation, and pagination; price/stock are supplied on create and read-only afterward |
| `#/categories` | `catalog.categories.manage`, `catalog.brands.manage`, or `catalog.products.manage` | Permission-aware category CRUD, brand CRUD, and Excel/manual product creation; the active view/mode is preserved in the hash query |
| `#/admin/support` | Authenticated | Mock/local ticket workspace plus real review list/reply when `reports.reviews.view` is present |
| `#/admin/account` | Authenticated | Real profile, phone change, password change, and logout |
| `#/ui-kit` | Public | Living component showcase; intentionally backend-free |
| `#/landing` | Public | Responsive Fanino landing page; real customer auth and storefront product search/list with clearly labeled mock commerce/merchandising sections |
| `#/category/industrial-fans` | Public | Responsive industrial-fan storefront; public products API with labeled mock fallbacks |
| `#/category/electric-motors` | Public | Responsive electric-motor storefront; public products API with labeled mock fallbacks |
| `#/category/water-pumps` | Public | Responsive water-pump storefront; public products API with labeled mock fallbacks |
| `#/category/accessories` | Public | Responsive accessories storefront; public products API with labeled mock fallbacks |
| Empty or unknown hash | Protected | Resolves to the admin dashboard/login |

The app uses hash fragments, so Vercel only sees `/`; it cannot distinguish admin, UI-kit, landing, or storefront routes for server metadata.

## Authentication and account behavior

The latest API migrated admin identity from email to phone number.

Implemented contract:

- `POST /api/auth/admin/login`
  - Body: `{ phoneNumber, password }`
  - Authenticated response includes `administrator: { id, phoneNumber, role, permissions }`.
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
  - Response: `{ id, phoneNumber, isActive, role, permissions }`
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
- The admin clearance profile is cached and shared centrally by `AuthProvider` with other profile consumers notified through listeners.
- Logout clears local auth/profile/query state first, then attempts server revocation.
- Conditional 2FA must remain: the current OpenAPI still contains both 2FA endpoints and `requiresTwoFactor`.

Phone-number behavior:

- `src/utils/phoneNumber.ts` converts Persian/Arabic digits to Western digits for requests.
- It removes spaces, hyphens, and parentheses.
- Current client validation accepts an optional leading `+` and 7–15 digits.
- The backend contract does not document whether canonical values must be `09...`, `+989...`, or something else; backend documentation is still needed.

Admin creation/signup is not available. An administrator must already exist in the backend.

### Customer authentication on the landing page

`src/api/customerAuth.ts` independently implements the customer contract used by `#/landing`:

- `POST /api/customer/auth/register` with `{ phoneNumber, password }`
- `POST /api/customer/auth/login` with `{ phoneNumber, password }`
- `POST /api/customer/auth/refresh` with `{ refreshToken }`
- `POST /api/customer/auth/logout` with `{ refreshToken }`
- `GET /api/customer/account/profile`

Customer access tokens are memory-only; refresh tokens and expiry are stored under a customer-specific `sessionStorage` key so they never conflict with the admin session. The client refreshes expired access tokens, retries one authorized 401 after refresh, restores the customer profile on landing-page load, normalizes Persian/Arabic phone digits to Western digits, and clears local state before best-effort logout revocation.

The current OpenAPI now documents authenticated customer cart, checkout preview, order, and address endpoints. The landing page has not connected them yet: cart quantities and checkout remain explicitly local/mock until that integration is implemented.

### Clearance and frontend authorization

The OpenAPI exposes role names as free-form strings and does not define the three-role matrix. The frontend therefore uses the backend-issued `permissions` array as the source of truth and never guesses access from a role name.

Known permission claims returned by the live API:

```text
administration.permissions.manage
administration.roles.manage
administration.users.manage
catalog.brands.manage
catalog.categories.manage
catalog.products.manage
reports.financial.view
reports.infrastructure.view
reports.orders.view
reports.products.view
reports.reviews.view
reports.searches.view
reports.visitors.view
```

Current UI mapping:

- Product moderation, product visibility, and global product search require `catalog.products.manage`.
- Content management is visible with category, brand, or product-management permission; category, brand, and product-import tabs are permission-gated independently.
- Brand CRUD and dashboard brand counts require `catalog.brands.manage`.
- Product review listing and replies require `reports.reviews.view`.
- Dashboard remains available to every authenticated administrator, but it only calls and renders catalog resources permitted for that account.
- Support tickets remain available because they are mock/local; the review tab is hidden without `reports.reviews.view`.
- Account settings are available to every authenticated administrator.
- UI Kit and storefront category pages remain public.

Restricted sidebar/mobile options are hidden. Direct navigation to a restricted route renders a dedicated access-denied screen and does not mount the protected feature page. This is UX only; backend endpoint authorization remains mandatory.

## API coverage

### Shared transport

`src/api/client.ts` provides:

- Same-origin `/api` calls by default
- Optional `VITE_API_BASE_URL`
- JSON request/response handling
- Native FormData/multipart upload handling without overriding the browser-generated boundary
- 30-second timeout
- Caller abort forwarding
- Bounded, user-friendly API errors
- HTML/error-body protection
- Shared runtime validation for paginated product, review, category, brand, and storefront responses so malformed successful payloads fail with a bounded Persian API error instead of a render-time exception

### Categories

`src/api/categories.ts` supports:

- `GET /api/admin/Categories`
- `GET /api/admin/Categories/{id}`
- `POST /api/admin/Categories`
- `PUT /api/admin/Categories/{id}`
- `DELETE /api/admin/Categories/{id}`

Notes:

- The live API now returns `{ items, page, pageSize, totalCount, totalPages }`, although the latest supplied OpenAPI still documents a complete array.
- The client accepts both the legacy array and current paginated shapes, fetches remaining pages for hierarchy editing, and uses `totalCount` for dashboard counts.
- Category models now include the backend-generated optional `slug`.
- Lists/details are cached for 60 seconds and invalidated after mutations/logout.
- Category UI supports create, edit, delete, parent filtering, “no parent,” 20-card client pagination, and prevents choosing self/descendants as a parent.

### Brands

`src/api/brands.ts` supports list/detail/create/update/delete helpers.

Notes:

- The OpenAPI still omits the successful response schema for `GET /api/admin/Brands`.
- The client deliberately accepts either an array or a paginated result.
- The content-management page provides real brand list/create/edit/delete alongside categories.
- The brand tab and requests are only available with `catalog.brands.manage`.

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

Create and update now use the same base-product body:

```text
name: string
sku: string | null
description: string | null
categoryId: uuid
brandId: uuid
price: decimal
stockQuantity: int32
reorderPoint: int32
attributes: Record<string, string> | null
```

`currency` is no longer accepted in create/update requests; it remains a response field. The removed `/out-of-stock`, `/inventory`, and all `/variants` operations are no longer called.

The moderation page now:

- Displays SKU, price, stock, and reorder point
- Highlights stock at/below the reorder point
- Can discontinue production, while `discontinued` is intentionally absent from the status filter
- Supports list/search/pagination/category/brand/status/sort filters
- Synchronizes product search/status hash queries, including dashboard metric links, so refresh preserves the active view
- Supports create/edit/delete/duplicate/publish/unpublish/archive
- Refetches after mutations so filtered lists and totals remain consistent
- Loads category/brand options only when the matching catalog permission exists; dependent filters and create/detail-edit controls remain permission-aware.
- Does not display product slugs; slugs remain internal storefront/search identifiers.
- Normalizes visible Toman currency labels to Persian `تومان`.

The base-product editor validates and edits SKU, price, stock, reorder point, and up to 20 arbitrary key/value attributes. Inventory inputs require non-negative int32 values.

`src/api/productAssets.ts` and the lazy-loaded per-product image workspace support:

- `GET /api/admin/products/{id}/images`
- `POST /api/admin/products/{id}/images`
- `PUT /api/admin/products/{id}/images/{imageId}`
- `DELETE /api/admin/products/{id}/images/{imageId}`
- `PUT /api/admin/products/{id}/images/{imageId}/primary`
- `PUT /api/admin/products/{id}/images/order`

Image management includes URL/alt text, primary selection, deletion, and ordered movement. The current API accepts image URLs rather than uploaded files and no longer associates images with variants.

### Admin product workbook import

`src/api/productImports.ts` and the lazy-loaded `ProductImportPanel` support:

- `POST /api/admin/product-imports/{parentCategoryId}` with multipart field `file`
- Validated result counts: `created`, `updated`, `archived`, `deleted`, and `unchanged`

The `#/categories?view=product-import` tab requires `catalog.products.manage`. Excel mode loads main categories when `catalog.categories.manage` is present, marks the main-category selector as required, requires rules acceptance, accepts only non-empty `.xlsx` files, submits the selected main-category ID, and renders the server result. The rules dialog no longer opens when the product-import view mounts: it opens when an unaccepted user clicks the Excel tab or explicitly chooses to view the rules. Acceptance is retained in `sessionStorage` for the rest of that browser-tab session. Manual mode renders the shared real product editor directly inside the tab and additionally needs category and brand permissions/options.

The download link intentionally serves the user-supplied `public/downloads/fanino-product-import-template.xlsx`, not the API template endpoint. It is a byte-identical copy of `C:UsersToosAraxDownloadsTelegram Desktopدسته بندی (2).xlsx` (10,836 bytes; SHA-256 `748F76788B5D1491AEC9DA3AC6358F38DD0468BBB5C42C69EED4295B04774D8E`). The workbook has ten fixed product columns, exactly eleven renameable attribute columns, and these validation labels: `فعال`, `غیرفعال`, `ناموجود`, `توقف`, `بایگانی`, `پیش‌نویس`, and `پاک‌کردن`. Multiple image URLs in the `عکس‌ها` cell must be separated with `;`.

### Admin product reviews

`src/api/reviews.ts` supports:

- `GET /api/admin/reviews`
- `PUT /api/admin/reviews/{reviewId}/reply`

The support page provides a real paginated review workspace and reply editor when `reports.reviews.view` is present. The ticket workspace remains explicitly mock/local because no support-ticket API exists.

### Public storefront products

`src/api/storefrontProducts.ts` is consumed by the landing page and both category storefront routes:

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

The pages use the API for product names, summaries, prices, currency, category/brand fields, search, category/brand slug filtering, price filtering, supported sorting, and pagination. The landing page requests the four newest products and submits header searches to the same endpoint. Default category slugs are `water-pump` and `accessories`; a test slug can be supplied as `?categorySlug=...` on either category hash route.

The live backend check on 2026-07-30 returned one public product under category slug `electronics` and no products for either design slug. Empty/error results therefore render clearly labeled mock cards so the complete Figma layout remains testable without misrepresenting their source.

## Page maturity: real, partial, and mock

### Real

- Phone-based admin login
- Optional 2FA flow
- Session refresh/logout
- Profile retrieval
- Phone-number change
- Password change
- Permission-aware admin navigation, direct-route guards, and dashboard resource loading
- Product listing/filtering/pagination
- Product create/edit/delete/duplicate
- Product publication/status actions
- Product create/edit with SKU, price, stock quantity, reorder point, and arbitrary attributes
- Excel product import for a selected main category, including real server result counts

- Product image add/edit/delete, primary selection, and reordering
- Category CRUD and hierarchy management
- Brand CRUD
- Product review listing and replies
- UI-kit components and showcase
- Customer register/login/session refresh/profile restoration/logout on the landing page
- Landing-page newest-product loading, submitted product search, and primary product images when supplied by the API
- Public storefront product search/filter/supported sort/pagination and primary product images when matching backend products exist

### Partial or locally derived

- Dashboard product/category/brand totals are real when the signed-in administrator has the corresponding catalog permission.
- Dashboard chart is orange and derived from product-status totals, not sales history.
- Dashboard notices are local text, not notifications from the backend.
- “مدیریت موجودی” and “کنترل قیمت” navigation both lead to the products screen.
- Base-product SKU, price, inventory, reorder point, and attributes are editable through the current product update contract.
- Brand management shares the content route with categories rather than having a separate route.
- Storefront category pages are real API-backed for fields/endpoints the contract exposes, including primary image URLs, and fall back to explicitly labeled demo cards when a category is empty or unavailable.
- The Fanino landing page is Figma-derived and responsive; its product grid is API-backed with labeled fallback cards while the brand name and static content are provisional.
- Storefront brand choices are derived from the current API page because no public brand-list endpoint exists.
- `Popular` sorting is intentionally marked demo-only because the backend exposes no popularity/rating sort.

### Mock

- Support ticket data, search, filters, selection, and replies; the separate product-review tab is real
- Dashboard sales/revenue/orders/support/announcement business data
- Notification bell (disabled)
- Storefront hero copy/images, subcategory taxonomy, fallback product imagery, ratings, new/discount badges, cart actions, technical filters, promotional banner, brand artwork, service claims, and footer contact content
- Landing-page hero carousel, category taxonomy, ratings/badges, promotions, special offers, brand artwork, service claims, cart/checkout, and non-product navigation destinations

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
- Inputs normalize compatible typed digits to Persian by default; password fields are deliberately excluded so credentials are never mutated.
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

- Admin pages, UI Kit, category storefront, and landing page are lazy-loaded as separate route chunks.
- Unrestricted protected routes may be prefetched during session restoration; clearance-protected chunks are only prefetched after authorization is known.
- Eager login/app imports avoid pulling UI-kit-only components into the entry bundle.
- Category and brand requests use short-lived in-memory caching and request deduplication.
- Shared cache entries are bounded, abort-aware, invalidated after mutations, and cleared on logout.
- Multi-page brand fetching is limited to four concurrent requests.
- Category cards use client pagination to reduce DOM work.
- Dropdown menus have a bounded, scrollable height.
- Dashboard uses `Promise.allSettled` so partial data can render when one request fails.
- Dashboard skips product/category/brand requests that the current permission set does not allow, avoiding predictable 403 responses and unnecessary work.
- Product lists use server pagination.
- The product editor and image-management workspace are separate on-demand chunks; browsing/filtering moderation no longer downloads either editor, and removed variant code no longer ships.
- The product-import panel is a separate lazy chunk; brand data is not requested in Excel mode and the shared manual editor loads as its own lazy chunk when the manual tab is displayed.
- Dialog focus trapping, Escape handling, scroll locking, and focus restoration share one lazy module instead of being duplicated across route chunks.
- Completed countdowns unsubscribe from the shared one-second clock so expired offers do not keep background timer work alive.
- The public category route is lazy-loaded as its own chunk.
- The landing page is a separate ~11 kB gzip route chunk; its supplied industrial-pump cutout is a transparent 1536x1024 WebP (~78 kB), and category cards use dedicated transparent silhouette SVGs instead of generic library icons.
- Storefront images use lazy decoding/loading except the LCP hero image.
- Generated transparent hero assets are resized alpha WebP files: water pump ~160 kB and pressure tank ~41 kB.
- Storefront API requests are abortable and stale requests are cancelled when filters change.
- Vite’s content-hashed assets receive one-year immutable caching on Vercel.
- Authenticated `/api` responses are configured as private/no-store.

Latest verified production build after the 2026-08-02 project-wide bug/performance audit:

```text
entry JS:                  217.82 kB raw / 69.54 kB gzip
CSS:                        74.62 kB raw / 13.96 kB gzip
admin moderation:          15.26 kB raw /  5.16 kB gzip
product editor:             7.97 kB raw /  3.11 kB gzip (lazy)
product image workspace:   10.89 kB raw /  3.82 kB gzip (lazy)
shared dialog lifecycle:    1.26 kB raw /  0.62 kB gzip (lazy/shared)
paginated response guard:   0.61 kB raw /  0.36 kB gzip (lazy/shared)
category storefront:       30.64 kB raw /  9.52 kB gzip
Fanino landing page:       37.64 kB raw / 11.45 kB gzip (lazy)
Fanino hero cutout:        77.72 kB (1536x1024 alpha WebP)
water-pump hero asset:    159.90 kB
pressure-tank asset:       41.29 kB
```

Remaining performance bottlenecks:

- Dashboard requires seven API requests because no aggregate endpoint exists; the extra request supplies the out-of-stock count.
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

Verified on 2026-08-06 after refining the content-management Excel/manual product workflow:

```text
npm run check: PASS
ESLint:        PASS
TypeScript:    PASS
Vite build:    PASS
```

The full `npm run check` pipeline (ESLint, both TypeScript projects, and Vite production build) passed on 2026-08-06 after the import-workflow refinements. The import panel is emitted as a separate 21.53 kB raw / 7.26 kB gzip chunk and the shared manual product editor remains separately lazy-loaded at 8.18 kB raw / 3.22 kB gzip. The entry bundle is 218.40 kB raw / 69.67 kB gzip and CSS is 78.14 kB raw / 14.33 kB gzip. The authenticated import mutation was not run against production because it can change catalog data. The prior audit fixed password digit mutation, stale cleared-search state, review reply carryover across pages, category storefront image omission, stale route descriptions, expired countdown subscriptions, modal keyboard/scroll lifecycle, repeated number-formatter construction, and malformed paginated-response crashes; it also moved the product editor behind a lazy boundary. A local headless Edge smoke run after the final build rendered `#/landing`, `#/category/water-pumps`, `#/ui-kit`, and the logged-out `#/admin` login route successfully. In the prior storefront QA, the public storefront endpoint was also verified through the local Vite proxy and the landing page rendered live newest-product data. Headless Edge visual QA passed for the landing page at exact 1440px and DevTools-emulated 390px viewports; the 390px document, body, and header each measured exactly 390px wide with no horizontal overflow. An authenticated browser smoke test with the supplied admin test account also passed for dashboard, moderation, and content/categories after adding paginated category-response compatibility. Authenticated mutations and live customer registration/login still require separate manual verification with appropriate accounts.

Earlier live authentication/profile checks confirmed role `super-admin` plus the expected permission array and paginated brand/review responses. The latest supplied OpenAPI was verified directly for the new base-product fields, removal of variants/image associations, and customer cart item migration from `productVariantId` to `productId`; no authenticated live mutation was run for this update. Lower-clearance accounts were not supplied, so hidden-navigation visual smoke testing for each lower permission set remains manual; route and API gating are typechecked and production-built.

Before merging/deploying, manually verify in a browser:

1. Login with a real phone number/password.
2. Conditional 2FA, if the backend returns `requiresTwoFactor`.
3. Profile phone display and phone change.
4. Password change and logout.
5. Product create/edit with SKU, price, inventory, reorder point, and attributes.
6. Dashboard metric links opening the correct active/draft/out-of-stock/archived filter.
7. Image add/edit/delete, primary selection, and reordering using public image URLs.
8. Product publish/unpublish/archive/discontinue actions.
9. Category list/create/edit/delete.
10. Brand list/create/edit/delete.
11. Product review listing and reply submission.
12. Production Vercel `/api` rewrite.
13. Both category routes and the Products dropdown.
14. A real category slug using `?categorySlug=...` after water-pump/accessory products are published.
15. One account from each lower permission set: hidden navigation, direct-route denial, and dashboard partial-data behavior.
16. Landing-page customer register/login/refresh/logout with a real customer account.
17. Landing-page default product loading, immediate search clearing, mobile menu/layout, and local demo cart behavior.
18. Content-management Excel rules opening only after the Excel tab is clicked, session-scoped acceptance persistence, direct supplied `.xlsx` download, semicolon-separated image URLs, required main-category selection, and one authorized import against disposable test data.
19. Manual mode rendering the existing product editor inline and saving a test product.

There is currently no automated test suite. Adding unit tests for phone normalization, query caching, and product payloads plus an authenticated E2E smoke suite is a high-value next step.

## Backend work still needed

Each item is intentionally one line:

- **Dashboard aggregate:** Add `GET /api/admin/dashboard/stats` to return all dashboard totals and real business metrics in one response.
- **Category OpenAPI schema:** Update the supplied OpenAPI contract to document the live paginated category response and its `Page`/`PageSize` parameters.
- **Brand response schema:** Document the successful `GET /api/admin/Brands` response shape in OpenAPI.


- **Permission mapping:** Document the permission claim required by each protected operation, including reviews, replies, and product workbook imports.
- **Product-import contract:** Document the exact image-URL separator, file-size/row limits, partial-failure behavior, validation errors, and successful template-download response type.
- **Admin product sort enum:** Publish and consistently implement the accepted admin `Sort` values.
- **Phone format:** Document and validate the canonical admin phone-number format with examples.
- **Support APIs:** Add ticket list/detail/search/reply/assignment/status endpoints to replace the mock support page.
- **Notification APIs:** Add notification list/read-state endpoints for the disabled bell and dashboard notices.
- **Pricing APIs:** Add bulk price updates and price history for a dedicated price-control workflow; single base-product price editing is now supported.
- **Inventory APIs:** Add supported stock adjustments, reasons, audit history, and bulk inventory operations to replace the removed absolute inventory endpoint.
- **Dashboard business data:** Add sales, orders, revenue trend, announcements, and support-summary endpoints.
- **Admin provisioning:** Add a controlled admin invitation/creation flow if administrators should not be seeded manually.
- **Problem Details:** Return consistent RFC 7807 errors with validation details and a trace ID.
- **Auth OpenAPI security:** Mark login, 2FA, and refresh operations with `security: []` if they are public instead of inheriting global Bearer security.
- **Reliability:** Reduce cold starts, tune database connections/timeouts, and monitor upstream failures that surface as 502 responses.
- **CORS:** Explicitly allow the production Vercel origin and required local development origins.
- **Storefront commerce fields:** Add list-level ratings and discounts plus clearly documented availability semantics required by the existing commerce UI.


## Frontend work still needed

- Build the public product-detail page using `getStorefrontProduct`.
- Connect the existing customer cart, checkout-preview, order, and address endpoints; then replace the remaining taxonomy, discount, brand-list, and CMS mocks as APIs become available.
- Replace the provisional Fanino logo/text artwork and placeholder category/brand assets when final brand files are supplied.
- Move public storefront pages to real server-visible URLs and SSR/SSG before enabling indexing.
- Build administration and report pages for the permission claims that currently have no matching frontend route.
- Replace the support mock with backend data when endpoints exist.
- Replace dashboard placeholder/derived business metrics with aggregate APIs.
- Build dedicated price-control and inventory-history workflows after backend support exists.
- Confirm the admin sort strings against backend behavior; remove or map unsupported values.
- Add automated tests.
- Update the stale root `README.md`, which still says the UI Kit renders at the root.
- Remove or rationalize the duplicate `origin`/`Digifan` remotes and correct local `master` tracking when convenient.

## Known contract and implementation cautions

- OpenAPI component schemas contain no `required` arrays even where backend values are non-nullable; validate important fields client-side.
- Role names and their three-role matrix are not enumerated in OpenAPI; use the issued permission claims and do not hard-code role-name access rules.
- `GET /api/admin/Brands` has no documented 200 response schema.
- The current OpenAPI removed `/api/admin/products/{id}/out-of-stock` and `/inventory`; do not reintroduce those calls without a newer contract.
- `CreateProductRequest` and `UpdateProductRequest` now share SKU, price, stock, reorder point, and attributes; `currency` is response-only and is not submitted.
- Product variant endpoints and DTOs were removed from the current OpenAPI; do not reintroduce variant calls without a newer contract.
- Product image creation accepts a public URL only; no binary upload/media-storage endpoint or variant association is documented.
- Admin product `Sort` is an unconstrained string; storefront sort is the only documented enum.
- The live category GET is paginated while the supplied OpenAPI still shows an array; the frontend deliberately supports both shapes.
- 2FA still exists in the newest contract; do not remove it based on older API versions.
- The top-level Bearer security definition appears to apply to auth endpoints unless overridden.
- Storefront product DTOs currently lack media, ratings, discounts, and stock/availability.
- `noindex` is site-wide and must be narrowed before public storefront deployment.
- Hash routing is unsuitable for public SEO and maps unknown hashes to the dashboard.
- UI Kit is publicly reachable even though it is noindexed.
- Frontend auth guards are not security boundaries; the backend must authorize every admin endpoint.
- Product import uses the selected main category ID as `parentCategoryId`; the uploaded body field must remain named `file` and the browser must generate the multipart boundary.
- The Excel template link is a static user-supplied `.xlsx` workbook; replace it only when an approved newer workbook is provided or the backend template endpoint is designated authoritative.

## Current uncommitted change set

At the time this handoff was updated, the uncommitted refinement change set on top of `fb18943` is:

```text
AGENTS.md
public/downloads/fanino-product-import-template.zip (deleted; superseded by the supplied workbook)
public/downloads/fanino-product-import-template.xlsx (new; byte-identical copy of the supplied workbook)
src/components/ui/Dropdown.tsx
src/pages/TestUIKit.tsx
src/pages/admin/ProductEditorDialog.tsx
src/pages/admin/ProductImportPanel.tsx
```

The refinement adds the `;` image-URL separator to rule 2, serves the supplied workbook directly instead of a ZIP, prevents the rules dialog from opening when the view first mounts, persists acceptance for the browser-tab session, removes technical API copy from the import UI, renders the manual product form inline, and marks the Excel main-category selector with a red required star. The shared Dropdown required state is demonstrated in the UI Kit, and the moderation editor keeps its existing dialog presentation.

Do not discard unrelated existing changes. After committing, update this section with the new commit hash and change the working-tree note near the top.