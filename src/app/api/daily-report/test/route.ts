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

export async function POST(request: Request) {
  try {
    const { token, target } = await request.json()

    if (!token || !target) {
      return NextResponse.json({ error: 'Token dan nomor WA wajib diisi' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get today's date range (WIB = UTC+7)
    const now = new Date()
    const wibOffset = 7 * 60 * 60 * 1000
    const nowWIB = new Date(now.getTime() + wibOffset)
    const todayStr = nowWIB.toISOString().split('T')[0]
    const startOfDay = `${todayStr}T00:00:00+07:00`
    const endOfDay = `${todayStr}T23:59:59+07:00`

    // Fetch today's transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .order('created_at', { ascending: true })

    const txList = (transactions || []) as Transaction[]

    // Get product SKUs
    const productIds = [...new Set(txList.map(t => t.product_id))]
    let productMap = new Map<string, Product>()
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from('products')
        .select('id, name, sku, stock')
        .in('id', productIds)
      ;(products || []).forEach((p: Product) => productMap.set(p.id, p))
    }

    // Group by type
    const inTx = txList.filter(t => t.type === 'in')
    const outTx = txList.filter(t => t.type === 'out')

    // Aggregate by SKU
    const inBySku = aggregateBySku(inTx, productMap)
    const outBySku = aggregateBySku(outTx, productMap)

    // Build message
    let message = `📦 Rekap Inventory Harian\n📅 ${formatDateID(nowWIB)}\n`

    if (txList.length === 0) {
      message += `\n━━━━━━━━━━\n✅ Tidak ada transaksi hari ini.\n\nSemua stok aman! 🎉`
    } else {
      if (inBySku.length > 0) {
        message += `\n━━━━━━━━━━\n📥 SKU MASUK\n\n`
        inBySku.forEach(item => { message += `${item.sku} → +${item.qty} pcs\n` })
      }

      if (outBySku.length > 0) {
        message += `\n━━━━━━━━━━\n📤 SKU KELUAR\n\n`
        outBySku.forEach(item => { message += `${item.sku} → -${item.qty} pcs\n` })
      }

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
    }

    // Send via Fonnte
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target,
        message: message.trim(),
        typing: false,
      }),
    })

    const result = await response.json()
    if (!response.ok || result.status === false) {
      return NextResponse.json({ error: result.reason || result.message || 'Fonnte API error' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Test report sent successfully' })

  } catch (error: any) {
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
