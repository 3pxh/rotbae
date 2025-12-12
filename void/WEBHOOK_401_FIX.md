# Fixing Webhook 401 "Missing authorization header" Error

## Problem
Stripe webhooks are failing with `401 - Missing authorization header` because Supabase Edge Functions require authentication by default, but Stripe webhooks don't send Authorization headers.

## Solution

You need to configure the `stripe-webhook` Edge Function to allow anonymous/unauthenticated access. There are two ways to do this:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard → Edge Functions
2. Find `stripe-webhook` function
3. Click on it to open settings
4. Look for "Verify JWT" or "Authentication" setting
5. **Disable JWT verification** for this function (set `verify_jwt = false`)

### Option 2: Using Supabase CLI

Create a config file or use the CLI to set the function to allow anonymous access:

```bash
supabase functions update stripe-webhook --no-verify-jwt
```

Or add to your `supabase/config.toml`:

```toml
[functions.stripe-webhook]
verify_jwt = false
```

### Option 3: Manual Configuration File

I've created a config file at `supabase/functions/stripe-webhook/.supabase/config.toml` with:
```toml
[functions.stripe-webhook]
verify_jwt = false
```

After creating/updating the config, redeploy:
```bash
supabase functions deploy stripe-webhook
```

## Why This Works

- Stripe webhooks validate requests using the `stripe-signature` header, not Authorization headers
- Our webhook function verifies the Stripe signature using `stripe.webhooks.constructEvent()`
- We don't need Supabase JWT authentication for webhooks since Stripe provides its own security

## Verification

After configuring and redeploying:

1. Make a test purchase
2. Check Stripe Dashboard → Webhooks → Recent events
3. The webhook should now return `200 OK` instead of `401`
4. Check Supabase Dashboard → Edge Functions → Logs
5. You should see the webhook processing logs
6. Check Supabase Dashboard → Table Editor → `black_pixels`
7. The pixel should be inserted

## Security Note

This is safe because:
- Stripe validates the webhook signature (we verify it in code)
- Only Stripe can send valid webhook requests
- The database function uses `SECURITY DEFINER` to safely insert pixels

