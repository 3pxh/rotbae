/**
 * Public Environment Variable Keys
 * 
 * These are the environment variable keys that need to be set in:
 * Netlify Dashboard → Site Settings → Environment Variables
 * 
 * For local development, set these in void/.env
 */

export const PUBLIC_ENV_KEYS = {
  SUPABASE_URL: 'https://wcwszymgjdsrznevikia.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjd3N6eW1namRzcnpuZXZpa2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0Nzc3NTgsImV4cCI6MjA4MTA1Mzc1OH0.YmZpD6iHk6q7isbOH4n54Zu658hsXXlS5K8cy-hkzo0',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_51SdEtAIJzkuA0lxbiPPGsZLgoNlYA3zGe2YdE7MQO8KWDGTyoFxtlFFmhCsLEsD59DAmCs0ee9u12LV94MZtp7fC00i1wdyDM6',
} as const
