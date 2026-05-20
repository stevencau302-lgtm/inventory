'use client'
import { useEffect, useState } from 'react'
import { Product, Transaction, getProducts, getCategories, getTransactions, saveTransactions, formatRp, getStatus, getStatusLabel, loadSampleData, uid } from '@/lib/store'
import dynamic from 'next/dynamic'

const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), { ssr: false })

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [mounted, setMounted] = useState(false)
  const [txPage, setTxPage] = useState(1)
  const txPerPage = 5

  useEffect(() => {
    let p = getProducts()
    if (!p.length) { const d = loadSampleData(); p = d.products }
    setProducts(p)

    let tx = getTransactions()
    if (!tx.length) {
      tx = generateSampleTransactions(p)
      saveTransactions(tx)
    }
    setTransactions(tx)
    setMounted(true)
  }, [])

  if (!mounted) return null

  const totalProducts = products.length
  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0)
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length
  const outOfStock = products.filter(p => p.stock === 0).length
  const alertProducts = products.filter(p => p.stock > 0 && p.stock <= p.minStock)

  const bestSellers = [...products]
    .map(p => ({ ...p, sold: Math.max(0, (p.minStock * 5) - p.stock + 15) }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5)

  const totalTxPages = Math.max(1, Math.ceil(transactions.length / txPerPage))
  const paginatedTx = transactions.slice((txPage - 1) * txPerPage, txPage * txPerPage)

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Ringkasan performa inventory Anda</p>
      </div>

      {/* Stat Cards - clean 4-column grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="box" label="Total produk" value={String(totalProducts)} subtitle="+3 minggu ini" border="border-l-indigo-500" />
        <StatCard icon="coins" label="Nilai inventory" value={formatRp(totalValue)} subtitle="+12% bulan ini" border="border-l-emerald-500" />
        <StatCard icon="alert" label="Stok menipis" value={String(lowStock)} subtitle="Perlu restock" border="border-l-amber-500" />
        <StatCard icon="x-circle" label="Stok habis" value={String(outOfStock)} subtitle="Barang kosong" border="border-l-red-500" />
      </div>

      {/* Charts */}
      <DashboardCharts products={products} transactions={transactions} />

      {/* Bottom: Transactions + Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Transactions */}
        <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#161616]">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
            <h3 className="text-sm font-semibold text-white">Transaksi Terbaru</h3>
          </div>
          <div className="p-4 space-y-2">
            {paginatedTx.map(tx => (
              <div key={tx.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <div>
                  <p className="text-[13px] font-semibold text-zinc-200">{tx.productName}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${tx.type === 'in' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                    {tx.type === 'in' ? 'Masuk' : 'Keluar'}
                  </span>
                  <span className="text-[13px] font-semibold text-zinc-200">{tx.quantity} unit</span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-center gap-4 pt-3 border-t border-white/[0.06]">
              <button onClick={() => setTxPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 rounded-lg border border-white/[0.1] text-xs font-medium text-zinc-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition">Prev</button>
              <span className="text-xs text-zinc-500">{txPage} / {totalTxPages}</span>
              <button onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))} className="px-3 py-1.5 rounded-lg border border-white/[0.1] text-xs font-medium text-zinc-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition">Next</button>
            </div>
          </div>
        </div>

        {/* Best Sellers */}
        <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#161616]">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.996.178-1.768.535-2.251 1.084m13.004 0a15.522 15.522 0 00-12.003 0m12.003 0c.996.178 1.768.535 2.251 1.084" /></svg>
            <h3 className="text-sm font-semibold text-white">Produk Terlaris</h3>
          </div>
          <div className="p-4 space-y-2">
            {bestSellers.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-[11px] font-bold">{i + 1}</div>
                  <span className="text-[13px] font-medium text-zinc-200">{p.name}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  {i < 3 && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/15 text-indigo-300">Best Seller</span>}
                  <span className="text-[12px] text-zinc-500">{p.sold} terjual</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Alert Section */}
      <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#161616]">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          </div>
          <h3 className="text-sm font-semibold text-white">Alert Stok Menipis</h3>
        </div>
        <div className="p-5">
          {alertProducts.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-emerald-400/60 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-zinc-500 text-sm">Semua produk stok aman</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alertProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-lg border-l-2 border-l-amber-500 bg-white/[0.02] border border-white/[0.05]">
                  <div>
                    <p className="text-[13px] font-medium text-zinc-200">{p.name}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{p.sku} — Min: {p.minStock}</p>
                  </div>
                  <span className="text-[13px] font-semibold text-amber-400">Stok: {p.stock}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, subtitle, border }: { icon: string; label: string; value: string; subtitle: string; border: string }) {
  return (
    <div className={`rounded-xl p-4 bg-[#161616] border border-white/[0.08] border-l-2 ${border}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-zinc-400">
          {icon === 'box' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>}
          {icon === 'coins' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>}
          {icon === 'alert' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
          {icon === 'x-circle' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
        </div>
        <p className="text-xs text-zinc-400 font-normal">{label}</p>
      </div>
      <p className="text-lg font-semibold text-white whitespace-nowrap">{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>
    </div>
  )
}

function generateSampleTransactions(products: Product[]): Transaction[] {
  const txs: Transaction[] = []
  const now = new Date()
  for (let i = 0; i < 15; i++) {
    const p = products[Math.floor(Math.random() * Math.min(products.length, 8))]
    if (!p) continue
    const d = new Date(now)
    d.setDate(d.getDate() - Math.floor(Math.random() * 14))
    txs.push({
      id: uid(),
      productId: p.id,
      productName: p.name,
      type: Math.random() > 0.4 ? 'in' : 'out',
      quantity: Math.floor(Math.random() * 20) + 1,
      note: '',
      createdAt: d.toISOString(),
    })
  }
  return txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
