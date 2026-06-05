import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zhbsqpoxmzzeomdxqvoo.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoYnNxcG94bXp6ZW9tZHhxdm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NTE3MDIsImV4cCI6MjA5NDUyNzcwMn0.j66I_l-hHt0krVvra0SorjEFZjTXTRtcRPpoUkLvOfM'

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase.from('settings').select('*')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const settings: Record<string, string> = {}
    ;(data || []).forEach((s: any) => { settings[s.key] = s.value })
    return NextResponse.json(settings)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Upsert each key-value pair
    for (const [key, value] of Object.entries(body)) {
      await supabase.from('settings').upsert({ key, value: String(value) }, { onConflict: 'key' })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
