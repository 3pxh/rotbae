# JWT Authentication for Supabase Edge Functions

## How It Works Automatically

When you use `supabase.functions.invoke()` in your frontend code, the Supabase client **automatically** handles JWT generation and includes it in the request:

```typescript
// This automatically includes the Authorization header
const { data, error } = await supabase.functions.invoke('create-checkout-session', {
  body: { x: editX, y: editY },
})
```

The Supabase client:
1. Uses the `anon` key from your Supabase client initialization
2. Creates a JWT token signed with that key
3. Includes it in the `Authorization: Bearer <jwt>` header
4. Sends it to the Edge Function

## You Don't Need to Generate JWTs Manually

For anonymous access (which is what we're doing), the Supabase client handles everything automatically. You just need to:

1. **Initialize the Supabase client with the anon key:**
   ```typescript
   const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```

2. **Call the function normally:**
   ```typescript
   await supabase.functions.invoke('function-name', { body: {...} })
   ```

## If You Need to Call Edge Functions Manually

### Option 1: Use the Anon Key Directly (Simplest)

For anonymous access, you can use the anon key directly as a Bearer token:

```bash
curl -X POST \
  'https://your-project-ref.supabase.co/functions/v1/create-checkout-session' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"x": 100, "y": 200}'
```

**Note:** Supabase Edge Functions accept the anon key directly - you don't need to generate a JWT for anonymous requests.

### Option 2: For Authenticated Users

If you need to call Edge Functions as an authenticated user:

1. **Sign in through Supabase Auth:**
   ```typescript
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'user@example.com',
     password: 'password'
   })
   ```

2. **The Supabase client automatically uses the user's JWT:**
   ```typescript
   // This will automatically include the user's JWT token
   await supabase.functions.invoke('function-name', { body: {...} })
   ```

3. **Access the user in the Edge Function:**
   ```typescript
   // In your Edge Function
   const authHeader = req.headers.get('authorization')
   // Supabase validates the JWT automatically
   ```

## Why You're Getting 401 Errors

The 401 "Invalid JWT" error means:

1. **The anon key is wrong** - Check that `VITE_SUPABASE_ANON_KEY` in your `.env` matches your Supabase project's anon key
2. **The key isn't being loaded** - Make sure you restarted the dev server after setting `.env`
3. **The Supabase client isn't initialized properly** - Check that `supabase.ts` is loading the env vars correctly

## Debugging

To verify your Supabase client is set up correctly:

```typescript
// In your browser console or code
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Anon Key (first 20 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20))

// Check the client
import { supabase } from './lib/supabase'
console.log('Supabase client initialized:', !!supabase)
```

## Summary

- ✅ **You don't need to generate JWTs manually** - Supabase handles it
- ✅ **For anonymous access** - Just use the anon key (automatically handled)
- ✅ **For authenticated users** - Sign in through Supabase Auth (automatically handled)
- ❌ **Don't manually create JWTs** - Let Supabase handle it

The 401 error is likely because:
- Wrong anon key in `.env`
- Dev server not restarted
- Supabase client not initialized properly

Fix these and the JWT will be automatically included in your requests!

