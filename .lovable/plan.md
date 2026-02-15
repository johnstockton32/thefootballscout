

## Fix: Admin User Deletion

### Problem
The delete-account backend function has two issues:
1. It may not have been properly deployed (redeployment already done during investigation)
2. It's missing cleanup for 3 tables: `feature_feedback`, `contact_messages`, and `player_development_notes` -- these won't block deletion (no FK constraints) but leave orphaned data

### Changes

**1. Update `supabase/functions/delete-account/index.ts`**

Add the 3 missing tables to the deletion steps array:
- `feature_feedback` (column: `user_id`)
- `contact_messages` (column: `user_id`)
- `player_development_notes` (column: `scout_id`)

Add better error logging so if deletion fails again, the exact cause will be visible in the function logs.

Pin the Supabase JS import to a specific recent version (e.g., `@2.49.4`) to ensure `getClaims` is always available and avoid potential breaking changes from unpinned imports.

### Technical Details

The database has `ON DELETE CASCADE` on all foreign keys referencing `auth.users`, so deleting the auth user cascades to: `profiles`, `user_roles`, `players`, `scouting_reports`, `custom_attribute_weights`, `branding_settings`, and their child tables. The manual deletion in the edge function is a belt-and-suspenders approach using the service role client.

Tables like `watchlists`, `push_subscriptions`, `saved_searches`, `report_templates`, and `promo_code_redemptions` have no FK to `auth.users` -- the edge function already handles these manually. The fix adds the 3 remaining tables that were overlooked.

