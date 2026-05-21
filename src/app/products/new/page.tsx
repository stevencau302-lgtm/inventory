'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Product, Category, getProducts, getCategories, saveProducts, uid, loadSampleData, saveProduct, fetchCategories } from '@/lib/store'
import { useToast } from '@/components/Toast'
import { Package, DollarSign, ArrowLeft, Save } from 'lucide-react'

function formatRupiah(value: number): string {
  if (value === 0) return 'Rp 0'
  return 'Rp ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function parseRupiah(str: string): number {
  const cleaned = str.replace(/[^0-9]/g, '')
  return cleaned === '' ? 0 : parseInt(cleaned, 10)
}

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

  // Display state for formatted fields
  const [priceDisplay, setPriceDisplay] = useState('Rp 0')
  const [stockDisplay, setStockDisplay] = useState('0')
  const [minStockDisplay, setMinStockDisplay] = useState('10')

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
      saveProduct(newProduct)
      toast(`${name} berhasil ditambahkan!`, 'success')
      router.push('/products')
    }, 400)
  }

  // Clear-on-focus handlers
  const handlePriceFocus = () => {
    if (price === 0) setPriceDisplay('')
  }
  const handlePriceBlur = () => {
    if (priceDisplay === '' || parseRupiah(priceDisplay) === 0) {
      setPrice(0)
      setPriceDisplay(formatRupiah(0))
    }
  }
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const num = parseRupiah(raw)
    setPrice(num)
    setPriceDisplay(num === 0 && raw === '' ? '' : formatRupiah(num))
  }

  const handleStockFocus = () => {
    if (stock === 0) setStockDisplay('')
  }
  const handleStockBlur = () => {
    if (stockDisplay === '') {
      setStock(0)
      setStockDisplay('0')
    }
  }
  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    const num = raw === '' ? 0 : parseInt(raw, 10)
    setStock(num)
    setStockDisplay(raw)
  }

  const handleMinStockFocus = () => {
    if (minStock === 0) setMinStockDisplay('')
  }
  const handleMinStockBlur = () => {
    if (minStockDisplay === '') {
      setMinStock(0)
      setMinStockDisplay('0')
    }
  }
  const handleMinStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    const num = raw === '' ? 0 : parseInt(raw, 10)
    setMinStock(num)
    setMinStockDisplay(raw)
  }

  const inputClass = 'w-full rounded-xl text-sm px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-[#FDC800]/40 transition-all'
  const inputStyle = { background: '#0f0f0f', color: '#fafafa' }
  const labelClass = 'text-xs font-bold uppercase tracking-wider mb-2 block'
  const labelStyle = { color: '#a1a1aa' }

  return (
    <div className="min-h-screen" style={{ background: '#0f0f0f', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="flex items-start justify-center min-h-screen py-10 px-4 sm:px-6">
        <div className="w-full max-w-5xl">

          {/* Back */}
          <button onClick={() => router.push('/products')} className="group flex items-center gap-2 text-sm font-semibold mb-6 transition-colors" style={{ color: '#e4e4e7' }}>
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Kembali
          </button>

          {/* Two Column */}
          <div className="flex flex-col lg:flex-row gap-6">

            {/* LEFT — Form */}
            <div className="flex-1 min-w-0">
              <div className="rounded-xl p-6 sm:p-8" style={{ background: '#1a1a1a' }}>
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#FDC800' }}>
                    <Package size={24} color="#1C293C" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black" style={{ color: '#fafafa' }}>Produk Baru</h1>
                    <p className="text-sm" style={{ color: '#71717a' }}>Tambahkan produk ke inventory</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">

                  {/* Section: Informasi Dasar */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1px solid rgba(253, 200, 0, 0.2)' }}>
                      <Package size={16} className="text-[#FDC800]" />
                      <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#FDC800' }}>Informasi Dasar</h3>
                    </div>

                    <div className="space-y-4">
                      {/* Nama Produk */}
                      <div>
                        <label className={labelClass} style={labelStyle}>Nama Produk</label>
                        <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputClass} style={inputStyle} placeholder="Masukkan nama produk" />
                      </div>

                      {/* SKU & Kategori */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass} style={labelStyle}>Kode Produk / SKU</label>
                          <input type="text" required value={sku} onChange={e => setSku(e.target.value)} className={inputClass} style={inputStyle} placeholder="SKU-001" />
                        </div>
                        <div>
                          <label className={labelClass} style={labelStyle}>Kategori</label>
                          <select required value={category} onChange={e => setCategory(e.target.value)} className={`${inputClass} appearance-none`} style={{ ...inputStyle, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '40px' }}>
                            <option value="">Pilih Kategori</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Deskripsi */}
                      <div>
                        <label className={labelClass} style={labelStyle}>Deskripsi <span className="normal-case font-normal" style={{ color: '#71717a' }}>(opsional)</span></label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={`${inputClass} resize-none`} style={inputStyle} placeholder="Deskripsi produk..." />
                      </div>
                    </div>
                  </div>

                  {/* Section: Harga & Stok */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1px solid rgba(67, 45, 215, 0.3)' }}>
                      <DollarSign size={16} className="text-[#432DD7]" />
                      <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#432DD7' }}>Harga & Stok</h3>
                    </div>

                    <div className="space-y-4">
                      {/* Harga per Unit */}
                      <div>
                        <label className={labelClass} style={labelStyle}>Harga per Unit</label>
                        <input
                          type="text"
                          required
                          value={priceDisplay}
                          onChange={handlePriceChange}
                          onFocus={handlePriceFocus}
                          onBlur={handlePriceBlur}
                          className={inputClass}
                          style={inputStyle}
                          placeholder="Rp 0"
                        />
                      </div>

                      {/* Stok Awal & Minimum Stok */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass} style={labelStyle}>Stok Awal</label>
                          <input
                            type="text"
                            required
                            value={stockDisplay}
                            onChange={handleStockChange}
                            onFocus={handleStockFocus}
                            onBlur={handleStockBlur}
                            className={inputClass}
                            style={inputStyle}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className={labelClass} style={labelStyle}>Minimum Stok</label>
                          <input
                            type="text"
                            required
                            value={minStockDisplay}
                            onChange={handleMinStockChange}
                            onFocus={handleMinStockFocus}
                            onBlur={handleMinStockBlur}
                            className={inputClass}
                            style={inputStyle}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => router.push('/products')} className="px-5 py-3 rounded-lg text-sm font-bold transition-all" style={{ background: '#0f0f0f', color: '#e4e4e7' }}>Batal</button>
                    <button type="submit" disabled={loading} className="flex-1 py-3.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: '#FDC800', color: '#1C293C' }}>
                      {loading ? 'Menyimpan...' : (<><Save size={16} />Simpan Produk</>)}
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
                        <div className="flex justify-between"><span className="text-xs" style={{ color: '#71717a' }}>Harga</span><span className="text-sm font-bold" style={{ color: '#fafafa' }}>{formatRupiah(price)}</span></div>
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
                        <Package size={20} color="#71717a" />
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
