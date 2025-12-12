import { createClient } from '@supabase/supabase-js'
import { PUBLIC_ENV_KEYS } from '../../PubKeysEnv'

const supabaseUrl = PUBLIC_ENV_KEYS.SUPABASE_URL
const supabaseAnonKey = PUBLIC_ENV_KEYS.SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database schema:
// Table: black_pixels
// Columns:
//   - x: integer (0-1023) - part of primary key
//   - y: integer (0-1023) - part of primary key
//   - created_at: timestamp
// 
// Only black pixels are stored. White pixels are the default.
// Primary key: (x, y)

