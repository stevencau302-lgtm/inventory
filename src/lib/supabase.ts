import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let supabase: SupabaseClient

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  // Dummy client for build time — won't be used at runtime if env vars are set
  supabase = new Proxy({} as SupabaseClient, {
    get: () => () => ({ data: [], error: null }),
  })
}

export { supabase }
