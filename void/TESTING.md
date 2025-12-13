# Testing Guide

## Prerequisites

1. ✅ Supabase database schema is set up (`supabase-schema.sql` executed)
2. ✅ Edge Functions are deployed
3. ✅ Environment variables are configured
4. ✅ Stripe webhook is configured

## Step 1: Start the App Locally

```bash
cd void
npm run dev
```

The app should start at `http://localhost:5173/void/`

## Step 2: Test Supabase Connection

### 2.1 Check Browser Console
- Open browser DevTools (F12)
- Check the Console tab for any Supabase connection errors
- You should see the canvas loading (all white initially)

### 2.2 Verify Database Connection
- Open Supabase Dashboard → Table Editor → `black_pixels`
- The table should be empty (or have existing black pixels)
- If you see errors in console, check:
  - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `void/.env`
  - Supabase project is active

## Step 3: Test Stripe Checkout Flow

### 3.1 Use Stripe Test Mode
Make sure you're using Stripe **test mode** keys:
- Test publishable key starts with `pk_test_...`
- Test secret key starts with `sk_test_...`

### 3.2 Test Purchase Flow
1. Click any white pixel on the canvas
2. Modal should open showing:
   - 256x256 pixel preview (white)
   - Coordinate inputs (x: and y:)
   - "$1" button
3. Click the "$1" button
4. You should see processing arrows (→, ↓, ←, ↑) animating
5. You should be redirected to Stripe Checkout

### 3.3 Complete Test Payment
Use Stripe test card:
- **Card number**: `4242 4242 4242 4242`
- **Expiry**: Any future date (e.g., `12/34`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

After successful payment:
- You should be redirected back to `/void?session_id=...&x=...&y=...`
- The app should reload pixels from Supabase
- The purchased pixel should now be black

## Step 4: Verify Webhook Processing

### 4.1 Check Stripe Dashboard
1. Go to Stripe Dashboard → Developers → Events
2. Find the `checkout.session.completed` event
3. Verify it was sent to your webhook endpoint
4. Check the webhook response (should be 200 OK)

### 4.2 Check Supabase Database
1. Go to Supabase Dashboard → Table Editor → `black_pixels`
2. You should see a new row with:
   - `x`: The x coordinate you purchased
   - `y`: The y coordinate you purchased
   - `created_at`: Timestamp of when it was created

### 4.3 Verify Pixel is Black
1. Refresh the app (`http://localhost:5173/void/`)
2. Click on the pixel you just purchased
3. The modal should show:
   - 256x256 pixel preview (black)
   - The "$1" button should be black with white "→" arrow

## Step 5: Test Edge Cases

### 5.1 Test Arrow Button (Black Pixel)
1. Click on a black pixel
2. Modal should show black preview
3. Button should be black with white "→"
4. Click the arrow button
5. App should find a random white pixel and load it

### 5.2 Test Coordinate Editing
1. Click any pixel
2. Change the x or y coordinate in the modal
3. Click "$1" button
4. Should purchase the edited coordinates, not the clicked pixel

### 5.3 Test Multiple Purchases
1. Purchase several different pixels
2. Refresh the page
3. All purchased pixels should remain black
4. Check Supabase table - should have multiple rows

## Step 6: Test Webhook Failure Scenarios

### 6.1 Check Webhook Logs
- Supabase Dashboard → Edge Functions → Logs
- Look for `stripe-webhook` function logs
- Check for any errors

### 6.2 Test Invalid Coordinates
The Edge Functions should handle:
- Coordinates out of range (< 0 or >= 1024)
- Non-numeric coordinates
- Missing coordinates

## Troubleshooting

### Canvas not loading
- Check browser console for errors
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Check Supabase project is active

### Stripe checkout not working
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set (test key)
- Check Edge Function logs for `create-checkout-session`
- Verify `STRIPE_SECRET_KEY` is set in Supabase Edge Functions secrets

### Webhook not processing
- Check Stripe Dashboard → Webhooks → Recent events
- Verify webhook endpoint URL is correct
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe webhook secret
- Check Supabase Edge Function logs for `stripe-webhook`
- Verify database function `insert_black_pixel` exists and has correct permissions

### Pixel not turning black after payment
- Check Supabase table - was the row inserted?
- Check webhook was called (Stripe Dashboard → Events)
- Check Edge Function logs for errors
- Verify database function permissions

## Quick Test Checklist

- [ ] App loads without errors
- [ ] Canvas displays (all white initially)
- [ ] Clicking pixel opens modal
- [ ] "$1" button triggers Stripe checkout
- [ ] Test payment completes successfully
- [ ] Redirect back to app works
- [ ] Pixel turns black after payment
- [ ] Pixel persists after page refresh
- [ ] Supabase table shows new row
- [ ] Stripe webhook received event
- [ ] Edge Function logs show success

## Production Testing

Before going to production:
1. Switch to Stripe **live mode** keys
2. Test with real payment (small amount)
3. Verify webhook works in production
4. Test on actual domain (not localhost)
5. Monitor Edge Function logs for errors


