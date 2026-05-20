'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Product, Category, getProducts, getCategories, saveProducts, formatRp, uid, loadSampleData } from '@/lib/store'
import { useToast } from '@/components/Toast'

export default function NewProductPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form state
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

  const getInitials = () => {
    if (!name.trim()) return '?'
    return name.trim().substring(0, 2).toUpperCase()
  }

  const getStatusBadge = () => {
    if (stock === 0) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-400">Habis</span>
    }
    if (stock > 0 && stock <= minStock) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400">Stok Rendah</span>
    }
    if (stock > minStock && stock > 0) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400">Tersedia</span>
    }
    return null
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      toast('Nama produk wajib diisi', 'error')
      return
    }
    if (!sku.trim()) {
      toast('SKU wajib diisi', 'error')
      return
    }
    if (!category) {
      toast('Kategori wajib dipilih', 'error')
      return
    }

    setLoading(true)

    setTimeout(() => {
      const now = new Date().toISOString()
      const newProduct: Product = {
        id: uid(),
        name: name.trim(),
        sku: sku.trim(),
        category,
        stock,
        price,
        minStock,
        description: description.trim(),
        createdAt: now,
        updatedAt: now,
      }

      const existingProducts = getProducts()
      saveProducts([newProduct, ...existingProducts])

      toast('Produk berhasil ditambahkan!', 'success')
      router.push('/products')
    }, 500)
  }

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Header area */}
      <div className="border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/products" className="text-sm text-zinc-400 hover:text-white transition flex items-center gap-1">
              ← Kembali
            </Link>
            <span className="text-zinc-600 text-sm">/</span>
            <span className="text-sm text-zinc-500">Master Produk</span>
            <span className="text-zinc-600 text-sm">/</span>
            <span className="text-sm text-zinc-400">Tambah Produk</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Tambah Produk Baru</h1>
          <p className="text-zinc-400 text-sm mt-1">Lengkapi data produk yang ingin ditambahkan</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Form - Left Column */}
          <div className="md:col-span-7">
            <div className="bg-zinc-900 border border-white/[0.07] rounded-2xl p-6">
              {/* Section: Informasi Dasar */}
              <div className="border-b border-white/[0.07] mb-5 pb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                  <h2 className="text-base font-semibold text-white">Informasi Dasar</h2>
                </div>
              </div>

              <div className="space-y-4">
                {/* Nama Produk */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Nama Produk <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nama produk"
                    className="form-input w-full"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    SKU <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">#</span>
                    <input
                      type="text"
                      value={sku}
                      onChange={e => setSku(e.target.value)}
                      placeholder="Masukkan SKU"
                      className="form-input w-full pl-8"
                    />
                  </div>
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Deskripsi
                  </label>
                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Deskripsi produk (opsional)"
                      rows={3}
                      maxLength={500}
                      className="form-input w-full resize-none"
                    />
                    <span className="absolute bottom-2 right-3 text-xs text-zinc-500">
                      {description.length}/500
                    </span>
                  </div>
                </div>
              </div>

              {/* Section: Harga & Stok */}
              <div className="border-b border-white/[0.07] mb-5 pb-3 mt-8">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-base font-semibold text-white">Harga & Stok</h2>
                </div>
              </div>

              <div className="space-y-4">
                {/* Harga */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Harga <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">Rp</span>
                    <input
                      type="number"
                      min={0}
                      value={price || ''}
                      onChange={e => setPrice(Number(e.target.value))}
                      placeholder="0"
                      className="form-input w-full pl-10"
                    />
                  </div>
                </div>

                {/* Stok Awal + Min Stok */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                      Stok Awal <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={stock || ''}
                      onChange={e => setStock(Number(e.target.value))}
                      placeholder="0"
                      className="form-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                      Min. Stok <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={minStock || ''}
                      onChange={e => setMinStock(Number(e.target.value))}
                      placeholder="0"
                      className="form-input w-full"
                    />
                  </div>
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Kategori <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="form-input w-full"
                    style={{ color: '#fafafa', background: '#18181b' }}
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Preview - Right Column */}
          <div className="hidden md:block md:col-span-5">
            <div className="sticky top-6">
              <div className="bg-zinc-900 border border-white/[0.07] rounded-2xl p-6">
                {/* Preview Title */}
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="text-base font-semibold text-white">Preview Produk</h3>
                </div>

                <div className="border-t border-white/[0.07] pt-5">
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-16 h-16 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                      {getInitials()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-white truncate">
                        {name.trim() || 'Nama Produk'}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-zinc-800 text-xs text-zinc-400">
                        {category || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">SKU</span>
                      <span className="text-sm font-mono text-zinc-300">{sku || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">Harga</span>
                      <span className="text-sm font-semibold text-white">{formatRp(price)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">Stok / Min</span>
                      <span className="text-sm text-zinc-300">{stock} / {minStock}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">Status</span>
                      {getStatusBadge()}
                    </div>
                  </div>

                  {/* Divider + Submit */}
                  <div className="border-t border-white/[0.07] mt-5 pt-5">
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Menyimpan...
                        </>
                      ) : (
                        'Simpan Produk'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#09090B] border-t border-white/[0.06] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-40">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Menyimpan...
            </>
          ) : (
            'Simpan Produk'
          )}
        </button>
      </div>
    </div>
  )
}
