import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { products, transactions, categories, dateRange } = await req.json()

    const apiKey = process.env.OPENAGENTIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key belum dikonfigurasi. Tambahkan OPENAGENTIC_API_KEY di .env.local' },
        { status: 500 }
      )
    }

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

Berikan:
1. **Ringkasan Kondisi** (2-3 kalimat tentang kesehatan inventory)
2. **Insight Utama** (3 poin penting yang perlu diperhatikan)
3. **Rekomendasi Aksi** (3 langkah konkret yang bisa dilakukan segera)

Format dalam markdown. Jaga respons tetap ringkas dan praktis.`

    const response = await fetch('https://openagentic.id/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-3.2',
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
      console.error('OpenAgentic API error:', response.status, errData)
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
