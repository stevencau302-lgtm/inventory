'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Product, Category, getProducts, getCategories, saveProducts, uid, loadSampleData } from '@/lib/store'
import { useToast } from '@/components/Toast'

export default function NewProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [category, setCategory] = useState('')
  const [stock, setStock] = useState(0)
  const [price, setPrice] = useState(0)
  const [minStock, setMinStock] = useState(10)
  const [description, setDescription] = useState('')

  useEffect(() => {
    let c = getCategories()
    if (c.length === 0) { const data = loadSampleData(); c = data.categories }
    setCategories(c)
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !sku || !category) { toast('Lengkapi semua field wajib!', 'error'); return }
    setLoading(true)
    setTimeout(() => {
      const now = new Date().toISOString()
      const newProduct: Product = { id: uid(), name, sku, category, stock, price, minStock, description, createdAt: now, updatedAt: now }
      const products = getProducts()
      const updated = [newProduct, ...products]
      saveProducts(updated)
      toast(`${name} berhasil ditambahkan!`, 'success')
      router.push('/products')
    }, 400)
  }

  return (
    <div className="min-h-screen" style={{ background: '#0f0f0f', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="flex items-start justify-center min-h-screen py-10 px-4 sm:px-6">
        <div className="w-full max-w-5xl">

          {/* Back */}
          <button onClick={() => router.push('/products')} className="group flex items-center gap-2 text-sm font-semibold mb-6 transition-colors" style={{ color: '#e4e4e7' }}>
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Kembali
          </button>

          {/* Two Column */}
          <div className="flex flex-col lg:flex-row gap-6">

            {/* LEFT — Form */}
            <div className="flex-1 min-w-0">
              <div className="rounded-xl p-6 sm:p-8" style={{ background: '#1a1a1a' }}>
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#FDC800' }}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#1C293C"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-black" style={{ color: '#fafafa' }}>Produk Baru</h1>
                    <p className="text-sm" style={{ color: '#71717a' }}>Tambahkan produk ke inventory</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name & SKU */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: '#a1a1aa' }}>
                        <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /></svg>
                        Nama Produk
                      </label>
                      <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl text-sm px-4 py-3 font-medium focus:outline-none" style={{ background: '#0f0f0f', color: '#fafafa' }} placeholder="Masukkan nama produk" />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: '#a1a1aa' }}>
                        <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /></svg>
                        SKU
                      </label>
                      <input type="text" required value={sku} onChange={e => setSku(e.target.value)} className="w-full rounded-xl text-sm px-4 py-3 font-medium focus:outline-none" style={{ background: '#0f0f0f', color: '#fafafa' }} placeholder="SKU-001" />
                    </div>
                  </div>

                  {/* Category & Stock */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: '#a1a1aa' }}>
                        <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z" /></svg>
                        Kategori
                      </label>
                      <select required value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-xl text-sm px-4 py-3 font-medium focus:outline-none" style={{ background: '#0f0f0f', color: '#fafafa' }}>
                        <option value="">Pilih Kategori</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: '#a1a1aa' }}>
                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                        Stok Awal
                      </label>
                      <input type="number" min={0} value={stock} onChange={e => setStock(+e.target.value)} className="w-full rounded-xl text-sm px-4 py-3 font-medium focus:outline-none" style={{ background: '#0f0f0f', color: '#fafafa' }} />
                    </div>
                  </div>

                  {/* Price & Min Stock */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: '#a1a1aa' }}>
                        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
                        Harga (Rp)
                      </label>
                      <input type="number" min={0} value={price} onChange={e => setPrice(+e.target.value)} className="w-full rounded-xl text-sm px-4 py-3 font-medium focus:outline-none" style={{ background: '#0f0f0f', color: '#fafafa' }} placeholder="0" />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: '#a1a1aa' }}>
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                        Min. Stok
                      </label>
                      <input type="number" min={0} value={minStock} onChange={e => setMinStock(+e.target.value)} className="w-full rounded-xl text-sm px-4 py-3 font-medium focus:outline-none" style={{ background: '#0f0f0f', color: '#fafafa' }} />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: '#a1a1aa' }}>
                      <svg className="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                      Deskripsi <span className="normal-case font-normal" style={{ color: '#71717a' }}>(opsional)</span>
                    </label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full rounded-xl text-sm px-4 py-3 resize-none font-medium focus:outline-none" style={{ background: '#0f0f0f', color: '#fafafa' }} placeholder="Deskripsi produk..." />
                  </div>

                  {/* Submit */}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => router.push('/products')} className="px-5 py-3 rounded-lg text-sm font-bold transition-all" style={{ background: '#0f0f0f', color: '#e4e4e7' }}>Batal</button>
                    <button type="submit" disabled={loading} className="flex-1 py-3.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: '#FDC800', color: '#1C293C' }}>
                      {loading ? 'Menyimpan...' : (<><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg>Simpan Produk</>)}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* RIGHT — Preview */}
            <div className="lg:w-[300px] shrink-0">
              <div className="lg:sticky lg:top-8 space-y-4">
                <div className="rounded-xl overflow-hidden" style={{ background: '#1a1a1a' }}>
                  <div className="px-5 py-3.5 flex items-center gap-2 font-bold text-sm" style={{ background: '#FDC800', color: '#1C293C' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Preview
                  </div>
                  {name ? (
                    <div className="px-5 py-4 space-y-3">
                      <div className="flex items-center gap-3 pb-3" style={{ borderBottom: '1px solid #27272a' }}>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: '#432DD7', color: '#fff' }}>{name.substring(0, 2).toUpperCase()}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: '#fafafa' }}>{name}</p>
                          <p className="text-[10px]" style={{ color: '#71717a' }}>{sku || 'SKU-000'} · {category || 'Kategori'}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-xs" style={{ color: '#71717a' }}>Stok</span><span className="text-sm font-bold" style={{ color: '#fafafa' }}>{stock}</span></div>
                        <div className="flex justify-between"><span className="text-xs" style={{ color: '#71717a' }}>Harga</span><span className="text-sm font-bold" style={{ color: '#fafafa' }}>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)}</span></div>
                        <div className="flex justify-between"><span className="text-xs" style={{ color: '#71717a' }}>Min. Stok</span><span className="text-sm font-bold" style={{ color: stock <= minStock ? '#D97706' : '#fafafa' }}>{minStock}</span></div>
                      </div>
                      {description && (
                        <div className="rounded-lg p-3 mt-2" style={{ background: '#0f0f0f' }}>
                          <p className="text-[11px]" style={{ color: '#a1a1aa' }}>{description}</p>
                        </div>
                      )}
                      {stock <= minStock && stock > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-md" style={{ background: 'rgba(217, 119, 6, 0.15)' }}>
                          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#D97706"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                          <span className="text-[10px] font-semibold" style={{ color: '#D97706' }}>Stok di bawah minimum</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-5 py-8 text-center">
                      <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#0f0f0f' }}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#71717a"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                      </div>
                      <p className="text-xs font-medium" style={{ color: '#71717a' }}>Isi form untuk melihat preview produk</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
