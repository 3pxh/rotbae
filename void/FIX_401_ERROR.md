# Fixing 401 "Invalid JWT" Error

## Problem
The Edge Function is returning `401 Unauthorized - "Invalid JWT"`. This means the JWT token being sent is invalid or missing.

## Solution

### Option 1: Verify Environment Variables (Most Likely Fix)

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

### Option 2: Check Supabase Client Initialization

The Supabase client should automatically include the anon key when calling Edge Functions. Verify:

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

### Option 3: Edge Function Configuration

Supabase Edge Functions automatically validate JWTs. The function should accept the anon key. If it's still failing:

1. **Check Edge Function logs:**
   - Supabase Dashboard → Edge Functions → Logs
   - Look for the `create-checkout-session` function
   - Check what JWT is being received

2. **Verify function is deployed:**
   ```bash
   supabase functions deploy create-checkout-session
   ```

### Option 4: Manual Test

Test the Edge Function directly with curl:

```bash
curl -X POST \
  'https://your-project-ref.supabase.co/functions/v1/create-checkout-session' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"x": 100, "y": 200}'
```

Replace:
- `your-project-ref` with your Supabase project reference ID
- `YOUR_ANON_KEY` with your actual anon key from Supabase Dashboard

If this works, the issue is with how the frontend is calling it.
If this fails, the issue is with the Edge Function configuration.

## Common Issues

1. **Wrong anon key**: Using a key from a different Supabase project
2. **Missing `.env` file**: Environment variables not loaded
3. **Dev server not restarted**: Changes to `.env` require restart
4. **Key has extra spaces**: Check for leading/trailing spaces in `.env`
5. **Key wrapped in quotes**: Don't use quotes around values in `.env`

## Verification

After fixing, you should see in the browser console:
- No 401 errors
- Successful function call
- `sessionId` returned from the function

