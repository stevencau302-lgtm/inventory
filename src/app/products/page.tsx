'use client'

import { useEffect, useState } from 'react'
import { Product, Category, getProducts, getCategories, saveProducts, formatRp, getStatus, getStatusLabel, loadSampleData } from '@/lib/store'
import { useToast } from '@/components/Toast'
import ProductModal from '@/components/ProductModal'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let p = getProducts()
    let c = getCategories()
    if (p.length === 0) {
      const data = loadSampleData()
      p = data.products
      c = data.categories
    }
    setProducts(p)
    setCategories(c)
    setMounted(true)
  }, [])

  if (!mounted) return null

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || p.category === filterCat
    const matchStatus = !filterStatus || getStatus(p) === filterStatus
    return matchSearch && matchCat && matchStatus
  })

  const handleSave = (product: Product) => {
    let updated: Product[]
    const existing = products.findIndex(p => p.id === product.id)
    if (existing > -1) {
      updated = [...products]
      updated[existing] = product
      toast('Produk berhasil diperbarui!', 'success')
    } else {
      updated = [product, ...products]
      toast('Produk berhasil ditambahkan!', 'success')
    }
    setProducts(updated)
    saveProducts(updated)
    setModalOpen(false)
    setEditProduct(null)
  }

  const handleDelete = (id: string) => {
    if (!confirm('Hapus produk ini?')) return
    const updated = products.filter(p => p.id !== id)
    setProducts(updated)
    saveProducts(updated)
    toast('Produk dihapus!', 'success')
  }

  const handleEdit = (p: Product) => {
    setEditProduct(p)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Produk</h1>
          <p className="text-slate-500 text-sm mt-1">{filtered.length} produk ditemukan</p>
        </div>
        <button onClick={() => { setEditProduct(null); setModalOpen(true) }} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Produk
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama atau SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-10"
          />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="form-input w-full sm:w-auto">
          <option value="">Semua Kategori</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-input w-full sm:w-auto">
          <option value="">Semua Status</option>
          <option value="in-stock">Tersedia</option>
          <option value="low-stock">Stok Rendah</option>
          <option value="out-of-stock">Habis</option>
        </select>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Produk</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Kategori</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Stok</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Harga</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-white/[0.03] hover:bg-brand-500/5 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {p.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{p.name}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">{p.sku}</code>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-400">{p.category}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-300">{p.stock}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-400">{formatRp(p.price)}</td>
                  <td className="px-5 py-3.5"><StatusBadge product={p} /></td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEdit(p)} className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500 hover:text-white flex items-center justify-center transition">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">Tidak ada produk ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map(p => (
          <div key={p.id} className="glass-card p-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {p.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.category} &middot; <code className="text-slate-400">{p.sku}</code></p>
                  </div>
                  <StatusBadge product={p} />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">Stok</p>
                      <p className="text-sm font-semibold text-white">{p.stock}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">Harga</p>
                      <p className="text-sm font-semibold text-white">{formatRp(p.price)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(p)} className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500 hover:text-white flex items-center justify-center transition">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <p>Tidak ada produk ditemukan</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <ProductModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditProduct(null) }}
        onSave={handleSave}
        product={editProduct}
        categories={categories}
      />
    </div>
  )
}

function StatusBadge({ product }: { product: Product }) {
  const status = getStatus(product)
  const label = getStatusLabel(product)
  const classes = status === 'in-stock' ? 'badge-success' : status === 'low-stock' ? 'badge-warning' : 'badge-danger'
  return <span className={`badge ${classes}`}>{label}</span>
}
