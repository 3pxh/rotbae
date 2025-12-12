# How to Disable JWT Verification for Webhook Function

## Option 1: Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Find the **`stripe-webhook`** function in the list
3. Click on it to open the function details
4. Look for settings like:
   - **"Verify JWT"** toggle/switch
   - **"Authentication"** dropdown
   - **"Security"** or **"Access"** settings
5. **Disable JWT verification** (set to `false` or "No authentication required")
6. **Save** the changes

## Option 2: Using Supabase CLI

If the Dashboard doesn't have this option, try using the CLI:

```bash
# Deploy with --no-verify-jwt flag
supabase functions deploy stripe-webhook --no-verify-jwt
```

## Option 3: Check Function Configuration

The function might need to be configured at the project level. Check:

1. **Supabase Dashboard** → **Project Settings** → **Edge Functions**
2. Look for function-specific settings
3. See if there's a way to configure authentication per function

## Why This is Needed

- Stripe webhooks don't send Authorization headers
- They use `stripe-signature` header for security instead
- Our code verifies the Stripe signature, so we don't need Supabase JWT auth
- Only Stripe can send valid webhook requests (signature verification ensures this)

## After Disabling JWT Verification

1. **Redeploy the function** (if using CLI):
   ```bash
   supabase functions deploy stripe-webhook
   ```

2. **Test the webhook**:
   - Make a test purchase
   - Check Stripe Dashboard → Webhooks → Recent events
   - Should see `200 OK` instead of `401`

3. **Verify database update**:
   - Check Supabase Dashboard → Table Editor → `black_pixels`
   - The pixel should be inserted

## Troubleshooting

If you can't find the setting in the Dashboard:
- Check Supabase documentation for your specific version
- The setting might be in a different location
- Contact Supabase support if needed
- As a workaround, you might need to use the service role key (less secure but works)

