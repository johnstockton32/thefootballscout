

## Fix: AI Edge Functions Not Working in Production

### Root Cause

The CORS configuration in `supabase/functions/_shared/cors.ts` is missing required headers that the Supabase JS client sends with every request. When the browser makes a preflight (OPTIONS) request, the server responds saying it only allows `authorization, x-client-info, apikey, content-type` -- but the Supabase client also sends additional platform headers. The browser blocks the actual request, so the AI functions never execute.

### Changes

**1. Update `supabase/functions/_shared/cors.ts`**

Update the `Access-Control-Allow-Headers` to include all headers sent by the Supabase JS client:

```
authorization, x-client-info, apikey, content-type,
x-supabase-client-platform, x-supabase-client-platform-version,
x-supabase-client-runtime, x-supabase-client-runtime-version
```

This is the standard set recommended for Supabase edge functions. No other files need to change since both `ai-scouting-insights` and `smart-discovery` import from this shared file.

**2. Redeploy both AI edge functions**

After the CORS fix, redeploy `ai-scouting-insights` and `smart-discovery` so the updated headers take effect in production.

### Why This Fixes It

- The Supabase JS v2 client automatically attaches `x-supabase-client-*` headers to every request
- Browsers enforce CORS strictly: if a preflight response doesn't list a header the request will use, the browser silently blocks the request
- This explains why there are no error logs in the functions -- the requests never reach them
- Adding the missing headers to the CORS config allows the preflight to succeed, letting the actual AI requests go through
