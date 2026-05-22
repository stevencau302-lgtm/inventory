import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zhbsqpoxmzzeomdxqvoo.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoYnNxcG94bXp6ZW9tZHhxdm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NTE3MDIsImV4cCI6MjA5NDUyNzcwMn0.j66I_l-hHt0krVvra0SorjEFZjTXTRtcRPpoUkLvOfM'

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

    // Get today (WIB)
    const now = new Date()
    const wibOffset = 7 * 60 * 60 * 1000
    const nowWIB = new Date(now.getTime() + wibOffset)
    const todayStr = nowWIB.toISOString().split('T')[0]
    const startUTC = new Date(`${todayStr}T00:00:00+07:00`).toISOString()
    const endUTC = new Date(`${todayStr}T23:59:59+07:00`).toISOString()

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .gte('created_at', startUTC)
      .lte('created_at', endUTC)
      .order('created_at', { ascending: true })

    const txList = (transactions || []) as Transaction[]

    // Get product SKUs
    const productIds = Array.from(new Set(txList.map((t: Transaction) => t.product_id)))
    const productMap = new Map<string, Product>()
    if (productIds.length > 0) {
      const { data: products } = await supabase.from('products').select('id, name, sku, stock').in('id', productIds)
      ;(products || []).forEach((p: Product) => productMap.set(p.id, p))
    }

    // Build message
    const inTx = txList.filter((t: Transaction) => t.type === 'in')
    const outTx = txList.filter((t: Transaction) => t.type === 'out')
    const inBySku = aggregateBySku(inTx, productMap)
    const outBySku = aggregateBySku(outTx, productMap)

    let message = `Rekap Inventory Harian\n${formatDateID(nowWIB)}\n`

    if (txList.length === 0) {
      message += `\n— Tidak ada transaksi hari ini.`
    } else {
      if (inBySku.length > 0) {
        message += `\n━━━━━━━━━━\nSKU MASUK\n\n`
        inBySku.forEach(item => { message += `${item.sku}  +${item.qty} pcs\n` })
      }
      if (outBySku.length > 0) {
        message += `\n━━━━━━━━━━\nSKU KELUAR\n\n`
        outBySku.forEach(item => { message += `${item.sku}  -${item.qty} pcs\n` })
      }
      message += `\n━━━━━━━━━━\n`
      if (inBySku.length > 0) message += `Total SKU Masuk: ${inBySku.length}\nTotal Barang Masuk: ${inBySku.reduce((s, i) => s + i.qty, 0)} pcs\n`
      if (outBySku.length > 0) message += `Total SKU Keluar: ${outBySku.length}\nTotal Barang Keluar: ${outBySku.reduce((s, i) => s + i.qty, 0)} pcs`
    }

    // Send via Fonnte
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, message: message.trim(), typing: false }),
    })

    const result = await response.json()
    if (!response.ok || result.status === false) {
      return NextResponse.json({ error: result.reason || result.message || 'Fonnte API error' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
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
