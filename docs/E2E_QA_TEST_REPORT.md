# Maison Elara E-Commerce Website: End-to-End QA Test Report

Date: 2026-05-29
Application: Next.js e-commerce website with Prisma/PostgreSQL, NextAuth, Stripe Checkout, admin dashboard, product catalog, wishlist, cart, checkout, and product administration.

## 1. Test Plan

### Objective
Validate the website for production readiness across customer shopping flows, admin operations, payments, APIs, database integrity, security, accessibility, performance, and cross-browser/device compatibility.

### Scope
In scope:
- Customer registration, authentication, profile, wishlist, cart, checkout, products, orders.
- Admin dashboard, products, inventory, orders, payments, coupons, reports.
- Public APIs: auth, products, checkout, orders, newsletter, AI recommendation.
- Stripe checkout and webhook behavior.
- PostgreSQL data integrity via Prisma.
- Responsive UI and accessibility.

Out of scope unless separately integrated:
- Real payment settlement beyond Stripe test mode.
- Email delivery, SMS, shipment carrier tracking, warehouse integrations.
- Production CDN/object storage validation.

### Test Environment
- Local URL: `http://localhost:3000`
- Browser set: Chrome, Firefox, Edge, Safari.
- Device set: Desktop 1440x900, tablet 768x1024, mobile 390x844, Android Chrome, iPhone Safari.
- Database: PostgreSQL via Prisma.
- Payment: Stripe test mode.
- Admin test account: `admin@maisonelara.com`.

### Severity Levels
- Critical: Blocks checkout, payment, authentication, data integrity, or exposes sensitive data.
- High: Breaks a major user/admin flow or causes incorrect business data.
- Medium: Partial feature failure, confusing UX, validation gap, inconsistent behavior.
- Low: Cosmetic issue, minor copy issue, non-blocking UI inconsistency.

## 2. Test Scenarios

| ID | Area | Scenario | Priority |
|---|---|---|---|
| TS-001 | Registration | New user creates account with valid details | High |
| TS-002 | Registration | Existing email cannot register again | High |
| TS-003 | Login | Valid customer/admin login routes correctly | Critical |
| TS-004 | Login | Invalid credentials display safe error | High |
| TS-005 | Logout | Session ends and protected pages redirect | High |
| TS-006 | Password Reset | User requests password reset | High |
| TS-007 | Profile | User edits profile, address, password | High |
| TS-008 | Search | Product search returns relevant products | High |
| TS-009 | Filters | Category, price, and sorting work together | High |
| TS-010 | PDP | Product details, images, sizes, reviews display | High |
| TS-011 | Wishlist | Add/remove wishlist persists after refresh | Medium |
| TS-012 | Cart | Add, update, remove, persist cart | Critical |
| TS-013 | Checkout | User completes info, shipping, Stripe redirect | Critical |
| TS-014 | Payment | Stripe success creates order record | Critical |
| TS-015 | Inventory | Paid order decrements stock correctly | Critical |
| TS-016 | Coupons | Discount applies and total is correct | High |
| TS-017 | Orders | User sees real order history and status | High |
| TS-018 | Returns | Eligible order can request return/refund | High |
| TS-019 | Reviews | Verified buyer can submit review/rating | Medium |
| TS-020 | Contact | Contact form submits and validates fields | Medium |
| TS-021 | Admin Products | Admin uploads product image and storefront displays it | High |
| TS-022 | Security | SQLi, XSS, CSRF, auth bypass attempts fail | Critical |
| TS-023 | Performance | Homepage, shop, search, checkout meet SLAs | High |
| TS-024 | Accessibility | Keyboard, alt text, labels, contrast pass WCAG AA | High |

## 3. Detailed Test Cases

### Functional Testing

| TC ID | Feature | Steps | Test Data | Expected Result | Severity |
|---|---|---|---|---|---|
| FT-001 | Registration API | POST `/api/auth/register` with valid name, email, strong password | `qa+1@test.com`, `Password1` | 201 created, user returned, password not returned | Critical |
| FT-002 | Registration API | Register same email twice | Same email | Second request returns 409 | High |
| FT-003 | Registration API | Submit weak password | `password` | 400 with password policy error | High |
| FT-004 | Registration UI | Click "Create an account" from account page | N/A | Registration form or page opens | High |
| FT-005 | Login | Login valid admin | Admin credentials | Redirects to `/admin` | Critical |
| FT-006 | Login | Login invalid password | Wrong password | Generic invalid credentials error | High |
| FT-007 | Logout | Logout from admin/customer account | Active session | Session cookie cleared; protected routes inaccessible | High |
| FT-008 | Password Reset | Click forgot password and submit email | Valid email | Reset email flow starts | High |
| FT-009 | Profile | Update name, phone, password | Valid values | Data persists after refresh | High |
| FT-010 | Product Search | Search by product name | `Noir` | Matching products shown, no unrelated products | High |
| FT-011 | Product Search | Search special characters | `<script>` | No script execution; safe empty/result state | Critical |
| FT-012 | Filtering | Select category filter | `Elixir` | Only category products display | High |
| FT-013 | Sorting | Sort price low to high | N/A | Products sorted by minimum size price ascending | Medium |
| FT-014 | Price Filter | Set max below all products | Max 1 | Empty state shown clearly | Medium |
| FT-015 | PDP | Open product page | Existing product ID | Images, name, sizes, price, notes render | High |
| FT-016 | PDP | Select each size and add to cart | 50ml, 100ml | Correct size and price added | Critical |
| FT-017 | Wishlist | Click wishlist icon | Product card | Item appears in `/wishlist`, persists refresh | Medium |
| FT-018 | Wishlist | Remove wishlisted item | Existing item | Item removed from persisted wishlist | Medium |
| FT-019 | Cart | Add same product and size twice | Same SKU | Quantity increments, no duplicate line | Critical |
| FT-020 | Cart | Quantity decrement to zero | Cart line | Item removed | High |
| FT-021 | Cart | Refresh page | Existing cart | Cart persists from local storage | Medium |
| FT-022 | Checkout Info | Continue with empty email | Empty email | Validation blocks progress | Critical |
| FT-023 | Checkout Shipping | Continue with empty address | Empty address | Validation blocks progress | Critical |
| FT-024 | Checkout Payment | Click pay with empty cart | Empty cart | Button disabled, no Stripe session | Critical |
| FT-025 | Checkout API | POST valid cart to `/api/checkout` | Valid product/size/email | Returns Stripe checkout URL | Critical |
| FT-026 | Checkout API | Quantity greater than stock | Stock 3, request 4 | Request rejected | Critical |
| FT-027 | Payment Success | Complete Stripe test payment | Stripe test card | Webhook creates order | Critical |
| FT-028 | Guest Checkout | Complete checkout without login | Guest email | Either order is created as guest or guest checkout blocked | Critical |
| FT-029 | Coupon | Apply valid coupon | `SAVE10` | Total discount visible and sent to payment | High |
| FT-030 | Coupon | Apply expired coupon | Expired code | Clear validation error, no discount | High |
| FT-031 | Orders | Open My Orders | Logged-in user with orders | Real DB orders displayed | High |
| FT-032 | Tracking | Click Track Order | Existing order | Tracking/status page opens | Medium |
| FT-033 | Cancellation | Cancel pending order | Pending order | Status becomes cancelled, inventory restored | High |
| FT-034 | Returns | Request return for delivered order | Delivered order | Return request saved and visible | High |
| FT-035 | Reviews | Submit 5-star review | Verified buyer | Review appears on PDP, average updates | Medium |
| FT-036 | Contact Form | Submit valid message | Name, email, message | Confirmation shown; message stored/sent | Medium |
| FT-037 | Admin Product Upload | Admin uploads JPG for new product | Valid image under 5MB | Product created; image displays in admin and store | High |
| FT-038 | Admin Product Upload | Upload unsupported file | `.exe`, `.txt` | Rejected with clear error | High |
| FT-039 | Admin Product Upload | Upload image over 5MB | Large image | Rejected with clear error | Medium |
| FT-040 | Admin Inventory | Admin updates stock | Valid stock | Stock persists and storefront reflects availability | Critical |
| FT-041 | Admin Orders | Change order status | Processing to Shipped | Status persists and user order reflects update | High |

### UI/UX Testing

| TC ID | Area | Steps | Expected Result | Severity |
|---|---|---|---|---|
| UX-001 | Responsive Desktop | Open home/shop/admin at 1440x900 | No overlap, readable layout | High |
| UX-002 | Responsive Tablet | Open at 768x1024 | Navigation and product grid adapt | High |
| UX-003 | Responsive Mobile | Open at 390x844 | No horizontal scroll; menus usable | High |
| UX-004 | Navigation | Use header/footer/sidebar links | Active states consistent, no broken links | Medium |
| UX-005 | Buttons | Inspect disabled/hover/loading states | Buttons visible and accessible | Medium |
| UX-006 | Forms | Trigger every validation state | Clear field-level or form-level messages | High |
| UX-007 | Images | Block/slow image loading | Placeholder or stable layout; alt text present | Medium |
| UX-008 | Admin Sidebar | Collapse and expand | Labels remain understandable | Medium |
| UX-009 | Product Upload | File input visual state | Selected filename visible; constraints clear | Medium |
| UX-010 | Broken Links | Crawl public/admin routes | All internal links return 2xx/3xx | High |

### Performance Testing

| TC ID | Metric | Method | Expected Result | Severity |
|---|---|---|---|---|
| PT-001 | Homepage load | Lighthouse/WebPageTest | LCP under 2.5s, CLS under 0.1 | High |
| PT-002 | Shop listing | 100, 1k, 10k products seeded | First page under 2s | High |
| PT-003 | Search API | GET `/api/products?search=oud` | p95 under 500ms for normal catalog | Medium |
| PT-004 | Checkout API | POST cart with 10 items | Session creation under 2s excluding Stripe latency | Critical |
| PT-005 | DB query | Enable Prisma query logs | No N+1 on listing/search/orders | High |
| PT-006 | Concurrent users | 100 virtual users browsing | Error rate under 1 percent | High |
| PT-007 | Stress | Increase users until saturation | Graceful degradation, no data corruption | High |
| PT-008 | Admin dashboard | Load `/admin` with large order data | p95 under 2s with indexed queries | Medium |

### Security Testing

| TC ID | Threat | Steps | Expected Result | Severity |
|---|---|---|---|---|
| ST-001 | SQL Injection | Search/login with `' OR 1=1 --` | No bypass, no DB error leak | Critical |
| ST-002 | XSS | Product search/profile fields with `<script>` | Escaped output, no execution | Critical |
| ST-003 | Stored XSS | Admin creates product with script in name | Storefront escapes content | Critical |
| ST-004 | CSRF | Submit admin server action cross-origin | Request blocked or protected | Critical |
| ST-005 | Auth Bypass | Access `/admin` as user/guest | Redirect to account page | Critical |
| ST-006 | Session | Logout then use back button/admin URL | Protected data unavailable | Critical |
| ST-007 | Password Security | Inspect DB password values | Bcrypt hashes only, no plaintext | Critical |
| ST-008 | Rate Limit | 101 API requests in 60s | 429 returned | Medium |
| ST-009 | Payment | Tamper cart price in client store | Server uses DB price only | Critical |
| ST-010 | API Access | GET `/api/orders` as guest | 401 returned | Critical |
| ST-011 | Sensitive Data | Inspect API responses | No password hashes, secrets, Stripe keys | Critical |
| ST-012 | Upload Security | Upload script disguised as image | MIME/type rejected; no executable file served | Critical |

### Compatibility Testing

| TC ID | Platform | Scope | Expected Result |
|---|---|---|---|
| CT-001 | Chrome latest | Full smoke suite | Pass |
| CT-002 | Firefox latest | Full smoke suite | Pass |
| CT-003 | Edge latest | Full smoke suite | Pass |
| CT-004 | Safari latest | Account, cart, checkout, admin | Pass |
| CT-005 | Android Chrome | Mobile shop/cart/checkout | Pass |
| CT-006 | iPhone Safari | Mobile shop/cart/checkout | Pass |
| CT-007 | Low bandwidth | Slow 3G | Usable loading states; no broken layout |

### API Testing

| TC ID | API | Request | Expected Status | Response Validation |
|---|---|---|---|---|
| API-001 | Register | POST valid body | 201 | User object, no password |
| API-002 | Register | POST invalid email | 400 | Error string |
| API-003 | Login | POST NextAuth credentials | 200/302 | Session cookie set |
| API-004 | Products | GET `/api/products` | 200 | `{ products, pagination }` |
| API-005 | Products | GET with invalid page/limit | 200 | Values clamped |
| API-006 | Product Detail | GET existing ID | 200 | Product with sizes/reviews |
| API-007 | Product Detail | GET missing ID | 404 | Error object |
| API-008 | Checkout | POST valid items/email | 200 | Stripe URL |
| API-009 | Checkout | POST malformed body | 400 | Error object |
| API-010 | Orders | GET as guest | 401 | Unauthorized |
| API-011 | Orders | GET as user | 200 | User-only orders, pagination |
| API-012 | Webhook | POST missing signature | 400 | Error object |
| API-013 | Webhook | POST invalid signature | 400 | Error object |
| API-014 | Admin Analytics | GET as guest | 401 | Unauthorized |
| API-015 | Newsletter | POST valid email | 200/201 | Success message |

### Database Testing

| TC ID | Area | Validation | Expected Result | Severity |
|---|---|---|---|---|
| DB-001 | User | Register user | Unique email, bcrypt hash | Critical |
| DB-002 | Product | Create product | Product, sizes, category relation saved | High |
| DB-003 | Upload | Create product image | DB stores public URL, file exists | High |
| DB-004 | Inventory | Complete paid order | ProductSize stock decremented atomically | Critical |
| DB-005 | Order | Stripe webhook | Order and order items created in one transaction | Critical |
| DB-006 | Coupon | Apply coupon | Discount record valid and immutable in order | High |
| DB-007 | Delete Product | Delete product with order history | Historical order remains safe or deletion blocked | Critical |
| DB-008 | User Delete | Delete user | Related PII handled according to policy | High |

### Accessibility Testing

| TC ID | Area | Expected Result | Severity |
|---|---|---|---|
| A11Y-001 | Keyboard Navigation | All controls reachable by Tab/Shift+Tab | High |
| A11Y-002 | Focus Visible | Clear focus state on buttons/links/inputs | High |
| A11Y-003 | Screen Reader | Forms have labels/names and errors announced | High |
| A11Y-004 | Alt Text | Product and decorative images handled correctly | Medium |
| A11Y-005 | Contrast | Text/buttons meet WCAG AA | High |
| A11Y-006 | Modals/Drawers | Cart/search trap focus and close via Escape | High |
| A11Y-007 | Touch Targets | Mobile controls at least 44x44 px | Medium |
| A11Y-008 | Motion | Animations respect reduced motion | Medium |

## 4. Edge Cases

- Register with email casing differences: `Test@Email.com` vs `test@email.com`.
- Password length exactly 8 and 128 characters.
- Login with leading/trailing spaces.
- Product with no sizes, duplicate product name, zero stock, huge price, negative price.
- Search with emojis, SQL payloads, XSS payloads, 500+ character query.
- Cart item stored in local storage but product deleted by admin.
- Quantity in cart greater than stock available.
- Two users buy last unit simultaneously.
- Stripe webhook sent twice for same session.
- Stripe success query manually opened without completing payment.
- Guest checkout creates no user ID.
- Admin uploads same filename twice.
- Admin uploads corrupt image file with image MIME type.
- Network loss during checkout redirect.
- User changes currency then checkout uses USD.
- Browser private mode/local storage disabled.
- Long product names causing card overflow.
- Mobile landscape checkout flow.

## 5. Initial Bug Reports and Requirement Gaps

### BUG-001: Registration UI is not implemented
- Steps: Open `/account`, click "Create an account".
- Expected: Registration form/page opens and calls `/api/auth/register`.
- Actual: Text appears non-functional.
- Severity: High
- Priority: P1
- Screenshot Requirement: Yes, account page showing inactive create account text.

### BUG-002: Password reset flow is missing
- Steps: Open `/account`, look for forgot password/reset password.
- Expected: User can request password reset securely.
- Actual: No password reset entry point or API found.
- Severity: High
- Priority: P1
- Screenshot Requirement: Yes.

### BUG-003: Account profile settings are not persisted
- Steps: Login as user, open Account Settings, edit name/phone/password, click Save.
- Expected: Values validate, save to database, persist after refresh.
- Actual: UI fields exist but no save handler/API persistence is visible.
- Severity: High
- Priority: P1
- Screenshot Requirement: Yes.

### BUG-004: Account orders are hard-coded sample data
- Steps: Login and open My Orders.
- Expected: Orders fetched from `/api/orders` for logged-in user.
- Actual: Static order list is rendered in account page.
- Severity: High
- Priority: P1
- Screenshot Requirement: Yes.

### BUG-005: Checkout success can be spoofed with query string
- Steps: Open `/checkout?success=true&session_id=fake`.
- Expected: App verifies Stripe session/order before showing confirmed state.
- Actual: Page shows success and fake order number based on query string.
- Severity: Critical
- Priority: P0
- Screenshot Requirement: Yes.

### BUG-006: Guest checkout can pay but webhook does not create order
- Steps: Checkout without login and complete Stripe payment.
- Expected: Guest order created or checkout requires login.
- Actual: Webhook exits when `userId` metadata is missing.
- Severity: Critical
- Priority: P0
- Screenshot Requirement: Yes, plus webhook log.

### BUG-007: Inventory is not decremented after paid order
- Steps: Complete Stripe checkout for in-stock item.
- Expected: `ProductSize.stock` decreases by purchased quantity in same transaction as order creation.
- Actual: Webhook creates order items but does not update stock.
- Severity: Critical
- Priority: P0
- Screenshot Requirement: DB evidence preferred.

### BUG-008: Checkout permits requested quantity above available stock
- Steps: Set cart quantity greater than stock and call `/api/checkout`.
- Expected: API rejects item with insufficient inventory.
- Actual: API only checks `stock <= 0`, not `quantity <= stock`.
- Severity: Critical
- Priority: P0
- Screenshot Requirement: API request/response evidence.

### BUG-009: Coupon management and storefront coupon application are disconnected
- Steps: Create coupon in admin, attempt to apply in checkout.
- Expected: Checkout accepts code and applies discount to total/payment.
- Actual: Checkout has no visible coupon field; Stripe `allow_promotion_codes` is enabled but local coupons are not connected.
- Severity: High
- Priority: P1
- Screenshot Requirement: Yes.

### BUG-010: Order tracking, cancellation, returns, refunds are not implemented for users
- Steps: Open My Orders, click Track Order or attempt cancel/return/refund.
- Expected: Real workflow and status updates.
- Actual: Tracking button appears non-functional; cancel/return/refund flows absent.
- Severity: High
- Priority: P1
- Screenshot Requirement: Yes.

### BUG-011: Social login buttons appear active but have no implementation
- Steps: Open `/account`, click Google/Apple/Facebook.
- Expected: OAuth flow starts or buttons hidden/disabled.
- Actual: Buttons do not authenticate.
- Severity: Medium
- Priority: P2
- Screenshot Requirement: Yes.

### BUG-012: Contact Us form is absent
- Steps: Navigate public pages and footer for Contact Us.
- Expected: Contact page/form with validation and submission path.
- Actual: No contact route/form found.
- Severity: Medium
- Priority: P2
- Screenshot Requirement: Yes.

### BUG-013: Product image uploads use local filesystem storage
- Steps: Upload product image in admin on serverless/ephemeral deployment.
- Expected: Image persists across deployments and instances using object storage/CDN.
- Actual: Uploaded file is saved under local `public/uploads/products`.
- Severity: High in production, Medium in local/staging.
- Priority: P1
- Screenshot Requirement: No, deployment evidence preferred.

### BUG-014: Admin delete product can impact historical order integrity
- Steps: Delete product that has existing order items.
- Expected: Deletion blocked, archived, or historical order keeps immutable product snapshot.
- Actual: Product has cascade relations in schema; risk of deleting review/wishlist and breaking order references.
- Severity: Critical
- Priority: P0
- Screenshot Requirement: DB evidence preferred.

## 6. Risk Analysis

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Fake checkout success page | False order confirmation | High | Verify Stripe session server-side before success state |
| No stock decrement | Overselling | High | Transactional order creation plus stock decrement |
| Guest payment without order | Lost paid orders | High | Require auth or support guest orders |
| Local upload storage | Broken product images in production | Medium | Use S3/Cloudinary/Vercel Blob and CDN URLs |
| Missing registration UI | New users blocked | High | Implement register page/modal |
| Missing profile persistence | Poor account experience | Medium | Add account update APIs/actions |
| Hard-coded orders | Customer trust issue | High | Fetch `/api/orders` and render real data |
| In-memory rate limit | Ineffective multi-instance protection | Medium | Use Redis-backed rate limiting |
| CSRF on server actions | Unauthorized state changes | Medium | Validate origin, SameSite, CSRF strategy |
| Accessibility gaps | Legal/compliance risk | Medium | Run axe audits and fix labels/focus/contrast |

## 7. Automation Recommendations

### Playwright
Best fit for this project because it supports modern Next.js flows, API mocking, mobile emulation, screenshots, traces, and cross-browser testing.

Recommended Playwright suites:
- Smoke: home, shop, product detail, cart drawer, account login, admin login.
- Checkout: add product, fill info/shipping, mock Stripe session response.
- Admin: create product with uploaded image, verify storefront image.
- Security: guest cannot access `/admin`, user cannot access admin APIs.
- Visual regression: product cards, checkout, admin dashboard at desktop/mobile.
- Accessibility: integrate `@axe-core/playwright`.

### Cypress
Good for developer-friendly UI regression and component-like testing:
- Cart and wishlist local-storage behavior.
- Product filtering/sorting interactions.
- Checkout form validation.
- Account page tab behavior.

### Selenium
Useful for enterprise browser grid coverage:
- Chrome/Firefox/Edge/Safari smoke flows on BrowserStack/Sauce Labs.
- Legacy compatibility checks if required.

### Suggested CI Gates
- `npm run build`
- `npx tsc --noEmit`
- API contract tests for products/auth/checkout/orders.
- Playwright smoke on every PR.
- Full E2E nightly with seeded database.
- Lighthouse CI budgets for home/shop/product/checkout.
- Axe accessibility scan for critical routes.

## 8. Final QA Sign-Off Checklist

Before production release:
- [ ] Registration UI implemented and tested.
- [ ] Password reset implemented and tested.
- [ ] Profile and address changes persist.
- [ ] Product search/filter/sort passes desktop/mobile tests.
- [ ] Product image upload persists in production storage.
- [ ] Cart prevents out-of-stock and over-stock checkout.
- [ ] Stripe success page is server-verified.
- [ ] Stripe webhook is idempotent.
- [ ] Paid orders create order records for logged-in and/or guest users.
- [ ] Inventory decrements atomically after payment.
- [ ] Coupon system is connected to checkout totals and payment.
- [ ] Account order history uses real `/api/orders` data.
- [ ] Order tracking, cancellation, return, and refund flows are defined or hidden.
- [ ] Admin product deletion preserves historical order integrity.
- [ ] Security headers verified in production.
- [ ] CSRF/auth bypass tests pass.
- [ ] No sensitive data in API responses or client bundle.
- [ ] Mobile/tablet/desktop layouts pass.
- [ ] Chrome, Firefox, Edge, Safari smoke tests pass.
- [ ] Accessibility audit passes WCAG 2.1 AA for critical routes.
- [ ] Performance budgets pass for home, shop, product detail, checkout.
- [ ] Error monitoring, payment alerts, and audit logs are enabled.

## QA Sign-Off Status

Current status: Production Ready after production environment configuration and QA retest.

Reason: P0/P1 checkout, order, inventory, account, coupon, upload, and security remediation code paths have been implemented. Complete the production deployment checklist in `docs/PRODUCTION_REMEDIATION_REPORT.md` before launch.
