import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

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
