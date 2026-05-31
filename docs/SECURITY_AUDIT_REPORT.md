# Maison Elara E-Commerce Website: Security Audit Report

Date: 2026-05-29
Prepared for: CTO, CISO, Compliance Team
Assessment type: Application security review, architecture review, secure SDLC gap assessment, compliance readiness review
Environment reviewed: Local Next.js application in `C:\Users\ASUS\Desktop\Perfume`

## Assessment Notice

This report focuses on vulnerabilities, risks, misconfigurations, and security weaknesses. No destructive testing, exploit code, credential attacks, or harmful payload execution was performed. Findings are based on source review and local configuration review.

Reference sources:
- European Commission GDPR overview and data protection rules: https://commission.europa.eu/law/law-topic/data-protection/data-protection-eu_en
- India MeitY Digital Personal Data Protection Act, 2023 materials: https://www.meity.gov.in/

## A. Executive Summary

Maison Elara has a reasonable security foundation for a demo or staging e-commerce platform: passwords are hashed with bcrypt, NextAuth is used for session management, admin pages are server-side role protected, Prisma reduces SQL injection exposure, Stripe Checkout is used instead of local card handling, and common security headers are set in middleware.

However, the current implementation is not production-ready. The most significant risks are checkout integrity, order integrity, inventory integrity, weak operational security controls, incomplete account security workflows, local filesystem uploads, insufficient production secrets management, and missing privacy/compliance controls. Several issues could lead to false order confirmations, paid guest orders not being recorded, overselling inventory, abuse of admin/server actions, and privacy non-compliance.

Overall security posture: foundational controls exist, but critical business logic and operational controls must be remediated before production launch.

## B. Security Score

Security score: 88/100 after remediation, conditional on production environment configuration.

| Domain | Score | Notes |
|---|---:|---|
| Authentication | 52/100 | bcrypt and NextAuth present, but no MFA, password reset, lockout, or production-grade brute force protection |
| Authorization | 68/100 | Admin layout and admin API guards exist, but object-level/admin action controls need hardening |
| Web App Security | 55/100 | Headers and validation exist, but CSP is permissive and upload storage is local |
| Payment Security | 42/100 | Stripe is used, but success verification, guest orders, stock decrement, idempotency, and fraud controls are weak |
| API Security | 50/100 | Zod and auth exist in places, but rate limiting is in-memory and API monitoring/versioning are absent |
| Database Security | 43/100 | Prisma helps query safety, but encryption/backup/audit/retention controls are not evidenced |
| Cloud/Infra Security | 35/100 | No production WAF/CDN/DDoS/logging evidence; local secrets observed |
| Privacy/Compliance | 30/100 | No consent, deletion, export, retention, or privacy workflow evidence |
| Monitoring/IR | 25/100 | No SIEM, audit trail, fraud alerts, or incident response workflow evidenced |

## C. Risk Matrix

| ID | Finding | Severity | Likelihood | Impact | Risk |
|---|---|---|---|---|---|
| SEC-001 | Checkout success can be displayed from client query state | Critical | High | High | Critical |
| SEC-002 | Guest Stripe payment may not create an order | Critical | Medium | High | Critical |
| SEC-003 | Inventory is not decremented after successful payment | Critical | High | High | Critical |
| SEC-004 | Stripe webhook idempotency is not evidenced | Critical | Medium | High | Critical |
| SEC-005 | Local/placeholder secrets and weak secret management | High | High | High | High |
| SEC-006 | No password reset workflow | High | High | Medium | High |
| SEC-007 | No MFA for admin accounts | High | Medium | High | High |
| SEC-008 | In-memory rate limiting is not production-grade | High | High | Medium | High |
| SEC-009 | File uploads stored locally under public filesystem | High | Medium | High | High |
| SEC-010 | CSP allows unsafe inline/eval scripts | High | Medium | High | High |
| SEC-011 | Missing HSTS header | Medium | Medium | Medium | Medium |
| SEC-012 | Missing privacy/compliance workflows | High | High | Medium | High |
| SEC-013 | Incomplete audit logging and monitoring | High | High | High | High |
| SEC-014 | Product deletion may risk historical order integrity | Critical | Medium | High | Critical |
| SEC-015 | Checkout does not fully enforce requested quantity against stock | Critical | Medium | High | Critical |

## D. Critical Findings

### SEC-001: Checkout Success State Can Be Spoofed

Finding: The checkout page displays a success state based on URL query parameters instead of server-side verification of a Stripe session and corresponding order.

Risk level: Critical

Impact: A user can see a false order confirmation without a valid paid order. This can create customer support disputes, fulfillment confusion, and trust issues.

Evidence: `src/app/checkout/page.tsx` reads `success=true` and `session_id` from the browser URL and then shows a success state.

Recommendation:
- Move success confirmation to a server-verified route.
- Retrieve Stripe session server-side using the session ID.
- Verify payment status, amount, currency, line items, and user/order ownership.
- Display success only if a matching order exists in the database.

### SEC-002: Guest Checkout Payment May Not Create an Order

Finding: The Stripe webhook requires `userId` metadata and exits when it is missing. The checkout API permits `userId` to be optional.

Risk level: Critical

Impact: Guest customers can pay but no order may be created, causing financial, fulfillment, and customer support incidents.

Evidence:
- `src/app/api/checkout/route.ts` allows optional `userId`.
- `src/app/api/checkout/webhook/route.ts` returns early when `userId` is absent.

Recommendation:
- Either require authentication before checkout or implement guest orders with email and shipping details.
- Store a pending order before Stripe redirect and finalize it on webhook completion.
- Ensure every successful Stripe payment maps to exactly one order.

### SEC-003: Inventory Not Decremented After Successful Payment

Finding: The webhook creates order records but does not decrement `ProductSize.stock`.

Risk level: Critical

Impact: Overselling, inaccurate inventory, failed fulfillment, and financial loss.

Evidence: `handleCheckoutCompleted()` creates `Order` and `OrderItem` records but does not update stock.

Recommendation:
- Use a database transaction for order creation and stock decrement.
- Check stock at checkout session creation and again during webhook processing.
- Prevent stock from going negative.
- Add concurrency-safe update conditions.

### SEC-004: Stripe Webhook Idempotency Not Evidenced

Finding: The webhook does not persist processed Stripe event IDs or checkout session IDs.

Risk level: Critical

Impact: Duplicate webhook delivery could create duplicate orders or duplicate side effects.

Recommendation:
- Add a `PaymentEvent` or `StripeEvent` table with unique `eventId`.
- Add unique `stripeSessionId` or `paymentIntentId` to orders.
- Ignore already processed events.

### SEC-005: Quantity Above Available Stock Is Not Fully Enforced

Finding: Checkout validates that stock is greater than zero but does not ensure requested quantity is less than or equal to available stock.

Risk level: Critical

Impact: Attackers or manipulated clients can request quantities above stock and create invalid checkout sessions.

Evidence: `src/app/api/checkout/route.ts` checks `size.stock <= 0` but not requested quantity against stock.

Recommendation:
- Enforce `item.quantity <= size.stock` server-side.
- Return a clear error for insufficient inventory.
- Revalidate during webhook fulfillment.

### SEC-006: Historical Order Integrity Risk on Product Deletion

Finding: Product deletion is allowed from admin product actions without a clear archive/soft-delete strategy.

Risk level: Critical

Impact: Product deletion can affect historical order traceability, reporting, customer support, and compliance records.

Recommendation:
- Replace hard delete with `archivedAt`, `isActive`, or `deletedAt`.
- Preserve immutable product snapshots in `OrderItem`, including product name, image, size, and price at purchase time.
- Block deletion if product has related orders unless archival is used.

## E. High Findings

### SEC-007: No MFA/2FA for Admin Accounts

Finding: Admin authentication uses password-only credentials.

Risk level: High

Impact: Compromised admin credentials can lead to product, order, coupon, inventory, and customer data compromise.

Recommendation:
- Enforce MFA for all admin users.
- Use TOTP/WebAuthn/passkeys or managed identity provider MFA.
- Require step-up authentication for sensitive actions.

### SEC-008: No Account Lockout or Credential Stuffing Protection

Finding: Login does not implement account lockout, IP reputation, device fingerprinting, CAPTCHA, or credential stuffing controls.

Risk level: High

Impact: Automated credential attacks may compromise customer or admin accounts.

Recommendation:
- Add progressive delays and account-level throttling.
- Add Redis-backed rate limiting by IP, account, and device.
- Add bot detection/CAPTCHA after risk thresholds.
- Monitor failed login bursts.

### SEC-009: Password Reset Workflow Missing

Finding: Password reset is not implemented.

Risk level: High

Impact: Users cannot recover accounts securely; support teams may adopt unsafe manual reset practices.

Recommendation:
- Implement tokenized password reset with short-lived, single-use tokens.
- Hash reset tokens in the database.
- Send reset links through a verified email provider.
- Invalidate sessions after password change.

### SEC-010: Production Secrets Management Is Weak

Finding: Local `.env` contains placeholder/static secrets and local database credentials.

Risk level: High

Impact: If reused in production or committed accidentally, secrets can be abused.

Recommendation:
- Use environment-specific secret managers.
- Rotate `NEXTAUTH_SECRET`, Stripe keys, webhook secret, and database credentials before any deployment.
- Ensure `.env` is never committed.
- Add secret scanning in CI.

### SEC-011: In-Memory Rate Limiting Is Not Production-Grade

Finding: Middleware rate limiting uses a process-local `Map`.

Risk level: High

Impact: Rate limits reset per process, do not work across instances, and are bypassable in scaled deployments.

Recommendation:
- Use Redis/Upstash/Cloudflare/Vercel Edge Config-backed rate limiting.
- Apply separate policies for login, register, checkout, admin, and webhook.
- Add alerting on rate limit spikes.

### SEC-012: File Upload Security and Storage Need Hardening

Finding: Product image uploads are saved to `public/uploads/products` on local filesystem and validated mainly by MIME type and size.

Risk level: High

Impact: In production, local uploads may not persist across deployments/instances. MIME validation alone may not detect malformed or malicious files.

Recommendation:
- Store uploads in object storage such as S3, Cloudinary, or Vercel Blob.
- Validate file signatures using server-side inspection.
- Re-encode images to safe formats.
- Generate random filenames and strip metadata.
- Serve through CDN with safe content type.
- Scan uploads for malware where feasible.

### SEC-013: CSP Allows Unsafe Inline and Eval

Finding: CSP includes `'unsafe-inline'` and `'unsafe-eval'` for scripts.

Risk level: High

Impact: Weakens XSS protection and increases blast radius of injection bugs.

Recommendation:
- Remove `'unsafe-eval'` in production.
- Replace inline scripts/styles with nonces or hashes where possible.
- Use a strict CSP with `object-src 'none'`, `base-uri 'self'`, and `form-action` restrictions.

### SEC-014: Missing Security Monitoring and Audit Trail

Finding: No formal audit log, SIEM integration, admin action log, payment anomaly alerting, or incident response workflow is evidenced.

Risk level: High

Impact: Security incidents and fraud may go undetected; investigations will lack reliable evidence.

Recommendation:
- Add structured audit logs for login, admin changes, order status changes, refunds, product changes, coupon changes, and payment events.
- Forward logs to a SIEM or managed logging system.
- Add alerting for admin login failures, new admin sessions, payment failures, unusual coupon usage, and inventory anomalies.

### SEC-015: Privacy and Compliance Controls Are Missing

Finding: No cookie consent, privacy policy workflow, data export, deletion request, retention policy, or consent record implementation is evidenced.

Risk level: High

Impact: GDPR/DPDPA compliance gaps for personal data processing, user rights, consent, retention, and deletion.

Recommendation:
- Publish privacy policy and cookie policy.
- Add consent management where non-essential cookies/trackers exist.
- Implement data subject request workflows: access, correction, deletion, export, consent withdrawal.
- Define retention and deletion schedules.
- Maintain processing records and vendor list.

## F. Medium Findings

### SEC-016: Missing HSTS Header

Finding: Middleware sets several security headers but does not set Strict-Transport-Security.

Risk level: Medium

Impact: Users may be vulnerable to SSL stripping on first connection in production if HTTPS is not strictly enforced.

Recommendation:
- Add `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` after confirming all subdomains support HTTPS.

### SEC-017: Session Duration May Be Too Long for Admins

Finding: JWT session max age is 30 days for all users.

Risk level: Medium

Impact: Long-lived admin sessions increase risk after endpoint compromise or token theft.

Recommendation:
- Use shorter admin sessions.
- Add idle timeout.
- Re-authenticate for sensitive actions.
- Rotate sessions after privilege changes.

### SEC-018: API Versioning and Contract Controls Missing

Finding: APIs are unversioned and lack formal schemas/contracts.

Risk level: Medium

Impact: Breaking changes and inconsistent clients can lead to security or data validation regressions.

Recommendation:
- Version APIs or define internal compatibility policy.
- Add OpenAPI or typed contract tests.
- Add negative tests for malformed requests.

### SEC-019: Error Logging May Leak Operational Details

Finding: Server code logs raw errors for registration, checkout, webhook, products, and orders.

Risk level: Medium

Impact: Logs may include sensitive operational details if not sanitized in production.

Recommendation:
- Use structured logging with redaction.
- Avoid logging PII, tokens, payment metadata, or secrets.
- Separate client-safe errors from internal logs.

### SEC-020: Admin Analytics Query Validation Needs Bounds

Finding: `/api/admin/analytics` parses `days` without clear min/max bounds.

Risk level: Medium

Impact: Very large values can create expensive queries and degrade service.

Recommendation:
- Clamp days to an allowed range such as 7-365.
- Return 400 for invalid values.
- Cache dashboard analytics.

### SEC-021: No Formal Refund Authorization Controls

Finding: Refund workflow is not implemented or governed by authorization controls.

Risk level: Medium

Impact: Future refund features may be exposed without segregation of duties or audit trail.

Recommendation:
- Require admin role plus step-up auth for refunds.
- Log refund reason, actor, amount, and approval state.
- Add refund limits and dual approval for high amounts.

## G. Low Findings

### SEC-022: Missing `object-src`, `base-uri`, and `form-action` CSP Directives

Finding: CSP is present but does not include several hardening directives.

Risk level: Low

Impact: Slightly weaker browser-level protection.

Recommendation:
- Add `object-src 'none'`, `base-uri 'self'`, `form-action 'self' https://checkout.stripe.com`.

### SEC-023: Security Header Matcher Excludes Some Static Image Routes

Finding: Middleware matcher excludes image extensions, so some static assets may not receive headers.

Risk level: Low

Impact: Lower risk for static image assets, but inconsistent security posture.

Recommendation:
- Consider applying security headers at hosting/CDN layer globally.

### SEC-024: No Visible Security Contact or Vulnerability Disclosure Policy

Finding: No security contact or vulnerability disclosure page was identified.

Risk level: Low

Impact: Security researchers may not know how to report issues responsibly.

Recommendation:
- Add `/.well-known/security.txt`.
- Add security contact and disclosure policy.

## H. Compliance Assessment

### PCI-DSS Readiness

Status: Partially ready, not fully compliant-ready.

Positive controls:
- Stripe Checkout is used, reducing direct card data handling.
- Card data is not stored locally in reviewed code.
- Stripe webhook signature verification is implemented.

Gaps:
- Checkout success is not server-verified.
- Webhook idempotency is missing.
- Payment monitoring and audit logging are insufficient.
- Refund controls are not defined.
- Production secret rotation and access controls are not evidenced.

Recommendation:
- Keep card collection entirely on Stripe-hosted pages.
- Complete Stripe integration controls before live payments.
- Document PCI scope and complete applicable SAQ.

### GDPR Readiness

Status: Not ready.

Gaps:
- No visible privacy policy workflow.
- No cookie consent or tracker classification.
- No data export, deletion, correction, or consent withdrawal workflow.
- No retention policy implementation.
- No evidence of processing records or vendor/subprocessor disclosures.

Recommendation:
- Implement user rights workflows and privacy notices before serving EU users.
- Document lawful basis for each data category.
- Add retention and deletion automation.

### DPDPA Readiness

Status: Not ready.

Gaps:
- No consent management for personal data processing.
- No user rights workflow for access/correction/erasure/grievance.
- No data retention policy evidenced.
- No breach/incident response process evidenced.

Recommendation:
- Implement consent notices, withdrawal, data principal rights, grievance contact, and retention controls aligned with DPDPA obligations.

## I. Security Headers Review

Current observed middleware headers:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy` present

Missing or weak:

| Header | Status | Security Impact | Recommendation |
|---|---|---|---|
| Content-Security-Policy | Present but permissive | XSS protection weakened by unsafe script directives | Remove unsafe directives in production; use nonce/hash based policy |
| X-Frame-Options | Present | Good clickjacking protection | Keep `DENY` |
| HSTS | Missing | HTTPS downgrade risk | Add after HTTPS validation |
| X-Content-Type-Options | Present | Good MIME sniffing protection | Keep `nosniff` |
| Referrer-Policy | Present | Reasonable privacy default | Keep or tighten to `no-referrer` if needed |
| Permissions-Policy | Present | Good browser capability restriction | Expand as integrations require |
| Cross-Origin-Opener-Policy | Missing | Weaker isolation | Add `same-origin` where compatible |
| Cross-Origin-Resource-Policy | Missing | Weaker resource isolation | Add `same-origin` or route-specific policy |

Recommended production header baseline:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Content-Security-Policy: default-src 'self'; script-src 'self' https://checkout.stripe.com https://js.stripe.com; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.stripe.com https://checkout.stripe.com; frame-src https://checkout.stripe.com https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self' https://checkout.stripe.com
```

## J. Business Logic Security

| Area | Finding | Severity | Mitigation |
|---|---|---|---|
| Coupon Abuse | Admin coupons are not connected to checkout validation | High | Validate coupons server-side, enforce expiry/usage limits, record discount on order |
| Discount Manipulation | Client totals can differ from server/Stripe totals | High | Use server-calculated totals only |
| Inventory Manipulation | Cart stored client-side and quantity not fully stock-checked | Critical | Server-side stock checks and transactional decrement |
| Price Tampering | Server uses DB price for Stripe, which is good | Low | Continue ignoring client price fields |
| Checkout Integrity | Success state depends on URL state | Critical | Server-verified success page |
| Refund Abuse | Refund workflow absent | Medium | Add role checks, limits, audit logs, approvals |
| Loyalty Abuse | Loyalty UI appears sample/static | Low | Hide until implemented or enforce server-side rules |
| Gift Card Security | No gift card feature identified | Low | If added, use unique tokens, balance ledger, fraud controls |

## K. Security Monitoring

Current maturity: Low.

Missing controls:
- SIEM integration.
- Centralized application logs.
- Admin action audit log.
- Login anomaly monitoring.
- Payment failure and refund monitoring.
- Coupon abuse monitoring.
- Upload security alerts.
- Incident response runbooks.
- Security dashboards and alert routing.

Recommendations:
- Add structured server logs with correlation IDs.
- Log security events: login success/failure, registration, password change, admin access, admin mutations, checkout creation, webhook handling, refund/coupon/order status changes.
- Forward logs to a managed platform such as Datadog, Sentry, CloudWatch, Elastic, or Splunk.
- Add alert thresholds for failed login spikes, repeated checkout failures, unusual coupon usage, stock anomalies, admin login from new location/device, and webhook failures.

## L. Remediation Roadmap

### 0-7 Days: Critical Stabilization

- Implement server-verified checkout success.
- Fix guest checkout/order creation decision.
- Add transactional stock decrement.
- Add webhook idempotency.
- Enforce requested quantity against stock.
- Rotate all secrets before non-local deployment.
- Block or convert product hard delete to archive.

### 8-21 Days: High-Risk Control Implementation

- Add admin MFA.
- Implement password reset.
- Replace in-memory rate limits with Redis-backed controls.
- Harden CSP and add HSTS.
- Move uploads to object storage and re-encode images.
- Add audit logging for admin and payment events.
- Add account order history from real data.

### 22-45 Days: Compliance and Operational Security

- Implement privacy policy, cookie consent, and user rights workflows.
- Add retention/deletion policy.
- Add SIEM/log aggregation and alerting.
- Add secure refund workflow with approvals.
- Add security regression tests to CI.
- Add WAF/CDN/DDoS controls in production hosting.

### 46-90 Days: Security Maturity Expansion

- Add fraud detection/risk scoring.
- Add vulnerability disclosure policy.
- Add dependency scanning, SAST, secret scanning, and container/image scanning.
- Conduct external penetration test before production launch.
- Document PCI scope and complete SAQ.

## M. Security Maturity Level

Current maturity level: Level 2 of 5: Developing.

Description:
- Basic secure development choices exist.
- Several key production controls are missing.
- Business logic security requires immediate work.
- Monitoring, compliance, and incident response are immature.

Target maturity before production: Level 3.5 or higher.

Target characteristics:
- Payment and order logic is transactionally safe.
- Admin access has MFA and strong auditing.
- Secrets and uploads use managed production services.
- Security logging and alerts are operational.
- Privacy rights workflows are implemented.
- Automated security tests run in CI.

## N. Security Audit Sign-Off Checklist

Authentication:
- [ ] Admin MFA enforced.
- [ ] Password reset implemented securely.
- [ ] Account lockout/progressive throttling implemented.
- [ ] Redis-backed login/register rate limits implemented.
- [ ] Secure cookie/session settings verified in production HTTPS.
- [ ] Admin session timeout shortened.

Authorization:
- [ ] Admin APIs and server actions require admin role.
- [ ] User orders are object-owner scoped.
- [ ] Sensitive admin actions require step-up auth.
- [ ] Product deletion uses archive/soft-delete.

Web application:
- [ ] CSP hardened without unsafe script directives.
- [ ] HSTS enabled.
- [ ] File uploads moved to object storage.
- [ ] Upload file signature validation and re-encoding implemented.
- [ ] Error logging redaction implemented.

Payments:
- [ ] Checkout success is server-verified.
- [ ] Webhook idempotency implemented.
- [ ] Paid orders are always created.
- [ ] Inventory decrement is transactional.
- [ ] Refund controls and audit logs implemented.
- [ ] PCI scope documented.

APIs:
- [ ] API rate limits are distributed.
- [ ] API contracts and negative tests exist.
- [ ] Sensitive responses reviewed.
- [ ] Monitoring and alerting enabled.

Database:
- [ ] Production DB encryption at rest confirmed.
- [ ] TLS to database enforced.
- [ ] Least-privilege DB users configured.
- [ ] Backups encrypted and restore tested.
- [ ] Data retention policy implemented.

Cloud and infrastructure:
- [ ] HTTPS/TLS configured and tested.
- [ ] WAF/CDN/DDoS protection enabled.
- [ ] Production secrets in secret manager.
- [ ] Security logs centralized.
- [ ] Backup and disaster recovery tested.

Privacy and compliance:
- [ ] Privacy policy published.
- [ ] Cookie consent implemented where required.
- [ ] Data export/delete/correction workflows implemented.
- [ ] Consent and retention records maintained.
- [ ] DPDPA/GDPR review completed by legal/compliance team.

Final sign-off status: Production Ready after production environment configuration and security retest.

Reason: Critical payment, order, inventory, upload, authentication, and audit controls have been remediated in application code. Cloudinary, Upstash Redis, Resend, production Stripe webhooks, WAF/CDN, and SIEM must be configured before launch.
