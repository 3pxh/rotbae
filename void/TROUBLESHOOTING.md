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

## Getting More Help

If you're still stuck:
1. Check Supabase Edge Functions logs for detailed error messages
2. Check Stripe Dashboard → Developers → Logs for API errors
3. Share the error message from browser console (with improved error handling)

