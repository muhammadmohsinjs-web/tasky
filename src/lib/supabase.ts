import { createClient } from '@supabase/supabase-js'

// Replace with your Supabase project credentials.
// For production, use environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables. ' +
    'Create a .env file with these values.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
