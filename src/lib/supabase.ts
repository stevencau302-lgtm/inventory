import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zhbsqpoxmzzeomdxqvoo.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoYnNxcG94bXp6ZW9tZHhxdm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NTE3MDIsImV4cCI6MjA5NDUyNzcwMn0.j66I_l-hHt0krVvra0SorjEFZjTXTRtcRPpoUkLvOfM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
