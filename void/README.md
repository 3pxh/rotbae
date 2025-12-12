# Void

A collaborative pixel canvas where users can purchase pixels to turn them black. Built with React, TypeScript, Vite, Supabase, and Stripe.

## Features

- 1024x1024 pixel canvas
- Click any pixel to inspect and purchase it
- Stripe integration for $1 pixel purchases
- Real-time pixel updates via Supabase
- URL routing with query parameters (`?x=123&y=234`)
- Loading animations and payment processing indicators

## Quick Start

1. **Install dependencies:**
   ```bash
   cd void
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env` (if it exists) or create `.env`
   - See `SETUP.md` for detailed instructions

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup guide (environment variables, Supabase, Stripe, Edge Functions)
- **[TESTING.md](./TESTING.md)** - Testing guide with Stripe test cards
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions

## Project Structure

```
void/
├── src/
│   ├── App.tsx          # Main application component
│   ├── App.css          # Styles
│   └── lib/
│       ├── supabase.ts  # Supabase client
│       └── stripe.ts    # Stripe client
├── supabase-schema.sql  # Database schema
└── SETUP.md             # Setup instructions
```

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Supabase (Database + Edge Functions)
- **Payments:** Stripe Checkout
- **Deployment:** Netlify (via monorepo)

## License

Private project - All rights reserved
