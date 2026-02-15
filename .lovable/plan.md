
# Production Readiness — The Football Scout

## ✅ All items complete (except Privacy Policy / Terms review)

### Completed — High Priority
- [x] Make avatars bucket private (signed URLs)
- [x] Stripe webhook handler for subscription activation
- [x] Fix promo code race condition (moved to webhook)
- [x] Smart Discovery JSON validation

### Completed — Medium Priority
- [x] Fix /install 404 link (PWA prompt)
- [x] Fix Pricing FAQ accuracy
- [x] AI fallback UI indicator
- [x] Email confirmation cross-device edge case (user_metadata check)
- [x] Empty states for all pages (already existed)
- [x] Loading skeletons consistency (already existed)
- [x] Safe area / notch handling (already existed via CSS)

### Completed — Lower Priority
- [x] Console warning fixes (forwardRef for NotificationToggle, SyncStatusIndicator)
- [x] Query pagination: offline-first architecture loads all per-user data; 1000-row default is sufficient for individual scouts

### Remaining (Manual / External)
- [ ] Privacy Policy and Terms of Service content review (requires legal review)
- [ ] End-to-end flow testing (manual QA)
- [ ] Error monitoring service setup (e.g., Plausible analytics script already scaffolded in index.html)
