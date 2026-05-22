import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zhbsqpoxmzzeomdxqvoo.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

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

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fonntToken = process.env.FONNTE_TOKEN
  const targetNumber = process.env.FONNTE_TARGET_NUMBER

  if (!fonntToken || !targetNumber) {
    return NextResponse.json({ error: 'FONNTE_TOKEN or FONNTE_TARGET_NUMBER not configured' }, { status: 500 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get today's date range (WIB = UTC+7)
    const now = new Date()
    const wibOffset = 7 * 60 * 60 * 1000
    const nowWIB = new Date(now.getTime() + wibOffset)
    const todayStr = nowWIB.toISOString().split('T')[0]
    const startOfDay = `${todayStr}T00:00:00+07:00`
    const endOfDay = `${todayStr}T23:59:59+07:00`

    // Fetch today's transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .order('created_at', { ascending: true })

    if (txError) {
      console.error('Error fetching transactions:', txError)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    const txList = (transactions || []) as Transaction[]

    // If no transactions today, still send a summary
    if (txList.length === 0) {
      const message = `📦 Rekap Inventory Harian\n📅 ${formatDateID(nowWIB)}\n\n━━━━━━━━━━\n✅ Tidak ada transaksi hari ini.\n\nSemua stok aman! 🎉`
      await sendFonnte(fonntToken, targetNumber, message)
      return NextResponse.json({ success: true, message: 'No transactions today, summary sent' })
    }

    // Get product SKUs for the transactions
    const productIds = [...new Set(txList.map(t => t.product_id))]
    const { data: products } = await supabase
      .from('products')
      .select('id, name, sku, stock')
      .in('id', productIds)

    const productMap = new Map<string, Product>()
    ;(products || []).forEach((p: Product) => productMap.set(p.id, p))

    // Group by type
    const inTx = txList.filter(t => t.type === 'in')
    const outTx = txList.filter(t => t.type === 'out')

    // Aggregate by SKU
    const inBySku = aggregateBySku(inTx, productMap)
    const outBySku = aggregateBySku(outTx, productMap)

    // Build message
    let message = `📦 Rekap Inventory Harian\n📅 ${formatDateID(nowWIB)}\n`

    if (inBySku.length > 0) {
      message += `\n━━━━━━━━━━\n📥 SKU MASUK\n\n`
      inBySku.forEach(item => {
        message += `${item.sku} → +${item.qty} pcs\n`
      })
    }

    if (outBySku.length > 0) {
      message += `\n━━━━━━━━━━\n📤 SKU KELUAR\n\n`
      outBySku.forEach(item => {
        message += `${item.sku} → -${item.qty} pcs\n`
      })
    }

    // Summary
    const totalSkuKeluar = outBySku.length
    const totalQtyKeluar = outBySku.reduce((s, i) => s + i.qty, 0)
    const totalSkuMasuk = inBySku.length
    const totalQtyMasuk = inBySku.reduce((s, i) => s + i.qty, 0)

    message += `\n━━━━━━━━━━\n`
    if (inBySku.length > 0) {
      message += `📊 Total SKU Masuk : ${totalSkuMasuk}\n📦 Total Barang Masuk : ${totalQtyMasuk} pcs\n`
    }
    if (outBySku.length > 0) {
      message += `📊 Total SKU Keluar : ${totalSkuKeluar}\n📦 Total Barang Keluar : ${totalQtyKeluar} pcs`
    }

    // Send via Fonnte
    await sendFonnte(fonntToken, targetNumber, message.trim())

    return NextResponse.json({
      success: true,
      message: 'Daily report sent',
      stats: { totalSkuMasuk, totalQtyMasuk, totalSkuKeluar, totalQtyKeluar }
    })

  } catch (error: any) {
    console.error('Daily report error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
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
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      target,
      message,
      typing: false,
    }),
  })

  const result = await response.json()
  if (!response.ok) {
    throw new Error(`Fonnte API error: ${JSON.stringify(result)}`)
  }
  return result
}
