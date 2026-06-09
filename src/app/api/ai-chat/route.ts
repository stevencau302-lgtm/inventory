import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zhbsqpoxmzzeomdxqvoo.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoYnNxcG94bXp6ZW9tZHhxdm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NTE3MDIsImV4cCI6MjA5NDUyNzcwMn0.j66I_l-hHt0krVvra0SorjEFZjTXTRtcRPpoUkLvOfM'

export async function POST(req: NextRequest) {
  try {
    const { message, history, context } = await req.json()

    // Get API key from settings
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

    // Build inventory context summary
    const products = context?.products || []
    const categories = context?.categories || []
    const transactions = context?.transactions || []

    const totalUnits = products.reduce((s: number, p: any) => s + p.stock, 0)
    const totalValue = products.reduce((s: number, p: any) => s + p.price * p.stock, 0)
    const lowStock = products.filter((p: any) => p.stock > 0 && p.stock <= p.minStock)
    const outStock = products.filter((p: any) => p.stock === 0)
    const recentTx = transactions.slice(0, 20)

    // ── Ringkasan Retur ──
    const priceOf = (id: string) => (products.find((p: any) => p.id === id)?.price ?? 0)
    const isReturn = (t: any) => t.note?.toUpperCase().startsWith('[RETURN]')
    const parseAlasan = (note: string) => {
      const m = note?.match(/Alasan:\s*([^|]+)/i)
      return m ? m[1].trim() : 'Lainnya'
    }
    const returns = transactions.filter(isReturn)
    const returnUnits = returns.reduce((s: number, t: any) => s + t.quantity, 0)
    const returnLoss = returns.reduce((s: number, t: any) => s + priceOf(t.productId) * t.quantity, 0)
    // Produk paling sering diretur
    const returnByProduct: Record<string, number> = {}
    returns.forEach((t: any) => { returnByProduct[t.productName] = (returnByProduct[t.productName] || 0) + t.quantity })
    const topReturned = Object.entries(returnByProduct).sort((a, b) => b[1] - a[1]).slice(0, 5)
    // Distribusi alasan
    const returnByReason: Record<string, number> = {}
    returns.forEach((t: any) => { const r = parseAlasan(t.note); returnByReason[r] = (returnByReason[r] || 0) + 1 })
    const reasonDist = Object.entries(returnByReason).sort((a, b) => b[1] - a[1])

    const returnContext = returns.length === 0
      ? '- Retur: Belum ada data retur'
      : `- Retur: ${returns.length} kasus, total ${returnUnits} unit, potensi kerugian Rp ${returnLoss.toLocaleString('id-ID')}
- Produk paling sering diretur: ${topReturned.map(([name, qty]) => `${name} (${qty} unit)`).join(', ')}
- Alasan retur: ${reasonDist.map(([reason, count]) => `${reason} (${count}x)`).join(', ')}`

    const inventoryContext = `
DATA INVENTORY REAL-TIME:
- Total produk: ${products.length} | Total unit: ${totalUnits} | Nilai: Rp ${totalValue.toLocaleString('id-ID')}
- Kategori: ${categories.map((c: any) => c.name).join(', ') || 'Belum ada'}
- Stok rendah (${lowStock.length}): ${lowStock.slice(0, 8).map((p: any) => `${p.name} (${p.stock}/${p.minStock})`).join(', ') || 'Tidak ada'}
- Stok habis (${outStock.length}): ${outStock.slice(0, 8).map((p: any) => p.name).join(', ') || 'Tidak ada'}
- Daftar produk: ${products.slice(0, 20).map((p: any) => `${p.name} [${p.category}] stok:${p.stock} harga:Rp${p.price.toLocaleString('id-ID')}`).join(' | ')}
- Transaksi terakhir: ${recentTx.map((t: any) => `${t.productName} ${t.type === 'in' ? '+' : '-'}${t.quantity} (${new Date(t.createdAt).toLocaleDateString('id-ID')})`).join(' | ') || 'Belum ada'}
${returnContext}
`

    const systemPrompt = `Kamu adalah AI asisten inventory bernama "Nexa AI" untuk bisnis retail/UMKM Indonesia.

PERAN:
- Bantu pemilik bisnis memahami kondisi stok, beri rekomendasi, dan jawab pertanyaan soal inventory
- Kamu juga paham data RETUR: jumlah kasus, potensi kerugian, produk yang sering diretur, dan alasannya
- Selalu jawab dalam Bahasa Indonesia yang kasual tapi informatif
- Gunakan data real-time yang tersedia untuk memberikan jawaban akurat
- Jika ditanya hal di luar konteks inventory, tetap ramah tapi arahkan kembali

FORMAT JAWABAN:
- Gunakan bullet point (- ) untuk list
- Gunakan **bold** untuk hal penting
- Gunakan numbered list (1. 2. 3.) untuk langkah-langkah
- Jawab ringkas dan langsung ke poin (max 300 kata)
- Jangan gunakan header markdown (# ## ###) kecuali benar-benar perlu

${inventoryContext}`

    // Build messages array with history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-10),
      { role: 'user', content: message },
    ]

    const response = await fetch('https://aimurah.my.id/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: aiModel,
        messages,
        max_tokens: 1500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errData = await response.text()
      console.error('AI Chat error:', response.status, errData)
      return NextResponse.json(
        { error: `AI error: ${response.status}. Coba lagi atau cek API key di Pengaturan.` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'Maaf, tidak bisa memproses permintaan.'

    return NextResponse.json({ reply })
  } catch (error: any) {
    console.error('AI Chat error:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}
