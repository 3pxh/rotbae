# Troubleshooting Edge Function Errors

## Error: "Edge Function returned a non-2xx status code"

This error means the Edge Function is being called but returning an error status (400, 500, etc.).

### Step 1: Check Edge Function is Deployed

1. Go to Supabase Dashboard → Edge Functions
2. Verify `create-checkout-session` is listed and shows "Active" status
3. If not deployed, run:
   ```bash
   supabase functions deploy create-checkout-session
   ```

### Step 2: Check Environment Variables

1. Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
2. Verify `STRIPE_SECRET_KEY` is set:
   - Should start with `sk_test_...` (test mode) or `sk_live_...` (live mode)
   - Make sure there are no extra spaces or quotes
3. If missing, add it:
   - Name: `STRIPE_SECRET_KEY`
   - Value: Your Stripe secret key from Stripe Dashboard → Developers → API keys

### Step 3: Check Edge Function Logs

1. Go to Supabase Dashboard → Edge Functions → Logs
2. Select `create-checkout-session` function
3. Look for recent errors when you try to purchase
4. Common errors:
   - `STRIPE_SECRET_KEY is not set` → Missing environment variable
   - `Invalid API Key` → Wrong Stripe key format
   - `No such checkout session` → Stripe API error

### Step 4: Test Edge Function Directly

You can test the Edge Function directly using curl:

```bash
curl -X POST \
  'https://your-project-ref.supabase.co/functions/v1/create-checkout-session' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"x": 100, "y": 200}'
```

Replace:
- `your-project-ref` with your Supabase project reference ID
- `YOUR_ANON_KEY` with your Supabase anon key

Expected response:
```json
{"sessionId": "cs_test_..."}
```

If you get an error, check:
- The function URL is correct
- The Authorization header uses your anon key
- The request body is valid JSON

### Step 5: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try purchasing a pixel
4. Look for detailed error messages
5. The improved error handling should now show more details

### Step 6: Verify Stripe Keys Match

Make sure you're using matching keys:
- **Test mode**: `pk_test_...` (frontend) + `sk_test_...` (Edge Function)
- **Live mode**: `pk_live_...` (frontend) + `sk_live_...` (Edge Function)

You cannot mix test and live keys!

## Common Issues

### Issue: "STRIPE_SECRET_KEY is not set"
**Solution**: Add the secret key to Supabase Edge Functions secrets

### Issue: "Invalid API Key provided"
**Solution**: 
- Check the key starts with `sk_test_` or `sk_live_`
- Make sure there are no extra spaces
- Regenerate the key in Stripe Dashboard if needed

### Issue: "Function not found" or 404 error
**Solution**: 
- Deploy the function: `supabase functions deploy create-checkout-session`
- Check the function name matches exactly: `create-checkout-session`

### Issue: CORS error
**Solution**: The Edge Function already handles CORS. If you still see CORS errors, check:
- The function is deployed correctly
- You're using the correct Supabase URL

## Error: 401 "Invalid JWT" (Checkout Session)

This error means the Edge Function is receiving an invalid or missing JWT token.

### Solution 1: Verify Environment Variables (Most Likely Fix)

1. **Check your `.env` file** in the `void` directory:
   ```bash
   cd void
   cat .env
   ```

2. **Verify the anon key is correct:**
   - Go to Supabase Dashboard → Project Settings → API
   - Copy the **exact** "anon" or "public" key
   - Make sure it starts with `eyJ...`
   - Make sure there are no extra spaces or quotes in `.env`

3. **Restart the dev server** after updating `.env`:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

### Solution 2: Check Supabase Client Initialization

The Supabase client automatically includes the anon key when calling Edge Functions. Verify:

1. **Check `void/src/lib/supabase.ts`:**
   ```typescript
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
   ```
   - Make sure `VITE_SUPABASE_ANON_KEY` is set in `.env`
   - The key should match your Supabase project's anon key

2. **Test in browser console:**
   ```javascript
   // Open browser console (F12) and run:
   console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
   console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
   ```

### Common JWT Issues

1. **Wrong anon key**: Using a key from a different Supabase project
2. **Missing `.env` file**: Environment variables not loaded
3. **Dev server not restarted**: Changes to `.env` require restart
4. **Key has extra spaces**: Check for leading/trailing spaces in `.env`
5. **Key wrapped in quotes**: Don't use quotes around values in `.env`

## Error: 401 "Missing authorization header" (Webhook)

Stripe webhooks are failing with `401 - Missing authorization header` because Supabase Edge Functions require authentication by default, but Stripe webhooks don't send Authorization headers.

### Solution: Disable JWT Verification for Webhook Function

You need to configure the `stripe-webhook` Edge Function to allow anonymous/unauthenticated access.

**Using Supabase CLI (Recommended):**
```bash
npm run deploy:stripe_webhook
```

This deploys the webhook function with `--no-verify-jwt` flag.

**Using Supabase Dashboard:**
1. Go to Supabase Dashboard → Edge Functions
2. Find `stripe-webhook` function
3. Click on it to open settings
4. Look for "Verify JWT" or "Authentication" setting
5. **Disable JWT verification** for this function (set `verify_jwt = false`)

### Why This Works

- Stripe webhooks validate requests using the `stripe-signature` header, not Authorization headers
- Our webhook function verifies the Stripe signature using `stripe.webhooks.constructEventAsync()`
- We don't need Supabase JWT authentication for webhooks since Stripe provides its own security

### Verification

After configuring and redeploying:
1. Make a test purchase
2. Check Stripe Dashboard → Webhooks → Recent events
3. The webhook should now return `200 OK` instead of `401`
4. Check Supabase Dashboard → Edge Functions → Logs
5. You should see the webhook processing logs
6. Check Supabase Dashboard → Table Editor → `black_pixels`
7. The pixel should be inserted

## Error: Webhook Signature Verification Failed

If you see `"Webhook signature verification failed"` with details about `constructEventAsync`:

**Solution:** This is already fixed in the code. The webhook function uses `await stripe.webhooks.constructEventAsync()` for Deno compatibility. If you see this error:
1. Redeploy the webhook function: `npm run deploy:stripe_webhook`
2. Verify `STRIPE_WEBHOOK_SECRET` is set correctly in Supabase Edge Functions secrets

## Getting More Help

If you're still stuck:
1. Check Supabase Edge Functions logs for detailed error messages
2. Check Stripe Dashboard → Developers → Logs for API errors
3. Share the error message from browser console (with improved error handling)

