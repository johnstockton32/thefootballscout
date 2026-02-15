

# Production Readiness Recommendations for The Football Scout

## 1. Security Fixes (High Priority)

### 1a. Make the Avatars Storage Bucket Private
The `avatars` bucket is currently public, meaning anyone with a direct URL can view user profile photos without authentication. The `player-photos` bucket was already fixed to be private -- avatars should follow the same pattern using signed URLs.

### 1b. Add JSON Structure Validation in Smart Discovery
After parsing the AI response JSON, validate that the result has the expected `matches` array structure before using it. This prevents unexpected behavior if the AI returns malformed data.

---

## 2. Stripe Checkout Flow Hardening (High Priority)

### 2a. Webhook for Subscription Activation
Currently the Pricing FAQ says "No credit card required to start" the Pro trial, but the `create-checkout` function adds a 14-day trial via Stripe checkout (which does require a card). Ensure there is a Stripe webhook handler (`stripe-webhook` edge function) to properly update `profiles.subscription_tier` when payments succeed or fail. Without this, subscription status relies solely on the checkout session metadata and manual updates, which can get out of sync.

### 2b. Promo Code Race Condition
The `create-checkout` function increments promo code usage *before* the payment completes. If the user abandons checkout, the code has been "used" but no payment was made. Move the increment to the Stripe webhook handler after successful payment.

---

## 3. Email Confirmation Flow (Medium Priority)

### 3a. Post-Confirmation Redirect
When a Pro user signs up and needs to confirm their email first, the app stores `pending_pro_signup` in localStorage. However, if the user confirms their email on a different device/browser, they will never be redirected to Stripe checkout. Add a server-side check (e.g., on first login after signup) to redirect to checkout if the profile is still on the free tier but was created with a Pro intent.

---

## 4. Error Handling and User Experience (Medium Priority)

### 4a. Graceful AI Service Degradation Messaging
The AI fallback is implemented, but the UI should clearly indicate to users when they are seeing fallback (non-AI) insights vs. real AI insights. Consider adding a subtle banner like "AI service temporarily unavailable -- showing basic analysis" so users understand the difference.

### 4b. Loading States Consistency
Ensure all pages (especially Players, Reports, Dashboard) show consistent skeleton loading states rather than blank screens while data loads.

### 4c. Empty States
Add helpful empty states with clear calls-to-action on pages like Players (no players yet), Reports (no reports yet), Watchlists (no watchlists yet), and Dashboard (new user with no data).

---

## 5. Mobile Polish (Medium Priority)

### 5a. PWA Install Prompt
The app has PWA configuration (`vite-plugin-pwa`) but there is no `/install` page despite the Pricing page linking to it (`navigate('/install')`). This will lead to a 404. Either create the install page or remove/redirect the link.

### 5b. Safe Area and Notch Handling
Verify that `safe-area-top` and `safe-area-bottom` CSS utilities are correctly defined and work on iOS devices with notches.

---

## 6. Content and Legal (Medium Priority)

### 6a. Privacy Policy and Terms Accuracy
Verify that the Privacy Policy and Terms of Service pages contain accurate, legally reviewed content that matches the actual data handling practices (GDPR consent, data retention, third-party AI processing).

### 6b. FAQ Accuracy on Pricing Page
The FAQ states "No credit card required to start" for the Pro trial, but the Stripe checkout flow does collect payment info upfront (with a 14-day trial). Update the FAQ to be accurate: "Start with a 14-day free trial. You won't be charged until the trial ends."

---

## 7. Performance Optimizations (Lower Priority)

### 7a. Image Optimization
Ensure player photos and avatars served via signed URLs have appropriate cache headers and consider adding image resizing/compression on upload.

### 7b. Query Pagination
For scouts with many players or reports, ensure list pages implement proper pagination rather than loading all records at once (the default Supabase limit is 1,000 rows).

---

## 8. Testing and Monitoring (Lower Priority)

### 8a. End-to-End Flow Testing
Before launch, manually test these critical flows:
- Sign up (Free) --> confirm email --> login --> dashboard
- Sign up (Pro) --> confirm email --> Stripe checkout --> dashboard with Pro features
- Create player --> create scouting report --> view AI insights
- Export PDF report with branding
- Promo code redemption (both free upgrade and Stripe-based codes)
- Password reset flow
- Account deletion

### 8b. Error Monitoring
Consider adding a lightweight error tracking service to capture production errors from real users.

---

## Summary Priority Matrix

| Priority | Item | Effort |
|----------|------|--------|
| High | Make avatars bucket private | Easy |
| High | Add Stripe webhook handler | Medium |
| High | Fix promo code race condition | Easy |
| Medium | Fix /install 404 link | Easy |
| Medium | Fix Pricing FAQ accuracy | Easy |
| Medium | AI fallback UI indicator | Easy |
| Medium | Email confirmation edge cases | Medium |
| Medium | Empty states for all pages | Medium |
| Lower | Image optimization | Medium |
| Lower | Query pagination | Medium |
| Lower | Error monitoring setup | Medium |

## Technical Details

**Files to create:**
- `supabase/functions/stripe-webhook/index.ts` -- handles Stripe events (checkout.session.completed, invoice.paid, customer.subscription.deleted)

**Files to modify:**
- `supabase/functions/create-checkout/index.ts` -- remove promo code increment (move to webhook)
- `src/pages/Pricing.tsx` -- fix FAQ text, remove /install link
- `src/components/ai/AIInsightsPanel.tsx` -- add fallback indicator
- `supabase/functions/smart-discovery/index.ts` -- add JSON structure validation
- Database migration -- make avatars bucket private, update storage policies

