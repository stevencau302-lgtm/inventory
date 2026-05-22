import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface Transaction {
  id: string
  product_id: string
  product_name: string
  type: 'in' | 'out'
  quantity: number
  note: string
  created_at: string
}

interface Product {
  id: string
  name: string
  sku: string
  stock: number
}

interface AppSettings {
  id: string
  key: string
  value: string
}

export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this automatically)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Read Fonnte config from settings table
    const { data: settings } = await supabase.from('settings').select('*')
    const settingsMap = new Map<string, string>()
    ;(settings || []).forEach((s: AppSettings) => settingsMap.set(s.key, s.value))

    const fonntToken = settingsMap.get('fonnte_token') || process.env.FONNTE_TOKEN || ''
    const targetNumber = settingsMap.get('fonnte_target') || process.env.FONNTE_TARGET_NUMBER || ''

    if (!fonntToken || !targetNumber) {
      return NextResponse.json({ error: 'Fonnte not configured. Set token & number in Settings.' }, { status: 500 })
    }

    // Get today's date range (WIB = UTC+7)
    const now = new Date()
    const wibOffset = 7 * 60 * 60 * 1000
    const nowWIB = new Date(now.getTime() + wibOffset)
    const todayStr = nowWIB.toISOString().split('T')[0]

    // Fetch today's transactions (use UTC range that covers WIB day)
    const startUTC = new Date(`${todayStr}T00:00:00+07:00`).toISOString()
    const endUTC = new Date(`${todayStr}T23:59:59+07:00`).toISOString()

    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .gte('created_at', startUTC)
      .lte('created_at', endUTC)
      .order('created_at', { ascending: true })

    if (txError) {
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    const txList = (transactions || []) as Transaction[]
    const message = await buildMessage(supabase, txList, nowWIB)

    // Send via Fonnte
    await sendFonnte(fonntToken, targetNumber, message)

    return NextResponse.json({ success: true, message: 'Daily report sent' })
  } catch (error: any) {
    console.error('Daily report error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

async function buildMessage(supabase: any, txList: Transaction[], nowWIB: Date): Promise<string> {
  if (txList.length === 0) {
    return `Rekap Inventory Harian\n${formatDateID(nowWIB)}\n\nTidak ada transaksi hari ini.`
  }

  // Get product SKUs
  const productIds = Array.from(new Set(txList.map(t => t.product_id)))
  const { data: products } = await supabase.from('products').select('id, name, sku, stock').in('id', productIds)
  const productMap = new Map<string, Product>()
  ;(products || []).forEach((p: Product) => productMap.set(p.id, p))

  const inTx = txList.filter(t => t.type === 'in')
  const outTx = txList.filter(t => t.type === 'out')
  const inBySku = aggregateBySku(inTx, productMap)
  const outBySku = aggregateBySku(outTx, productMap)

  let message = `Rekap Inventory Harian\n${formatDateID(nowWIB)}\n`

  if (inBySku.length > 0) {
    message += `\nSKU MASUK :\n`
    inBySku.forEach(item => { message += `${item.sku} ${item.qty} pcs\n` })
  }

  if (outBySku.length > 0) {
    message += `\nSKU KELUAR :\n`
    outBySku.forEach(item => { message += `${item.sku} ${item.qty} pcs\n` })
  }

  return message.trim()
}

function aggregateBySku(txList: Transaction[], productMap: Map<string, Product>): { sku: string; qty: number }[] {
  const map = new Map<string, { sku: string; qty: number }>()
  txList.forEach(t => {
    const product = productMap.get(t.product_id)
    const sku = product?.sku || t.product_name
    const existing = map.get(sku) || { sku, qty: 0 }
    existing.qty += t.quantity
    map.set(sku, existing)
  })
  return Array.from(map.values()).sort((a, b) => b.qty - a.qty)
}

function formatDateID(date: Date): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

async function sendFonnte(token: string, target: string, message: string) {
  const response = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: { 'Authorization': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, message, typing: false }),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(`Fonnte error: ${JSON.stringify(result)}`)
  return result
}
