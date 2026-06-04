import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const exists = (path) => existsSync(new URL(`../${path}`, import.meta.url));

test('checkout success is server verified, not client query-string trusted', () => {
  const checkoutPage = read('src/app/checkout/page.tsx');
  const successPage = read('src/app/checkout/success/page.tsx');
  assert.equal(checkoutPage.includes("success') === 'true'"), false);
  assert.match(successPage, /stripe\.checkout\.sessions\.retrieve/);
  assert.match(successPage, /payment_status !== 'paid'/);
  assert.match(successPage, /order\.userId !== session\.user\.id/);
});

test('checkout requires authentication and validates requested quantity against stock', () => {
  const checkoutApi = read('src/app/api/checkout/route.ts');
  assert.match(checkoutApi, /getServerSession/);
  assert.match(checkoutApi, /Please sign in before checkout/);
  assert.match(checkoutApi, /item\.quantity > size\.stock/);
  assert.match(checkoutApi, /status: 409/);
});

test('stripe webhook is idempotent and decrements inventory transactionally', () => {
  const webhook = read('src/app/api/checkout/webhook/route.ts');
  assert.match(webhook, /findUnique\(\{ where: \{ stripeSessionId/);
  assert.match(webhook, /updateMany/);
  assert.match(webhook, /stock: \{ gte: item\.quantity \}/);
  assert.match(webhook, /decrement: item\.quantity/);
  assert.match(webhook, /TransactionIsolationLevel\.Serializable/);
});

test('product deletion is soft-delete archival', () => {
  const actions = read('src/app/admin/products/actions.ts');
  const schema = read('prisma/schema.prisma');
  assert.match(schema, /deletedAt\s+DateTime\?/);
  assert.match(schema, /isActive\s+Boolean\s+@default\(true\)/);
  assert.doesNotMatch(actions, /prisma\.product\.delete/);
  assert.match(actions, /PRODUCT_ARCHIVE/);
});

test('uploads use Cloudinary and validate signatures', () => {
  const upload = read('src/lib/productImageUpload.ts');
  assert.match(upload, /cloudinary\.uploader\.upload/);
  assert.match(upload, /matchesSignature/);
  assert.match(upload, /flags: 'strip_profile'/);
  assert.doesNotMatch(upload, /writeFile/);
});

test('security headers are hardened and unsafe eval is absent', () => {
  const middleware = read('src/middleware.ts');
  assert.match(middleware, /Strict-Transport-Security/);
  assert.match(middleware, /Cross-Origin-Opener-Policy/);
  assert.match(middleware, /Cross-Origin-Resource-Policy/);
  assert.match(middleware, /object-src 'none'/);
  assert.equal(middleware.includes("'unsafe-eval'"), false);
});

test('account recovery and profile persistence APIs exist', () => {
  assert.match(read('src/app/api/auth/forgot-password/route.ts'), /passwordResetToken\.create/);
  assert.match(read('src/app/api/auth/reset-password/route.ts'), /usedAt/);
  assert.match(read('src/app/api/account/profile/route.ts'), /prisma\.user\.update/);
  assert.match(read('src/app/account/page.tsx'), /fetch\('\/api\/orders'\)/);
});

test('reset-password UI page exists and reads token from URL', () => {
  assert.ok(exists('src/app/reset-password/page.tsx'), 'reset-password page should exist');
  const page = read('src/app/reset-password/page.tsx');
  assert.match(page, /useSearchParams/);
  assert.match(page, /searchParams\.get\('token'\)/);
  assert.match(page, /\/api\/auth\/reset-password/);
});

test('contact page and API route exist', () => {
  assert.ok(exists('src/app/contact/page.tsx'), 'contact page should exist');
  assert.ok(exists('src/app/api/contact/route.ts'), 'contact API route should exist');
  const contactApi = read('src/app/api/contact/route.ts');
  assert.match(contactApi, /z\.object/);
  assert.match(contactApi, /sendEmail/);
});

test('account GET endpoint exists and returns user profile with phone', () => {
  assert.ok(exists('src/app/api/account/route.ts'), 'account GET route should exist');
  const route = read('src/app/api/account/route.ts');
  assert.match(route, /prisma\.user\.findUnique/);
  assert.match(route, /phone/);
  assert.match(route, /getServerSession/);
});

test('admin orders page has pagination', () => {
  const ordersPage = read('src/app/admin/orders/page.tsx');
  assert.match(ordersPage, /take: PAGE_SIZE/);
  assert.match(ordersPage, /skip:/);
  assert.match(ordersPage, /totalPages/);
});

test('coupon pre-validation endpoint exists', () => {
  assert.ok(exists('src/app/api/checkout/coupon-validate/route.ts'), 'coupon validate route should exist');
  const route = read('src/app/api/checkout/coupon-validate/route.ts');
  assert.match(route, /getServerSession/);
  assert.match(route, /prisma\.coupon\.findFirst/);
  assert.match(route, /discountAmount/);
});

test('register page has confirm-password field and strength indicator', () => {
  const page = read('src/app/register/page.tsx');
  assert.match(page, /confirm/);
  assert.match(page, /PasswordStrength/);
  assert.match(page, /validateClientSide/);
});

test('no setState calls inside useEffect in product components', () => {
  const card = read('src/components/product/ProductCard.tsx');
  const detail = read('src/app/product/[id]/ProductDetailClient.tsx');
  // Neither file should use the old setState-in-effect mounting pattern
  assert.equal(card.includes('setMounted(true)'), false);
  assert.equal(detail.includes('setMounted(true)'), false);
  // Both should use useSyncExternalStore instead
  assert.match(card, /useSyncExternalStore/);
  assert.match(detail, /useSyncExternalStore/);
});

test('no explicit any types in key client components', () => {
  const card = read('src/components/product/ProductCard.tsx');
  const shopClient = read('src/app/shop/ShopClient.tsx');
  const homeClient = read('src/app/HomeClient.tsx');
  // These files should not use the any escape hatch
  assert.equal(card.includes(': any'), false);
  assert.equal(shopClient.includes(': any'), false);
  assert.equal(homeClient.includes(': any'), false);
});

test('stripe event idempotency is checked in webhook', () => {
  const webhook = read('src/app/api/checkout/webhook/route.ts');
  assert.match(webhook, /prisma\.stripeEvent\.findUnique/);
  assert.match(webhook, /prisma\.stripeEvent\.create/);
});

test('webauthn options and verification routes exist', () => {
  assert.ok(exists('src/app/api/account/webauthn/register/options/route.ts'));
  assert.ok(exists('src/app/api/account/webauthn/register/verify/route.ts'));
  assert.ok(exists('src/app/api/account/webauthn/login/options/route.ts'));
});

test('GDPR export and deletion routes exist', () => {
  assert.ok(exists('src/app/api/account/export/route.ts'));
  assert.ok(exists('src/app/api/account/delete/route.ts'));
});

test('account lockout and delays helpers exist', () => {
  const lockout = read('src/lib/authLockout.ts');
  assert.match(lockout, /checkLockout/);
  assert.match(lockout, /recordFailedAttempt/);
});

test('analytics API clamps days parameter and handles cache', () => {
  const analytics = read('src/app/api/admin/analytics/route.ts');
  assert.match(analytics, /days < 7/);
  assert.match(analytics, /days > 365/);
  assert.match(analytics, /cache:admin:analytics/);
});

test('admin login page exists and has mfa & passkey controls', () => {
  assert.ok(exists('src/app/admin/login/page.tsx'));
  const content = read('src/app/admin/login/page.tsx');
  assert.match(content, /admin-email/);
  assert.match(content, /admin-password/);
  assert.match(content, /admin-mfa/);
  assert.match(content, /remember-device/);
  assert.match(content, /Sign In with Passkey/);
  assert.match(content, /Access Denied: Unprivileged account/);
});

test('customer account page reads tab query and displays loyalty points & addresses', () => {
  const content = read('src/app/account/page.tsx');
  assert.match(content, /useSearchParams/);
  assert.match(content, /tabParam/);
  assert.match(content, /Loyalty Points/);
  assert.match(content, /loyaltyPoints/);
  assert.match(content, /Saved Addresses/);
  assert.match(content, /savedAddresses/);
  assert.match(content, /Recommended Fragrances/);
});

