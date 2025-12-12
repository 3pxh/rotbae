# Void App Setup

## Environment Variables

### Frontend (void/.env)
Create a `.env` file in the `void` directory with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Backend (Supabase Edge Functions Secrets)
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

**Note:** 
- We use the automatically injected `SUPABASE_ANON_KEY` with a database function (`insert_black_pixel`) that has `SECURITY DEFINER` privileges. This allows the webhook to insert pixels without needing the service role key.
- The database function runs with elevated privileges, so the anon key can insert pixels even though RLS would normally prevent it.

## Supabase Database Setup

1. Run the SQL schema file in your Supabase SQL Editor:
   - Open Supabase Dashboard → SQL Editor
   - Copy and paste the contents of `supabase-schema.sql`
   - Execute the script

   Or manually create the table:

```sql
CREATE TABLE black_pixels (
  x INTEGER NOT NULL CHECK (x >= 0 AND x < 1024),
  y INTEGER NOT NULL CHECK (y >= 0 AND y < 1024),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (x, y)
);

CREATE INDEX idx_black_pixels_coords ON black_pixels(x, y);
```

2. The schema uses Row Level Security (RLS). Adjust the policies in `supabase-schema.sql` based on your access requirements:
   - Public read/write (no auth)
   - Authenticated users only
   - Custom access rules

**Note:** This schema only stores black pixels. White pixels are the default and not stored in the database.

## Stripe Setup

1. Create a Stripe account and get your API keys
2. Set up a webhook endpoint in Stripe Dashboard:
   - URL: `https://your-project-ref.supabase.co/functions/v1/stripe-webhook`
   - Events to listen for: `checkout.session.completed`
3. Copy the webhook signing secret to Supabase Edge Functions secrets

## Supabase Edge Functions

Functions are located in `supabase/functions/`:
- `create-checkout-session` - Creates Stripe checkout sessions
- `stripe-webhook` - Handles Stripe webhook events to update pixels

### Deployment

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref your-project-ref`
4. Deploy functions:
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook
   ```

See `SUPABASE_EDGE_FUNCTIONS.md` for detailed setup instructions.

