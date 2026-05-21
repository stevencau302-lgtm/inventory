'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Product, Category, getProducts, getCategories, saveProducts, formatRp, uid, loadSampleData } from '@/lib/store'
import { useToast } from '@/components/Toast'

export default function NewProductPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [stock, setStock] = useState<number>(0)
  const [minStock, setMinStock] = useState<number>(0)
  const [category, setCategory] = useState('')

  useEffect(() => {
    let c = getCategories()
    if (c.length === 0) {
      const data = loadSampleData()
      c = data.categories
    }
    setCategories(c)
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast('Nama produk wajib diisi', 'error'); return }
    if (!sku.trim()) { toast('SKU wajib diisi', 'error'); return }
    if (!category) { toast('Kategori wajib dipilih', 'error'); return }

    setLoading(true)
    setTimeout(() => {
      const now = new Date().toISOString()
      const newProduct: Product = {
        id: uid(), name: name.trim(), sku: sku.trim(), category, stock, price, minStock,
        description: description.trim(), createdAt: now, updatedAt: now,
      }
      const existingProducts = getProducts()
      saveProducts([newProduct, ...existingProducts])
      toast('Produk berhasil ditambahkan!', 'success')
      router.push('/products')
    }, 500)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-start justify-center py-6 px-4 sm:px-6">
      <div className="w-full max-w-2xl">
        {/* Form Container */}
        <div className="bg-zinc-900 border border-white/[0.07] rounded-2xl overflow-hidden shadow-2xl">

          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-200" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Tambah Produk Baru</h1>
                <p className="text-indigo-100 text-xs mt-0.5">Lengkapi data produk yang ingin ditambahkan</p>
              </div>
            </div>
            <button onClick={() => router.push('/products')} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">

            {/* Section: Informasi Dasar */}
            <div>
              <div className="bg-indigo-950/50 border border-indigo-500/20 rounded-xl px-4 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                  <div>
                    <p className="text-indigo-400 font-semibold text-sm">Informasi Dasar</p>
                    <p className="text-indigo-300/60 text-xs">Nama, SKU, dan deskripsi produk</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-zinc-400 text-sm mb-1.5 block">Nama Produk <span className="text-red-400">*</span></label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Masukkan nama produk"
                    className="w-full bg-zinc-800/60 border border-white/10 rounded-lg text-white text-sm px-3 py-2.5 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition" />
                </div>
                <div>
                  <label className="text-zinc-400 text-sm mb-1.5 block">SKU <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">#</span>
                    <input type="text" value={sku} onChange={e => setSku(e.target.value)} placeholder="Masukkan SKU"
                      className="w-full bg-zinc-800/60 border border-white/10 rounded-lg text-white text-sm pl-8 pr-3 py-2.5 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition" />
                  </div>
                </div>
                <div>
                  <label className="text-zinc-400 text-sm mb-1.5 block">Deskripsi</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Deskripsi produk (opsional)" rows={3} maxLength={500}
                    className="w-full bg-zinc-800/60 border border-white/10 rounded-lg text-white text-sm px-3 py-2.5 resize-none placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition" />
                  <p className="text-right text-[10px] text-zinc-500 mt-1">{description.length}/500</p>
                </div>
              </div>
            </div>

            {/* Section: Harga & Stok */}
            <div>
              <div className="bg-emerald-950/50 border border-emerald-500/20 rounded-xl px-4 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <p className="text-emerald-400 font-semibold text-sm">Harga & Stok</p>
                    <p className="text-emerald-300/60 text-xs">Tentukan harga dan jumlah stok</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-zinc-400 text-sm mb-1.5 block">Harga <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">Rp</span>
                    <input type="number" min={0} value={price || ''} onChange={e => setPrice(Number(e.target.value))} placeholder="0"
                      className="w-full bg-zinc-800/60 border border-white/10 rounded-lg text-white text-sm pl-10 pr-3 py-2.5 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 text-sm mb-1.5 block">Stok Awal <span className="text-red-400">*</span></label>
                    <input type="number" min={0} value={stock || ''} onChange={e => setStock(Number(e.target.value))} placeholder="0"
                      className="w-full bg-zinc-800/60 border border-white/10 rounded-lg text-white text-sm px-3 py-2.5 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition" />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-sm mb-1.5 block">Min. Stok <span className="text-red-400">*</span></label>
                    <input type="number" min={0} value={minStock || ''} onChange={e => setMinStock(Number(e.target.value))} placeholder="0"
                      className="w-full bg-zinc-800/60 border border-white/10 rounded-lg text-white text-sm px-3 py-2.5 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition" />
                  </div>
                </div>
                <div>
                  <label className="text-zinc-400 text-sm mb-1.5 block">Kategori <span className="text-red-400">*</span></label>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full bg-zinc-800/60 border border-white/10 rounded-lg text-white text-sm px-3 py-2.5 focus:outline-none focus:border-indigo-500/50 transition" style={{ background: '#27272a' }}>
                    <option value="" className="text-zinc-500">Pilih Kategori</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Preview inline */}
            {name.trim() && (
              <div className="bg-zinc-800/50 border border-white/[0.06] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-zinc-400 text-xs font-medium">Preview</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                    {name.trim().substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{name.trim()}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {category && <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-indigo-500/15 text-indigo-400">{category}</span>}
                      {sku && <span className="text-[10px] text-zinc-500 font-mono">#{sku}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white font-semibold text-sm">{formatRp(price)}</p>
                    <p className="text-zinc-500 text-[10px]">Stok: {stock}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-white/[0.07] pt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                <span>Field bertanda * wajib diisi</span>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => router.push('/products')} className="px-4 py-2 rounded-lg border border-white/20 text-zinc-300 text-sm font-medium hover:bg-white/5 transition">Batal</button>
                <button type="submit" disabled={loading} className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition flex items-center gap-2">
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3h11l5 5v11a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 3v5h8V3" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 21v-7h10v7" /></svg>
                      Simpan Produk
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
