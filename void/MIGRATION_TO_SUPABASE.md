# Migration Steps: localStorage → Supabase

## Step 1: Set up Supabase
1. Create a Supabase project at https://supabase.com
2. Get your project URL and anon key from Settings → API
3. Run the SQL schema from `supabase-schema.sql` in the SQL Editor
4. Add environment variables to `void/.env`:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

## Step 2: Update Code
The code has been updated to:
- Load black pixels from Supabase on mount
- Save black pixels to Supabase when a pixel is purchased
- Only store black pixels (white is default)

## Step 3: Data Structure Changes
- **Before**: Stored all pixels (white + black) in localStorage
- **After**: Only stores black pixels in Supabase, assumes white by default

## Step 4: Testing
1. Start the app: `cd void && npm run dev`
2. Click a pixel and purchase it ($1 button)
3. Refresh the page - the black pixel should persist
4. Check Supabase table to see the black pixel record

## Step 5: Optional - Migrate Existing Data
If you have existing localStorage data you want to migrate:
1. Export localStorage data
2. Filter for black pixels only
3. Insert into Supabase using the SQL Editor or a migration script

