import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zhbsqpoxmzzeomdxqvoo.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoYnNxcG94bXp6ZW9tZHhxdm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NTE3MDIsImV4cCI6MjA5NDUyNzcwMn0.j66I_l-hHt0krVvra0SorjEFZjTXTRtcRPpoUkLvOfM'

export async function POST(req: NextRequest) {
  try {
    const { products, transactions, categories, dateRange } = await req.json()

    // Read API key from Supabase settings
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: settings } = await supabase.from('settings').select('*')
    const settingsMap: Record<string, string> = {}
    ;(settings || []).forEach((s: any) => { settingsMap[s.key] = s.value })

    const apiKey = settingsMap['ai_api_key']
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key belum dikonfigurasi. Tambahkan di menu Pengaturan → AI API Key.' },
        { status: 400 }
      )
    }

    const aiModel = settingsMap['ai_model'] || 'deepseek-3.2'

    // Build summary data for AI
    const totalProducts = products?.length || 0
    const totalUnits = products?.reduce((s: number, p: any) => s + p.stock, 0) || 0
    const totalValue = products?.reduce((s: number, p: any) => s + p.price * p.stock, 0) || 0
    const lowStock = products?.filter((p: any) => p.stock > 0 && p.stock <= p.minStock) || []
    const outStock = products?.filter((p: any) => p.stock === 0) || []
    const totalIn = transactions?.filter((t: any) => t.type === 'in').reduce((s: number, t: any) => s + t.quantity, 0) || 0
    const totalOut = transactions?.filter((t: any) => t.type === 'out').reduce((s: number, t: any) => s + t.quantity, 0) || 0

    const topSellingProducts = (() => {
      const outCounts: Record<string, { name: string; count: number }> = {}
      transactions?.filter((t: any) => t.type === 'out').forEach((t: any) => {
        if (!outCounts[t.productId]) outCounts[t.productId] = { name: t.productName, count: 0 }
        outCounts[t.productId].count += t.quantity
      })
      return Object.values(outCounts).sort((a, b) => b.count - a.count).slice(0, 5)
    })()

    // ── Ringkasan Retur ──
    const priceOf = (id: string) => (products?.find((p: any) => p.id === id)?.price ?? 0)
    const isReturn = (t: any) => t.note?.toUpperCase().startsWith('[RETURN]')
    const parseAlasan = (note: string) => {
      const m = note?.match(/Alasan:\s*([^|]+)/i)
      return m ? m[1].trim() : 'Lainnya'
    }
    const returns = transactions?.filter(isReturn) || []
    const returnUnits = returns.reduce((s: number, t: any) => s + t.quantity, 0)
    const returnLoss = returns.reduce((s: number, t: any) => s + priceOf(t.productId) * t.quantity, 0)
    const returnByProduct: Record<string, number> = {}
    returns.forEach((t: any) => { returnByProduct[t.productName] = (returnByProduct[t.productName] || 0) + t.quantity })
    const topReturned = Object.entries(returnByProduct).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5)
    const returnByReason: Record<string, number> = {}
    returns.forEach((t: any) => { const r = parseAlasan(t.note); returnByReason[r] = (returnByReason[r] || 0) + 1 })
    const reasonDist = Object.entries(returnByReason).sort((a, b) => (b[1] as number) - (a[1] as number))

    const returnSummary = returns.length === 0
      ? '- Retur: Belum ada data retur'
      : `- Total retur: ${returns.length} kasus (${returnUnits} unit), potensi kerugian Rp ${returnLoss.toLocaleString('id-ID')}
- Produk paling sering diretur: ${topReturned.map(([name, qty]) => `${name} (${qty} unit)`).join(', ')}
- Alasan retur terbanyak: ${reasonDist.map(([reason, count]) => `${reason} (${count}x)`).join(', ')}`

    const prompt = `Kamu adalah AI analis inventory untuk bisnis retail/UMKM Indonesia. Berikan analisa singkat dan actionable dalam Bahasa Indonesia.

Data Inventory saat ini (Periode: ${dateRange}):
- Total produk: ${totalProducts}
- Total unit stok: ${totalUnits}
- Total nilai inventory: Rp ${totalValue.toLocaleString('id-ID')}
- Total kategori: ${categories?.length || 0}
- Barang masuk: ${totalIn} unit
- Barang keluar: ${totalOut} unit
- Produk stok rendah: ${lowStock.length} (${lowStock.slice(0, 5).map((p: any) => `${p.name}: ${p.stock}/${p.minStock}`).join(', ')})
- Produk stok habis: ${outStock.length} (${outStock.slice(0, 5).map((p: any) => p.name).join(', ')})
- Top 5 produk terlaris: ${topSellingProducts.map((p, i) => `${i + 1}. ${p.name} (${p.count} unit)`).join(', ')}
${returnSummary}

Berikan:
1. **Ringkasan Kondisi** (2-3 kalimat tentang kesehatan inventory, termasuk kondisi retur jika relevan)
2. **Insight Utama** (3 poin penting yang perlu diperhatikan)
3. **Rekomendasi Aksi** (3 langkah konkret yang bisa dilakukan segera)

Format dalam markdown. Jaga respons tetap ringkas dan praktis.`

    const response = await fetch('https://aimurah.my.id/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: 'system', content: 'Kamu adalah asisten analis inventory yang membantu pemilik bisnis memahami kondisi stok mereka. Berikan analisa dalam Bahasa Indonesia yang ringkas dan actionable.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errData = await response.text()
      console.error('AI API error:', response.status, errData)
      return NextResponse.json(
        { error: `AI API error: ${response.status}. ${errData}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || 'Tidak ada respons dari AI.'

    return NextResponse.json({ insight: content })
  } catch (error: any) {
    console.error('AI Insight error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}
