# Supabase Edge Functions Setup

## Functions Created

1. **create-checkout-session** - Creates Stripe checkout sessions
2. **stripe-webhook** - Handles Stripe webhook events to update pixels

## Deployment

### Using Supabase CLI

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   
   **How to find your project-ref:**
   - Go to your Supabase Dashboard
   - Click on your project
   - Go to Settings → General
   - Look for "Reference ID" - this is your project-ref
   - It looks like: `abcdefghijklmnop` (a string of letters/numbers)
   - Or check your project URL: `https://app.supabase.com/project/abcdefghijklmnop`
     The part after `/project/` is your project-ref

4. Deploy functions:
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook
   ```

### Environment Variables

Set these in Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Automatically Available (No Setup Required):**

Supabase Edge Functions automatically inject these environment variables - you don't need to set them:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (not used in this setup)
- `SUPABASE_DB_URL` - Your database connection URL

**Where to find Stripe values:**

- **STRIPE_SECRET_KEY**: 
  - Stripe Dashboard → Developers → API keys
  - Copy the "Secret key" (starts with `sk_...`)

- **STRIPE_WEBHOOK_SECRET**:
  - Stripe Dashboard → Developers → Webhooks
  - After creating the webhook endpoint, copy the "Signing secret" (starts with `whsec_...`)

**Note:** 
- We use the automatically injected `SUPABASE_ANON_KEY` with a database function (`insert_black_pixel`) that has `SECURITY DEFINER` privileges. This allows the webhook to insert pixels without needing the service role key.
- The database function runs with elevated privileges, so the anon key can insert pixels even though RLS would normally prevent it.

## Stripe Webhook Setup

1. In Stripe Dashboard, go to Developers → Webhooks
2. Add endpoint: `https://your-project-ref.supabase.co/functions/v1/stripe-webhook`
   (Replace `your-project-ref` with your actual Supabase project reference ID)
3. Select event: `checkout.session.completed`
4. Copy the webhook signing secret to Supabase Edge Function secrets

## Function URLs

After deployment, your functions will be available at:
- `https://your-project-ref.supabase.co/functions/v1/create-checkout-session`
- `https://your-project-ref.supabase.co/functions/v1/stripe-webhook`

(Replace `your-project-ref` with your actual Supabase project reference ID)

The frontend automatically calls these via `supabase.functions.invoke()`.

