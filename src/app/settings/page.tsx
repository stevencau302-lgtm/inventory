'use client'

import { useEffect, useState } from 'react'
import { getProducts, getCategories, getTransactions, saveProducts, saveCategories, saveTransactions, loadSampleData, fetchProducts, fetchCategories, fetchTransactions, deleteProduct, deleteCategory, deleteTransaction } from '@/lib/store'
import { useToast } from '@/components/Toast'
import DeleteModal from '@/components/DeleteModal'

export default function SettingsPage() {
  const [productCount, setProductCount] = useState(0)
  const [catCount, setCatCount] = useState(0)
  const [txCount, setTxCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [resetModal, setResetModal] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function loadCounts() {
      const p = await fetchProducts()
      const c = await fetchCategories()
      const t = await fetchTransactions()
      setProductCount(p.length)
      setCatCount(c.length)
      setTxCount(t.length)
      setMounted(true)
    }
    loadCounts()
  }, [])

  if (!mounted) return null

  const handleReset = () => {
    setResetModal(true)
  }

  const confirmReset = async () => {
    setResetModal(false)
    
    // Delete all products from Supabase
    const products = await fetchProducts()
    for (const p of products) {
      await deleteProduct(p.id)
    }

    // Delete all categories from Supabase
    const categories = await fetchCategories()
    for (const c of categories) {
      await deleteCategory(c.id)
    }

    // Delete all transactions from Supabase
    const transactions = await fetchTransactions()
    for (const t of transactions) {
      await deleteTransaction(t.id)
    }

    // Also clear localStorage
    localStorage.removeItem('inv_products')
    localStorage.removeItem('inv_categories')
    localStorage.removeItem('inv_transactions')

    setProductCount(0)
    setCatCount(0)
    setTxCount(0)
    toast('Semua data berhasil direset!', 'warning')
  }

  const handleLoadSample = () => {
    const data = loadSampleData()
    setProductCount(data.products.length)
    setCatCount(data.categories.length)
    toast('Data contoh berhasil dimuat!', 'success')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Pengaturan</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Kelola preferensi & data aplikasi</p>
        </div>
      </div>

      {/* Appearance */}
      <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#1a1a1a]">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
          </div>
          <h2 className="text-sm font-semibold text-white">Tampilan</h2>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-200">Dark Mode</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Aplikasi ini dioptimasi untuk mode gelap</p>
            </div>
            {/* Toggle - always on (dark only app) */}
            <div className="relative">
              <div className="w-11 h-6 rounded-full bg-indigo-600 shadow-inner shadow-indigo-900/50">
                <div className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center">
                  <svg className="w-3 h-3 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-zinc-600 mt-3 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
            UI dirancang khusus untuk dark mode — tidak tersedia light mode
          </p>
        </div>
      </div>

      {/* Data Management */}
      <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#1a1a1a]">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Data Aplikasi</h2>
            <p className="text-[10px] text-zinc-500">{productCount} produk &middot; {catCount} kategori &middot; {txCount} transaksi</p>
          </div>
        </div>
        <div className="divide-y divide-white/[0.06]">
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-200">Load Data Contoh</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Isi dengan 15 produk dan 6 kategori demo</p>
            </div>
            <button onClick={handleLoadSample} className="px-4 py-2 rounded-lg bg-indigo-500/15 text-indigo-400 text-xs font-bold hover:bg-indigo-500 hover:text-white transition-all active:scale-95">
              Load Sample
            </button>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-200">Reset Semua Data</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Hapus semua produk, kategori & transaksi dari database</p>
            </div>
            <button onClick={handleReset} className="px-4 py-2 rounded-lg bg-red-500/15 text-red-400 text-xs font-bold hover:bg-red-500 hover:text-white transition-all active:scale-95">
              Reset All
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#1a1a1a] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-white">Tentang</h2>
        </div>
        <div className="space-y-2.5 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">InventoryPro</span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 text-[10px] font-bold">v1.0.0</span>
          </div>
          <p>Next.js 14 &middot; Tailwind CSS &middot; TypeScript &middot; Supabase</p>
          <p className="text-zinc-500 text-xs">Data tersinkronisasi via Supabase dengan fallback localStorage</p>
        </div>
      </div>

      <DeleteModal
        isOpen={resetModal}
        title="Reset Semua Data?"
        message="Hapus SEMUA data (produk, kategori, transaksi) dari database? Aksi ini tidak bisa dibatalkan."
        confirmLabel="Reset"
        icon="warning"
        onConfirm={confirmReset}
        onCancel={() => setResetModal(false)}
      />
    </div>
  )
}
